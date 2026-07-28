/**
 * Daily Payment Reconciliation Cron Job
 *
 * Runs daily at 09:00 SAST to reconcile debit order payments
 * from the previous day's NetCash statement.
 *
 * Vercel Cron: 0 7 * * * (07:00 UTC = 09:00 SAST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { netcashStatementService } from '@/lib/payments/netcash-statement-service';
import { withCronLogging, verifyCronSecret, cronLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ReconciliationResult {
  date: string;
  totalProcessed: number;
  successful: number;
  unpaid: number;
  notFound: number;
  errors: string[];
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await withCronLogging('payment-reconciliation', 'vercel_cron', async () => {
      const reconciliation = await runReconciliation();
      return {
        records_processed: reconciliation.totalProcessed,
        records_failed: reconciliation.errors.length,
        records_skipped: reconciliation.notFound,
        execution_details: reconciliation as unknown as Record<string, unknown>,
      };
    });

    return NextResponse.json({ success: true, logId: result.logId, durationMs: result.durationMs, ...result.execution_details });
  } catch (error) {
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const customDate = body.date ? new Date(body.date) : undefined;

    const result = await withCronLogging('payment-reconciliation', 'manual', async () => {
      const reconciliation = await runReconciliation(customDate);
      return {
        records_processed: reconciliation.totalProcessed,
        records_failed: reconciliation.errors.length,
        records_skipped: reconciliation.notFound,
        execution_details: reconciliation as unknown as Record<string, unknown>,
      };
    });

    return NextResponse.json({ success: true, logId: result.logId, durationMs: result.durationMs, ...result.execution_details });
  } catch (error) {
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function runReconciliation(customDate?: Date): Promise<ReconciliationResult> {
  const supabase = await createClient();
  
  // Default to yesterday (statements available from 08:30 for previous day)
  const reconciliationDate = customDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateStr = reconciliationDate.toISOString().split('T')[0];

  cronLogger.info(`Starting payment reconciliation for ${dateStr}`);

  const result: ReconciliationResult = {
    date: dateStr,
    totalProcessed: 0,
    successful: 0,
    unpaid: 0,
    notFound: 0,
    errors: [],
  };

  // Get pending invoices that were due on or before the reconciliation date
  const { data: pendingInvoices, error: invoiceError } = await supabase
    .from('customer_invoices')
    .select(`
      id,
      invoice_number,
      customer_id,
      total_amount,
      due_date,
      status,
      customers (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .in('status', ['draft', 'sent', 'partial', 'overdue'])
    .lte('due_date', dateStr)
    .order('due_date', { ascending: true });

  if (invoiceError) {
    result.errors.push(`Failed to fetch invoices: ${invoiceError.message}`);
    return result;
  }

  if (!pendingInvoices || pendingInvoices.length === 0) {
    cronLogger.info('No pending invoices to reconcile');
    return result;
  }

  cronLogger.info(`Found ${pendingInvoices.length} pending invoices to reconcile`);

  // Get pending orders with debit order payment method
  const { data: pendingOrders, error: orderError } = await supabase
    .from('consumer_orders')
    .select(`
      id,
      order_number,
      customer_id,
      package_price,
      installation_fee,
      router_fee,
      payment_status,
      payment_method,
      created_at
    `)
    .eq('payment_status', 'pending')
    .eq('payment_method', 'debit_order')
    .order('created_at', { ascending: true });

  if (orderError) {
    result.errors.push(`Failed to fetch orders: ${orderError.message}`);
  }

  // Combine references to check
  const references: string[] = [];
  const referenceMap = new Map<string, { type: 'invoice' | 'order'; id: string; amount: number }>();

  for (const invoice of pendingInvoices) {
    const ref = invoice.invoice_number;
    references.push(ref);
    referenceMap.set(ref.toLowerCase(), { type: 'invoice', id: invoice.id, amount: invoice.total_amount });
  }

  if (pendingOrders) {
    for (const order of pendingOrders) {
      const ref = order.order_number;
      // Compute total from available columns (total_amount doesn't exist in consumer_orders)
      const orderTotal = Number(order.package_price || 0) + Number(order.installation_fee || 0) + Number(order.router_fee || 0);
      references.push(ref);
      references.push(`PAY-${ref}`);
      referenceMap.set(ref.toLowerCase(), { type: 'order', id: order.id, amount: orderTotal });
      referenceMap.set(`pay-${ref}`.toLowerCase(), { type: 'order', id: order.id, amount: orderTotal });
    }
  }

  // Get NetCash statement for the date
  const statement = await netcashStatementService.getStatement(reconciliationDate);

  if (!statement.success) {
    result.errors.push(`Failed to get NetCash statement: ${statement.error}`);
    
      return result;
  }

  // Find matching debit order results
  const debitResults = netcashStatementService.findDebitOrderResults(statement, references);

  cronLogger.info(`Found ${debitResults.length} matching transactions in statement`);

  // Process each result
  for (const debitResult of debitResults) {
    result.totalProcessed++;

    const refKey = debitResult.accountReference.toLowerCase();
    const mapped = referenceMap.get(refKey);

    if (!mapped) {
      result.notFound++;
      continue;
    }

    try {
      if (debitResult.status === 'successful') {
        result.successful++;

        if (mapped.type === 'invoice') {
          await updateInvoiceAsPaid(supabase, mapped.id, debitResult);
        } else {
          await updateOrderAsPaid(supabase, mapped.id, debitResult);
        }
      } else if (debitResult.status === 'unpaid') {
        result.unpaid++;

        if (mapped.type === 'invoice') {
          await markInvoiceUnpaid(supabase, mapped.id, debitResult);
        } else {
          await markOrderUnpaid(supabase, mapped.id, debitResult);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to process ${debitResult.accountReference}: ${errorMsg}`);
    }
  }

  return result;
}

// ============================================================================
// Pure payload builders (schema-correct; unit-tested in
// __tests__/api/cron/payment-reconciliation-payloads.test.ts).
//
// These exist because the previous writers targeted columns that DO NOT EXIST
// (customer_invoices.payment_reference/payment_method; payment_transactions
// .payment_type/netcash_reference/netcash_response/processed_at/transaction_date
// /failed_at). Postgres rejected every write, but the calls never checked the
// returned error — so reconciliation reported success while persisting nothing.
// Keeping the row shapes as pure functions lets a test lock the column contract.
// ============================================================================

/** customer_invoices update for a successful collection. */
export function buildPaidInvoiceUpdate(amount: number, nowISO: string) {
  return { status: 'paid', amount_paid: amount, paid_at: nowISO, updated_at: nowISO };
}

/** customer_invoices update for a failed/unpaid collection. */
export function buildUnpaidInvoiceUpdate(reason: string | undefined, code: string | undefined, nowISO: string) {
  return {
    status: 'overdue',
    notes: `Debit order failed: ${reason || 'Unknown reason'} (Code: ${code || 'N/A'})`,
    updated_at: nowISO,
  };
}

interface TxnInput {
  invoiceId?: string;
  orderId?: string;
  amount: number;
  reference: string;        // NetCash account reference (= invoice/order number)
  nowISO: string;
  outcome: 'completed' | 'failed';
  unpaidCode?: string;
  unpaidReason?: string;
  response?: unknown;       // raw statement result, stored as provider_response (jsonb)
}

/** payment_transactions row for a reconciled debit (completed or failed). */
export function buildPaymentTxnRow(input: TxnInput): Record<string, unknown> {
  const subject = input.invoiceId ? `INV-${input.invoiceId}` : input.orderId;
  const prefix = input.outcome === 'failed' ? 'NETCASH-FAILED-' : 'NETCASH-RECONCILE-';
  const row: Record<string, unknown> = {
    transaction_id: `${prefix}${subject}-${Date.now()}`,
    amount: input.amount,
    currency: 'ZAR',
    status: input.outcome,
    payment_method: 'debit_order',
    provider: 'netcash',
    provider_reference: input.reference,
    reference: input.reference,
    reconciliation_source: 'netcash_statement',
  };
  if (input.invoiceId) row.customer_invoice_id = input.invoiceId;
  if (input.orderId) row.order_id = input.orderId;
  if (input.outcome === 'completed') {
    row.completed_at = input.nowISO;
    if (input.response !== undefined) row.provider_response = input.response;
  } else {
    row.failure_reason = `${input.unpaidReason || 'Unknown'} (Code: ${input.unpaidCode || 'N/A'})`;
    row.error_code = input.unpaidCode ?? null;
    row.error_message = input.unpaidReason ?? null;
  }
  return row;
}

async function updateInvoiceAsPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  debitResult: { amount: number; transactionDate: string; accountReference: string }
) {
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('customer_invoices')
    .update(buildPaidInvoiceUpdate(debitResult.amount, now))
    .eq('id', invoiceId);
  if (updateError) throw new Error(`customer_invoices paid update failed: ${updateError.message}`);

  // Idempotency check: don't insert duplicate payment transaction if one already exists
  const { data: existingPaid } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('customer_invoice_id', invoiceId)
    .eq('status', 'completed')
    .limit(1);

  if (existingPaid && existingPaid.length > 0) {
    // Already recorded this completed payment, skip insert
    return;
  }

  // Create payment transaction record linked to the invoice for Zoho Books sync
  const { error: insertError } = await supabase
    .from('payment_transactions')
    .insert(buildPaymentTxnRow({
      invoiceId,
      amount: debitResult.amount,
      reference: debitResult.accountReference,
      nowISO: now,
      outcome: 'completed',
      response: debitResult,
    }));
  if (insertError) throw new Error(`payment_transactions insert failed: ${insertError.message}`);
}

async function updateOrderAsPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  debitResult: { amount: number; transactionDate: string; accountReference: string; transactionCode: string }
) {
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('consumer_orders')
    .update({
      payment_status: 'paid',
      total_paid: debitResult.amount,
      updated_at: now,
    })
    .eq('id', orderId);
  if (updateError) throw new Error(`consumer_orders paid update failed: ${updateError.message}`);

  // Idempotency check: don't insert duplicate payment transaction if one already exists
  const { data: existingPaid } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'completed')
    .limit(1);
  if (existingPaid && existingPaid.length > 0) return;

  const { error: insertError } = await supabase
    .from('payment_transactions')
    .insert(buildPaymentTxnRow({
      orderId,
      amount: debitResult.amount,
      reference: debitResult.accountReference,
      nowISO: now,
      outcome: 'completed',
      response: debitResult,
    }));
  if (insertError) throw new Error(`payment_transactions insert failed: ${insertError.message}`);
}

async function markInvoiceUnpaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  debitResult: { unpaidCode?: string; unpaidReason?: string; amount: number; transactionDate: string; accountReference: string }
) {
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('customer_invoices')
    .update(buildUnpaidInvoiceUpdate(debitResult.unpaidReason, debitResult.unpaidCode, now))
    .eq('id', invoiceId);
  if (updateError) throw new Error(`customer_invoices unpaid update failed: ${updateError.message}`);

  // Idempotency check: don't insert duplicate payment transaction if one already exists
  const { data: existingFailed } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('customer_invoice_id', invoiceId)
    .eq('status', 'failed')
    .limit(1);

  if (existingFailed && existingFailed.length > 0) {
    // Already recorded this failed payment, skip insert
    return;
  }

  // Create failed payment transaction record linked to the invoice
  const { error: insertError } = await supabase
    .from('payment_transactions')
    .insert(buildPaymentTxnRow({
      invoiceId,
      amount: debitResult.amount,
      reference: debitResult.accountReference,
      nowISO: now,
      outcome: 'failed',
      unpaidCode: debitResult.unpaidCode,
      unpaidReason: debitResult.unpaidReason,
    }));
  if (insertError) throw new Error(`payment_transactions failed-insert failed: ${insertError.message}`);
}

async function markOrderUnpaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  debitResult: { unpaidCode?: string; unpaidReason?: string; amount: number; transactionCode: string; accountReference: string }
) {
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('consumer_orders')
    .update({
      payment_status: 'failed',
      updated_at: now,
    })
    .eq('id', orderId);
  if (updateError) throw new Error(`consumer_orders unpaid update failed: ${updateError.message}`);

  // Create failed payment transaction record
  const { error: insertError } = await supabase
    .from('payment_transactions')
    .insert(buildPaymentTxnRow({
      orderId,
      amount: debitResult.amount,
      reference: debitResult.accountReference,
      nowISO: now,
      outcome: 'failed',
      unpaidCode: debitResult.unpaidCode,
      unpaidReason: debitResult.unpaidReason,
    }));
  if (insertError) throw new Error(`payment_transactions failed-insert failed: ${insertError.message}`);
}

