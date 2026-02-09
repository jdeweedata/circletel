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
import { cronLogger } from '@/lib/logging';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

interface ReconciliationResult {
  date: string;
  totalProcessed: number;
  successful: number;
  unpaid: number;
  notFound: number;
  errors: string[];
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runReconciliation();
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('Reconciliation cron error:', error);
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  try {
    // Optional: specify a custom date
    const body = await request.json().catch(() => ({}));
    const customDate = body.date ? new Date(body.date) : undefined;
    
    const result = await runReconciliation(customDate);
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('Reconciliation error:', error);
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
    .in('status', ['unpaid', 'partial', 'overdue'])
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
      total_amount,
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
      references.push(ref);
      references.push(`PAY-${ref}`);
      referenceMap.set(ref.toLowerCase(), { type: 'order', id: order.id, amount: order.total_amount });
      referenceMap.set(`pay-${ref}`.toLowerCase(), { type: 'order', id: order.id, amount: order.total_amount });
    }
  }

  // Get NetCash statement for the date
  const statement = await netcashStatementService.getStatement(reconciliationDate);

  if (!statement.success) {
    result.errors.push(`Failed to get NetCash statement: ${statement.error}`);
    
    // Log the reconciliation attempt
    await logReconciliation(supabase, result);
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

  // Log the reconciliation
  await logReconciliation(supabase, result);

  cronLogger.info(`Reconciliation complete: ${result.successful} successful, ${result.unpaid} unpaid, ${result.notFound} not found`);

  return result;
}

async function updateInvoiceAsPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  debitResult: { amount: number; transactionDate: string; accountReference: string }
) {
  const now = new Date().toISOString();

  await supabase
    .from('customer_invoices')
    .update({
      status: 'paid',
      amount_paid: debitResult.amount,
      paid_at: now,
      payment_method: 'debit_order',
      payment_reference: debitResult.accountReference,
      updated_at: now,
    })
    .eq('id', invoiceId);
}

async function updateOrderAsPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  debitResult: { amount: number; transactionDate: string; accountReference: string; transactionCode: string }
) {
  const now = new Date().toISOString();

  await supabase
    .from('consumer_orders')
    .update({
      payment_status: 'paid',
      total_paid: debitResult.amount,
      updated_at: now,
    })
    .eq('id', orderId);

  // Create payment transaction record
  await supabase
    .from('payment_transactions')
    .insert({
      transaction_id: `NETCASH-RECONCILE-${orderId}-${Date.now()}`,
      order_id: orderId,
      amount: debitResult.amount,
      currency: 'ZAR',
      payment_type: 'debit_order',
      status: 'completed',
      netcash_reference: debitResult.accountReference,
      netcash_response: debitResult,
      processed_at: now,
      transaction_date: now,
    });
}

async function markInvoiceUnpaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  debitResult: { unpaidCode?: string; unpaidReason?: string }
) {
  const now = new Date().toISOString();

  await supabase
    .from('customer_invoices')
    .update({
      status: 'overdue',
      notes: `Debit order failed: ${debitResult.unpaidReason || 'Unknown reason'} (Code: ${debitResult.unpaidCode || 'N/A'})`,
      updated_at: now,
    })
    .eq('id', invoiceId);
}

async function markOrderUnpaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  debitResult: { unpaidCode?: string; unpaidReason?: string; amount: number; transactionCode: string }
) {
  const now = new Date().toISOString();

  await supabase
    .from('consumer_orders')
    .update({
      payment_status: 'failed',
      updated_at: now,
    })
    .eq('id', orderId);

  // Create failed payment transaction record
  await supabase
    .from('payment_transactions')
    .insert({
      transaction_id: `NETCASH-FAILED-${orderId}-${Date.now()}`,
      order_id: orderId,
      amount: debitResult.amount,
      currency: 'ZAR',
      payment_type: 'debit_order',
      status: 'failed',
      failure_reason: `${debitResult.unpaidReason || 'Unknown'} (Code: ${debitResult.unpaidCode || 'N/A'})`,
      failed_at: now,
      transaction_date: now,
    });
}

async function logReconciliation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  result: ReconciliationResult
) {
  try {
    await supabase
      .from('cron_execution_log')
      .insert({
        job_name: 'payment-reconciliation',
        status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        result: result,
      });
  } catch (error) {
    cronLogger.error('Failed to log reconciliation:', error);
  }
}
