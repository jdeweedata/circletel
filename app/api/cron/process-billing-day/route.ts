/**
 * Billing Day Processor Cron Job
 *
 * Runs daily at 07:00 SAST (05:00 UTC) to send Pay Now payment links
 * to customers WITHOUT active eMandate whose invoices are due today.
 *
 * This cron runs AFTER submit-debit-orders (06:00 SAST) to ensure:
 * 1. eMandate customers are handled by debit order batch
 * 2. Non-eMandate customers receive Pay Now links
 *
 * Process:
 * 1. Query unpaid invoices with due_date = today
 * 2. Filter out customers with active debit order mandates
 * 3. Filter out invoices already in today's debit order batch
 * 4. Filter out invoices already sent Pay Now link today
 * 5. Generate Pay Now URL for each invoice
 * 6. Send email + SMS with payment link
 * 7. Update invoice tracking fields
 * 8. Log execution
 *
 * Vercel Cron: 0 5 * * * (05:00 UTC = 07:00 SAST)
 *
 * @module app/api/cron/process-billing-day
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  PayNowBillingService,
  PayNowProcessResult,
} from '@/lib/billing/paynow-billing-service';
import { cronLogger } from '@/lib/logging';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

interface ProcessingResult {
  date: string;
  totalInvoicesDue: number;
  skippedEmandate: number;
  skippedDebitBatch: number;
  skippedAlreadySent: number;
  processed: number;
  successful: number;
  failed: number;
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
    const result = await processBillingDay();
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('Billing day processor cron error', { error });
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  // Verify admin authorization for manual triggers
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow either cron secret or admin token
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Could add additional admin auth check here
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Optional: specify a custom date for testing
    const body = await request.json().catch(() => ({}));
    const customDate = body.date ? new Date(body.date) : undefined;
    const dryRun = body.dryRun === true;

    const result = await processBillingDay(customDate, dryRun);
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('Billing day processor error', { error });
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function processBillingDay(customDate?: Date, dryRun = false): Promise<ProcessingResult> {
  const supabase = await createClient();

  // Default to today
  const billingDate = customDate || new Date();
  const dateStr = billingDate.toISOString().split('T')[0];

  cronLogger.info('Starting billing day processor', {
    date: dateStr,
    dryRun,
  });

  const result: ProcessingResult = {
    date: dateStr,
    totalInvoicesDue: 0,
    skippedEmandate: 0,
    skippedDebitBatch: 0,
    skippedAlreadySent: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  // ============================================================================
  // 1. Get unpaid invoices due today
  // ============================================================================

  const { data: invoices, error: invoiceError } = await supabase
    .from('customer_invoices')
    .select(`
      id,
      invoice_number,
      customer_id,
      total_amount,
      due_date,
      status,
      paynow_url,
      paynow_transaction_ref,
      paynow_sent_at,
      customer:customers(
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('due_date', dateStr)
    .in('status', ['unpaid', 'draft', 'partial']);

  if (invoiceError) {
    result.errors.push(`Failed to fetch invoices: ${invoiceError.message}`);
    await logExecution(supabase, result, 'failed');
    return result;
  }

  result.totalInvoicesDue = invoices?.length || 0;

  if (!invoices || invoices.length === 0) {
    cronLogger.info('No unpaid invoices due today');
    await logExecution(supabase, result, 'completed');
    return result;
  }

  cronLogger.info('Found invoices due today', { count: invoices.length });

  // ============================================================================
  // 2. Get today's debit order batch items (to skip those invoices)
  // ============================================================================

  const { data: debitBatchItems } = await supabase
    .from('debit_order_batch_items')
    .select('invoice_id')
    .eq('action_date', dateStr)
    .not('invoice_id', 'is', null);

  const debitBatchInvoiceIds = new Set(
    debitBatchItems?.map(item => item.invoice_id).filter(Boolean) || []
  );

  // ============================================================================
  // 3. Process each invoice
  // ============================================================================

  const invoicesToProcess: Array<{
    id: string;
    invoice_number: string;
    customer_id: string;
    total_amount: number;
  }> = [];

  for (const invoice of invoices) {
    // 3a. Skip if already in today's debit order batch
    if (debitBatchInvoiceIds.has(invoice.id)) {
      result.skippedDebitBatch++;
      cronLogger.debug('Skipping invoice (in debit batch)', {
        invoiceNumber: invoice.invoice_number,
      });
      continue;
    }

    // 3b. Skip if Pay Now already sent today
    if (invoice.paynow_sent_at) {
      const sentDate = new Date(invoice.paynow_sent_at).toISOString().split('T')[0];
      if (sentDate === dateStr) {
        result.skippedAlreadySent++;
        cronLogger.debug('Skipping invoice (Pay Now already sent)', {
          invoiceNumber: invoice.invoice_number,
        });
        continue;
      }
    }

    // 3c. Skip if customer has active eMandate (handled by debit order cron)
    const hasEmandate = await PayNowBillingService.hasActiveEmandate(invoice.customer_id);
    if (hasEmandate) {
      result.skippedEmandate++;
      cronLogger.debug('Skipping invoice (customer has active eMandate)', {
        invoiceNumber: invoice.invoice_number,
      });
      continue;
    }

    // This invoice needs Pay Now processing
    invoicesToProcess.push({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_id: invoice.customer_id,
      total_amount: invoice.total_amount,
    });
  }

  cronLogger.info('Invoices to process with Pay Now', {
    count: invoicesToProcess.length,
    skippedEmandate: result.skippedEmandate,
    skippedDebitBatch: result.skippedDebitBatch,
    skippedAlreadySent: result.skippedAlreadySent,
  });

  if (invoicesToProcess.length === 0) {
    cronLogger.info('No invoices need Pay Now processing');
    await logExecution(supabase, result, 'completed');
    return result;
  }

  // ============================================================================
  // 4. Process Pay Now for eligible invoices
  // ============================================================================

  if (dryRun) {
    cronLogger.info('Dry run - skipping actual processing');
    result.processed = invoicesToProcess.length;
    await logExecution(supabase, result, 'completed');
    return result;
  }

  const processResults: PayNowProcessResult[] = [];

  for (const invoice of invoicesToProcess) {
    try {
      const processResult = await PayNowBillingService.processPayNowForInvoice(
        invoice.id,
        {
          sendEmail: true,
          sendSms: true,
          smsTemplate: 'paymentDue',
        }
      );

      processResults.push(processResult);
      result.processed++;

      if (processResult.success) {
        result.successful++;
        cronLogger.info('Pay Now processed successfully', {
          invoiceNumber: invoice.invoice_number,
          emailSent: processResult.notificationResult?.emailSent,
          smsSent: processResult.notificationResult?.smsSent,
        });
      } else {
        result.failed++;
        result.errors.push(`Invoice ${invoice.invoice_number}: ${processResult.errors.join(', ')}`);
        cronLogger.warn('Pay Now processing failed', {
          invoiceNumber: invoice.invoice_number,
          errors: processResult.errors,
        });
      }

      // Small delay between processing to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Invoice ${invoice.invoice_number}: ${errorMsg}`);
      cronLogger.error('Pay Now processing error', {
        invoiceNumber: invoice.invoice_number,
        error: errorMsg,
      });
    }
  }

  // ============================================================================
  // 5. Log execution
  // ============================================================================

  const status = result.failed > 0
    ? (result.successful > 0 ? 'completed_with_errors' : 'failed')
    : 'completed';

  await logExecution(supabase, result, status);

  cronLogger.info('Billing day processing complete', {
    date: dateStr,
    processed: result.processed,
    successful: result.successful,
    failed: result.failed,
  });

  return result;
}

/**
 * Log cron execution
 */
async function logExecution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  result: ProcessingResult,
  status: 'completed' | 'completed_with_errors' | 'failed'
) {
  try {
    await supabase
      .from('cron_execution_log')
      .insert({
        job_name: 'process-billing-day',
        status,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        result: {
          date: result.date,
          totalInvoicesDue: result.totalInvoicesDue,
          skippedEmandate: result.skippedEmandate,
          skippedDebitBatch: result.skippedDebitBatch,
          skippedAlreadySent: result.skippedAlreadySent,
          processed: result.processed,
          successful: result.successful,
          failed: result.failed,
          errors: result.errors.slice(0, 10), // Limit error storage
        },
      });
  } catch (error) {
    cronLogger.error('Failed to log execution', { error });
  }
}
