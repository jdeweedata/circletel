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
import { handleFailedDebit, hasRecentFailure } from '@/lib/billing/failed-debit-handler';
import { withCronLogging, verifyCronSecret, cronLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 300; // rolling window fetches several statements (polling each)

// How many days of statements each run re-reads. NetCash posts debit-order
// result lines (TDD/SDD/DRU) onto the ACTION-DATE statement only once the item
// settles — 1-2 days later for TwoDay — so a yesterday-only pass permanently
// misses them (observed June/July 2026). Posting is idempotent, so re-reading
// the same statement is safe.
const RECON_WINDOW_DAYS = Number(process.env.RECON_WINDOW_DAYS) || 5;

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
      const reconciliation = await runReconciliationWindow();
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

/**
 * Reconcile each of the last RECON_WINDOW_DAYS days of NetCash statements.
 * "Statement not available" on recent dates is expected (published 08:30 the
 * next day) and is not treated as an error.
 */
async function runReconciliationWindow(days = RECON_WINDOW_DAYS): Promise<ReconciliationResult> {
  const aggregate: ReconciliationResult = {
    date: `last ${days} days`,
    totalProcessed: 0,
    successful: 0,
    unpaid: 0,
    notFound: 0,
    errors: [],
  };

  for (let back = 1; back <= days; back++) {
    const date = new Date(Date.now() - back * 24 * 60 * 60 * 1000);
    const dayResult = await runReconciliation(date);
    aggregate.totalProcessed += dayResult.totalProcessed;
    aggregate.successful += dayResult.successful;
    aggregate.unpaid += dayResult.unpaid;
    aggregate.notFound += dayResult.notFound;
    aggregate.errors.push(
      ...dayResult.errors.filter((e) => !e.includes('Statement not available'))
    );
  }

  cronLogger.info(
    `Reconciliation window complete: ${aggregate.successful} paid, ${aggregate.unpaid} unpaid across ${days} days`
  );
  return aggregate;
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
  interface MappedRef {
    type: 'invoice' | 'order';
    id: string;
    amount: number;
    reference: string;
    customerId: string | null;
  }
  const references: string[] = [];
  const referenceMap = new Map<string, MappedRef>();

  for (const invoice of pendingInvoices) {
    const ref = invoice.invoice_number;
    references.push(ref);
    referenceMap.set(ref.toLowerCase(), {
      type: 'invoice',
      id: invoice.id,
      amount: invoice.total_amount,
      reference: ref,
      customerId: invoice.customer_id,
    });
  }

  if (pendingOrders) {
    for (const order of pendingOrders) {
      const ref = order.order_number;
      // Compute total from available columns (total_amount doesn't exist in consumer_orders)
      const orderTotal = Number(order.package_price || 0) + Number(order.installation_fee || 0) + Number(order.router_fee || 0);
      references.push(ref);
      references.push(`PAY-${ref}`);
      const mappedOrder: MappedRef = { type: 'order', id: order.id, amount: orderTotal, reference: ref, customerId: order.customer_id };
      referenceMap.set(ref.toLowerCase(), mappedOrder);
      referenceMap.set(`pay-${ref}`.toLowerCase(), mappedOrder);
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
          await updateInvoiceAsPaid(supabase, mapped, debitResult);
        } else {
          await updateOrderAsPaid(supabase, mapped, debitResult);
        }
      } else if (debitResult.status === 'unpaid') {
        result.unpaid++;

        if (mapped.type === 'invoice') {
          await markInvoiceUnpaid(mapped.id, debitResult);
        } else {
          await markOrderUnpaid(supabase, mapped, debitResult);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to process ${debitResult.accountReference}: ${errorMsg}`);
    }
  }

  return result;
}

/** The paid timestamp: the statement's action date at 08:00 SAST (matches how
 * historical debit collections were posted), falling back to now. */
function debitPaidAt(transactionDate: string | undefined): string {
  return transactionDate ? `${transactionDate}T08:00:00+02:00` : new Date().toISOString();
}

async function updateInvoiceAsPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mapped: { id: string; reference: string; customerId: string | null },
  debitResult: { amount: number; transactionDate: string; accountReference: string; transactionCode: string }
) {
  const now = new Date().toISOString();
  const paidAt = debitPaidAt(debitResult.transactionDate);

  // Idempotency: one completed transaction per invoice. Checked BEFORE any
  // write so re-reading the same statement (rolling window) is a no-op.
  const { data: existingPaid } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('customer_invoice_id', mapped.id)
    .eq('status', 'completed')
    .limit(1);

  if (existingPaid && existingPaid.length > 0) {
    return;
  }

  const { error: txError } = await supabase.from('payment_transactions').insert({
    transaction_id: `NETCASH-RECONCILE-${mapped.reference}`,
    reference: mapped.reference,
    provider: 'netcash',
    amount: debitResult.amount,
    currency: 'ZAR',
    status: 'completed',
    payment_method: 'debit_order',
    customer_id: mapped.customerId,
    customer_invoice_id: mapped.id,
    provider_reference: debitResult.accountReference,
    provider_response: {
      amount: debitResult.amount,
      status: 'successful',
      transactionCode: debitResult.transactionCode,
      transactionDate: debitResult.transactionDate,
      accountReference: debitResult.accountReference,
    },
    initiated_at: now,
    completed_at: paidAt,
    reconciliation_source: 'netcash_statement',
  });

  if (txError) {
    cronLogger.error(`Reconciliation: failed to insert payment transaction for ${mapped.reference}`, { error: txError.message });
    throw new Error(`payment_transactions insert failed: ${txError.message}`);
  }

  const { error: invError } = await supabase
    .from('customer_invoices')
    .update({
      status: 'paid',
      amount_paid: debitResult.amount,
      paid_at: paidAt,
      payment_collection_method: 'debit_order',
      updated_at: now,
    })
    .eq('id', mapped.id);

  if (invError) {
    cronLogger.error(`Reconciliation: failed to mark ${mapped.reference} paid`, { error: invError.message });
    throw new Error(`customer_invoices update failed: ${invError.message}`);
  }

  cronLogger.info(`Reconciliation: ${mapped.reference} marked paid (R${debitResult.amount}, ${debitResult.transactionDate})`);
}

async function updateOrderAsPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mapped: { id: string; reference: string; customerId: string | null },
  debitResult: { amount: number; transactionDate: string; accountReference: string; transactionCode: string }
) {
  const now = new Date().toISOString();
  const paidAt = debitPaidAt(debitResult.transactionDate);

  // Idempotency: one completed transaction per order
  const { data: existingPaid } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('order_id', mapped.id)
    .eq('status', 'completed')
    .limit(1);

  if (existingPaid && existingPaid.length > 0) {
    return;
  }

  const { error: txError } = await supabase.from('payment_transactions').insert({
    transaction_id: `NETCASH-RECONCILE-${debitResult.accountReference}`,
    reference: mapped.reference,
    provider: 'netcash',
    amount: debitResult.amount,
    currency: 'ZAR',
    status: 'completed',
    payment_method: 'debit_order',
    customer_id: mapped.customerId,
    order_id: mapped.id,
    provider_reference: debitResult.accountReference,
    provider_response: {
      amount: debitResult.amount,
      status: 'successful',
      transactionCode: debitResult.transactionCode,
      transactionDate: debitResult.transactionDate,
      accountReference: debitResult.accountReference,
    },
    initiated_at: now,
    completed_at: paidAt,
    reconciliation_source: 'netcash_statement',
  });

  if (txError) {
    cronLogger.error(`Reconciliation: failed to insert payment transaction for order ${mapped.reference}`, { error: txError.message });
    throw new Error(`payment_transactions insert failed: ${txError.message}`);
  }

  const { error: orderError } = await supabase
    .from('consumer_orders')
    .update({
      payment_status: 'paid',
      updated_at: now,
    })
    .eq('id', mapped.id);

  if (orderError) {
    cronLogger.error(`Reconciliation: failed to mark order ${mapped.reference} paid`, { error: orderError.message });
    throw new Error(`consumer_orders update failed: ${orderError.message}`);
  }
}

/**
 * A DRU/unpaid line: delegate to the failed-debit handler, which records the
 * failure (debit_order_failed_at + reason, collection method 'debit_order_failed')
 * and sends the customer a Pay Now link to settle another way. hasRecentFailure
 * guards against re-processing the same DRU line on every rolling-window pass.
 */
async function markInvoiceUnpaid(
  invoiceId: string,
  debitResult: { unpaidCode?: string; unpaidReason?: string; amount: number; transactionDate: string; accountReference: string }
) {
  if (await hasRecentFailure(invoiceId, 24 * 7)) {
    return;
  }

  await handleFailedDebit({
    invoiceId,
    transactionRef: debitResult.accountReference,
    failureReason: debitResult.unpaidReason || 'Unknown reason',
    failureCode: debitResult.unpaidCode,
    failedAt: debitResult.transactionDate ? new Date(debitResult.transactionDate) : new Date(),
  });
}

async function markOrderUnpaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mapped: { id: string; reference: string; customerId: string | null },
  debitResult: { unpaidCode?: string; unpaidReason?: string; amount: number; transactionCode: string; accountReference: string }
) {
  const now = new Date().toISOString();

  // Idempotency: one failed transaction per order per reference
  const { data: existingFailed } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('order_id', mapped.id)
    .eq('status', 'failed')
    .limit(1);

  if (existingFailed && existingFailed.length > 0) {
    return;
  }

  await supabase
    .from('consumer_orders')
    .update({
      payment_status: 'failed',
      updated_at: now,
    })
    .eq('id', mapped.id);

  const { error: txError } = await supabase.from('payment_transactions').insert({
    transaction_id: `NETCASH-FAILED-${debitResult.accountReference}`,
    reference: mapped.reference,
    provider: 'netcash',
    amount: debitResult.amount,
    currency: 'ZAR',
    status: 'failed',
    payment_method: 'debit_order',
    customer_id: mapped.customerId,
    order_id: mapped.id,
    provider_reference: debitResult.accountReference,
    failure_reason: `${debitResult.unpaidReason || 'Unknown'} (Code: ${debitResult.unpaidCode || 'N/A'})`,
    initiated_at: now,
    reconciliation_source: 'netcash_statement',
  });

  if (txError) {
    cronLogger.error(`Reconciliation: failed to insert failed-payment transaction for order ${mapped.reference}`, { error: txError.message });
  }
}

