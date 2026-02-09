/**
 * Credit Card Debit Order Batch Submission Cron Job
 *
 * Runs daily at 06:00 SAST (04:00 UTC) to submit credit card debit batches
 * for customers with card tokens and billing due today.
 *
 * Process:
 * 1. Query unpaid invoices with due_date = today
 * 2. Filter to customers with active card tokens
 * 3. Submit batch to NetCash for CC collection
 * 4. Authorise the batch
 * 5. Log execution
 *
 * Vercel Cron: 0 4 * * * (04:00 UTC = 06:00 SAST)
 *
 * @module app/api/cron/submit-cc-debit-orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  netcashCCDebitBatchService,
  CreditCardDebitItem,
} from '@/lib/payments/netcash-cc-debit-batch-service';
import { cronLogger } from '@/lib/logging';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60;

interface CCSubmissionResult {
  date: string;
  totalEligible: number;
  submitted: number;
  skipped: number;
  batchId?: string;
  errors: string[];
  warnings: string[];
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await submitCCDebitOrders();
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('[CC Debit Cron] Error:', error);
    return NextResponse.json(
      {
        error: 'Submission failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const customDate = body.date ? new Date(body.date) : undefined;

    const result = await submitCCDebitOrders(customDate);
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('[CC Debit Cron] Error:', error);
    return NextResponse.json(
      {
        error: 'Submission failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function submitCCDebitOrders(customDate?: Date): Promise<CCSubmissionResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const billingDate = customDate || new Date();
  const dateStr = billingDate.toISOString().split('T')[0];

  cronLogger.info(`[CC Debit Cron] Starting CC debit order submission for ${dateStr}`);

  const result: CCSubmissionResult = {
    date: dateStr,
    totalEligible: 0,
    submitted: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  // Check if service is configured
  if (!netcashCCDebitBatchService.isConfigured()) {
    result.errors.push('NetCash CC Debit Service not configured');
    await logExecution(supabase, result, 'failed');
    return result;
  }

  // ============================================================================
  // 1. Get unpaid invoices due today with credit card payment method
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
      payment_method
    `)
    .eq('status', 'unpaid')
    .eq('due_date', dateStr)
    .in('payment_method', ['credit_card', 'Credit Card', 'card']);

  if (invoiceError) {
    result.errors.push(`Failed to fetch invoices: ${invoiceError.message}`);
    await logExecution(supabase, result, 'failed');
    return result;
  }

  // ============================================================================
  // 2. Get customer IDs from invoices
  // ============================================================================

  const customerIds = Array.from(new Set((invoices || []).map((inv) => inv.customer_id)));

  if (customerIds.length === 0) {
    cronLogger.info('[CC Debit Cron] No credit card invoices due today');
    result.totalEligible = 0;
    await logExecution(supabase, result, 'completed');
    return result;
  }

  // ============================================================================
  // 3. Get active card tokens for these customers
  // ============================================================================

  const { data: paymentMethods, error: pmError } = await supabase
    .from('customer_payment_methods')
    .select(`
      id,
      customer_id,
      card_token,
      card_holder_name,
      card_type,
      card_expiry_month,
      card_expiry_year,
      card_masked_number,
      token_status
    `)
    .eq('method_type', 'credit_card')
    .eq('is_active', true)
    .eq('token_status', 'active')
    .not('card_token', 'is', null)
    .in('customer_id', customerIds);

  if (pmError) {
    result.errors.push(`Failed to fetch payment methods: ${pmError.message}`);
    await logExecution(supabase, result, 'failed');
    return result;
  }

  // Create lookup map
  const customerCards = new Map(
    (paymentMethods || []).map((pm) => [pm.customer_id, pm])
  );

  // ============================================================================
  // 4. Build debit items for customers with valid tokens
  // ============================================================================

  const eligibleItems: CreditCardDebitItem[] = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  for (const invoice of invoices || []) {
    const card = customerCards.get(invoice.customer_id);

    if (!card) {
      result.skipped++;
      result.warnings.push(`Invoice ${invoice.invoice_number}: No active card token`);
      continue;
    }

    // Check if card is expired
    if (
      card.card_expiry_year < currentYear ||
      (card.card_expiry_year === currentYear && card.card_expiry_month < currentMonth)
    ) {
      result.skipped++;
      result.warnings.push(`Invoice ${invoice.invoice_number}: Card expired`);
      continue;
    }

    // Get customer name for card holder if not stored
    let cardHolderName = card.card_holder_name;
    if (!cardHolderName) {
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name')
        .eq('id', invoice.customer_id)
        .single();

      cardHolderName = customer
        ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
        : 'Customer';
    }

    eligibleItems.push({
      accountReference: invoice.invoice_number,
      amount: invoice.total_amount,
      actionDate: billingDate,
      customerId: invoice.customer_id,
      invoiceId: invoice.id,
      cardToken: card.card_token,
      cardHolderName,
      cardType: card.card_type || 'visa',
      expiryMonth: card.card_expiry_month,
      expiryYear: card.card_expiry_year,
      maskedNumber: card.card_masked_number || '',
    });
  }

  result.totalEligible = eligibleItems.length + result.skipped;

  if (eligibleItems.length === 0) {
    cronLogger.info('[CC Debit Cron] No eligible CC debit orders to submit');
    await logExecution(supabase, result, 'completed');
    return result;
  }

  cronLogger.info(`[CC Debit Cron] Found ${eligibleItems.length} eligible CC debit orders`);

  // ============================================================================
  // 5. Submit batch to NetCash
  // ============================================================================

  const batchName = `CircleTel-CC-${dateStr}-${Date.now()}`;
  const batchResult = await netcashCCDebitBatchService.submitBatch(eligibleItems, batchName);

  if (!batchResult.success) {
    result.errors.push(...batchResult.errors);
    result.warnings.push(...batchResult.warnings);
    await logExecution(supabase, result, 'failed');
    return result;
  }

  result.batchId = batchResult.batchId;
  result.submitted = batchResult.itemsSubmitted;
  result.warnings.push(...batchResult.warnings);

  cronLogger.info(`[CC Debit Cron] Batch submitted: ${batchResult.batchId}`);

  // ============================================================================
  // 6. Authorise the batch
  // ============================================================================

  if (batchResult.batchId) {
    const authResult = await netcashCCDebitBatchService.authoriseBatch(batchResult.batchId);

    if (!authResult.success) {
      result.errors.push(`Batch authorisation failed: ${authResult.error}`);
      cronLogger.warn('[CC Debit Cron] Batch not authorised:', authResult.error);
    } else {
      cronLogger.info(`[CC Debit Cron] Batch ${batchResult.batchId} authorised`);
    }
  }

  // ============================================================================
  // 7. Record batch submission
  // ============================================================================

  await recordBatchSubmission(supabase, {
    batchId: batchResult.batchId || '',
    batchName,
    paymentType: 'credit_card',
    items: eligibleItems,
    submittedAt: new Date(),
  });

  // ============================================================================
  // 8. Update token last used timestamp
  // ============================================================================

  for (const item of eligibleItems) {
    await supabase
      .from('customer_payment_methods')
      .update({
        token_last_used_at: new Date().toISOString(),
      })
      .eq('customer_id', item.customerId)
      .eq('method_type', 'credit_card')
      .eq('is_active', true);
  }

  // Log execution
  await logExecution(
    supabase,
    result,
    result.errors.length > 0 ? 'completed_with_errors' : 'completed'
  );

  cronLogger.info(
    `[CC Debit Cron] Complete: ${result.submitted} submitted, ${result.skipped} skipped`
  );

  return result;
}

/**
 * Record batch submission in database
 */
async function recordBatchSubmission(
  supabase: AnySupabaseClient,
  batch: {
    batchId: string;
    batchName: string;
    paymentType: string;
    items: CreditCardDebitItem[];
    submittedAt: Date;
  }
) {
  try {
    // Insert batch record
    await supabase.from('debit_order_batches').upsert(
      {
        batch_id: batch.batchId,
        batch_name: batch.batchName,
        payment_type: batch.paymentType,
        item_count: batch.items.length,
        total_amount: batch.items.reduce((sum, item) => sum + item.amount, 0),
        status: 'submitted',
        submitted_at: batch.submittedAt.toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: 'batch_id' }
    );

    // Insert batch items
    const batchItems = batch.items.map((item) => ({
      batch_id: batch.batchId,
      account_reference: item.accountReference,
      customer_id: item.customerId,
      invoice_id: item.invoiceId,
      amount: item.amount,
      action_date: item.actionDate.toISOString().split('T')[0],
      payment_type: 'credit_card',
      card_type: item.cardType,
      card_masked_number: item.maskedNumber,
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    await supabase.from('debit_order_batch_items').insert(batchItems);
  } catch (error) {
    cronLogger.error('[CC Debit Cron] Failed to record batch:', error);
  }
}

/**
 * Log cron execution
 */
async function logExecution(
  supabase: AnySupabaseClient,
  result: CCSubmissionResult,
  status: 'completed' | 'completed_with_errors' | 'failed'
) {
  try {
    await supabase.from('cron_execution_log').insert({
      job_name: 'submit-cc-debit-orders',
      status,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      result: {
        date: result.date,
        totalEligible: result.totalEligible,
        submitted: result.submitted,
        skipped: result.skipped,
        batchId: result.batchId,
        errors: result.errors,
        warnings: result.warnings,
      },
    });
  } catch (error) {
    cronLogger.error('[CC Debit Cron] Failed to log execution:', error);
  }
}
