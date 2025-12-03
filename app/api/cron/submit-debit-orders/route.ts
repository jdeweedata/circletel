/**
 * Debit Order Batch Submission Cron Job
 *
 * Runs daily at 06:00 SAST (04:00 UTC) to submit debit order batches
 * for customers with billing due today.
 *
 * Process:
 * 1. Query active services/invoices with billing_date = today
 * 2. Filter to customers with active debit order mandates
 * 3. Submit batch to NetCash for collection
 * 4. Authorise the batch
 * 5. Log execution
 *
 * Vercel Cron: 0 4 * * * (04:00 UTC = 06:00 SAST)
 *
 * @module app/api/cron/submit-debit-orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  netcashDebitBatchService, 
  DebitOrderItem 
} from '@/lib/payments/netcash-debit-batch-service';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

interface SubmissionResult {
  date: string;
  totalEligible: number;
  submitted: number;
  skipped: number;
  batchId?: string;
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
    const result = await submitDebitOrders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Debit order submission cron error:', error);
    return NextResponse.json(
      { error: 'Submission failed', details: error instanceof Error ? error.message : 'Unknown error' },
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
    
    const result = await submitDebitOrders(customDate);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Debit order submission error:', error);
    return NextResponse.json(
      { error: 'Submission failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function submitDebitOrders(customDate?: Date): Promise<SubmissionResult> {
  const supabase = await createClient();
  
  // Default to today
  const billingDate = customDate || new Date();
  const billingDay = billingDate.getDate();
  const dateStr = billingDate.toISOString().split('T')[0];

  console.log(`Starting debit order submission for billing day ${billingDay} (${dateStr})`);

  const result: SubmissionResult = {
    date: dateStr,
    totalEligible: 0,
    submitted: 0,
    skipped: 0,
    errors: [],
  };

  // Check if service is configured
  if (!netcashDebitBatchService.isConfigured()) {
    result.errors.push('NetCash Debit Order Service not configured');
    await logExecution(supabase, result, 'failed');
    return result;
  }

  // ============================================================================
  // 1. Get unpaid invoices due today with debit order payment method
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
      payment_method,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('status', 'unpaid')
    .eq('due_date', dateStr)
    .in('payment_method', ['debit_order', 'Debit Order']);

  if (invoiceError) {
    result.errors.push(`Failed to fetch invoices: ${invoiceError.message}`);
    await logExecution(supabase, result, 'failed');
    return result;
  }

  // ============================================================================
  // 2. Get active orders with billing due today
  // ============================================================================
  
  const { data: orders, error: orderError } = await supabase
    .from('consumer_orders')
    .select(`
      id,
      order_number,
      customer_id,
      package_price,
      payment_method,
      payment_status,
      billing_active,
      next_billing_date,
      billing_cycle_day
    `)
    .eq('status', 'active')
    .eq('billing_active', true)
    .eq('payment_method', 'Debit Order')
    .eq('next_billing_date', dateStr);

  if (orderError) {
    result.errors.push(`Failed to fetch orders: ${orderError.message}`);
  }

  // ============================================================================
  // 3. Get active services with billing due today
  // NOTE: customer_services doesn't have billing_date columns yet.
  // Billing is tracked in consumer_orders. After migration is applied,
  // this section can be enabled.
  // ============================================================================

  // For now, services are covered through orders
  const services: any[] = [];

  // Combine all eligible items
  const eligibleItems: DebitOrderItem[] = [];

  // Add invoices
  if (invoices) {
    for (const invoice of invoices) {
      // Verify customer has active debit order mandate
      const hasMandate = await verifyActiveMandate(supabase, invoice.customer_id);
      
      if (hasMandate) {
        eligibleItems.push({
          accountReference: invoice.invoice_number,
          amount: invoice.total_amount,
          actionDate: billingDate,
          customerId: invoice.customer_id,
          invoiceId: invoice.id,
        });
      } else {
        result.skipped++;
        console.log(`Skipping invoice ${invoice.invoice_number}: No active mandate`);
      }
    }
  }

  // Add orders (for first-time billing)
  if (orders) {
    for (const order of orders) {
      // Check if already covered by an invoice
      const alreadyCovered = eligibleItems.some(
        item => item.orderId === order.id || 
                item.accountReference.includes(order.order_number)
      );
      
      if (alreadyCovered) continue;

      const hasMandate = await verifyActiveMandate(supabase, order.customer_id);
      
      if (hasMandate) {
        eligibleItems.push({
          accountReference: `PAY-${order.order_number}`,
          amount: order.package_price,
          actionDate: billingDate,
          customerId: order.customer_id,
          orderId: order.id,
        });
      } else {
        result.skipped++;
        console.log(`Skipping order ${order.order_number}: No active mandate`);
      }
    }
  }

  // Add services (if not already covered by invoice)
  if (services) {
    for (const service of services) {
      // Check if already covered
      const alreadyCovered = eligibleItems.some(
        item => item.customerId === service.customer_id
      );
      
      if (alreadyCovered) continue;

      const hasMandate = await verifyActiveMandate(supabase, service.customer_id);
      
      if (hasMandate) {
        eligibleItems.push({
          accountReference: `SVC-${service.id.substring(0, 18)}`,
          amount: service.monthly_price,
          actionDate: billingDate,
          customerId: service.customer_id,
        });
      } else {
        result.skipped++;
      }
    }
  }

  result.totalEligible = eligibleItems.length + result.skipped;

  if (eligibleItems.length === 0) {
    console.log('No eligible debit orders to submit');
    await logExecution(supabase, result, 'completed');
    return result;
  }

  console.log(`Found ${eligibleItems.length} eligible debit orders to submit`);

  // ============================================================================
  // 4. Submit batch to NetCash
  // ============================================================================
  
  const batchName = `CircleTel-${dateStr}-${Date.now()}`;
  const batchResult = await netcashDebitBatchService.submitBatch(eligibleItems, batchName);

  if (!batchResult.success) {
    result.errors.push(...batchResult.errors);
    await logExecution(supabase, result, 'failed');
    return result;
  }

  result.batchId = batchResult.batchId;
  result.submitted = batchResult.itemsSubmitted;

  console.log(`Batch submitted successfully: ${batchResult.batchId}`);

  // ============================================================================
  // 5. Authorise the batch
  // ============================================================================
  
  if (batchResult.batchId) {
    const authResult = await netcashDebitBatchService.authoriseBatch(batchResult.batchId);
    
    if (!authResult.success) {
      result.errors.push(`Batch authorisation failed: ${authResult.error}`);
      // Don't fail the whole job - batch is submitted, just not authorised
      console.warn('Batch submitted but not authorised:', authResult.error);
    } else {
      console.log(`Batch ${batchResult.batchId} authorised successfully`);
    }
  }

  // ============================================================================
  // 6. Record batch submission in database
  // ============================================================================
  
  await recordBatchSubmission(supabase, {
    batchId: batchResult.batchId || '',
    batchName,
    items: eligibleItems,
    submittedAt: new Date(),
  });

  // ============================================================================
  // 7. Update next billing dates
  // ============================================================================
  
  await updateNextBillingDates(supabase, eligibleItems, billingDate);

  // Log execution
  await logExecution(supabase, result, result.errors.length > 0 ? 'completed_with_errors' : 'completed');

  console.log(`Debit order submission complete: ${result.submitted} submitted, ${result.skipped} skipped`);

  return result;
}

/**
 * Verify customer has an active debit order mandate
 */
async function verifyActiveMandate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string
): Promise<boolean> {
  const { data: paymentMethod } = await supabase
    .from('customer_payment_methods')
    .select('id, method_type, mandate_status, is_active, encrypted_details')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .eq('method_type', 'debit_order')
    .maybeSingle();

  if (!paymentMethod) return false;

  // Check mandate is active and verified
  const isVerified = paymentMethod.encrypted_details?.verified === true ||
                    paymentMethod.encrypted_details?.verified === 'true';
  
  const mandateActive = paymentMethod.mandate_status === 'active' || 
                       paymentMethod.mandate_status === 'approved';

  return isVerified && mandateActive;
}

/**
 * Record batch submission in database for tracking
 */
async function recordBatchSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batch: {
    batchId: string;
    batchName: string;
    items: DebitOrderItem[];
    submittedAt: Date;
  }
) {
  try {
    // Insert batch record (upsert to handle duplicates)
    await supabase
      .from('debit_order_batches')
      .upsert({
        batch_id: batch.batchId,
        batch_name: batch.batchName,
        item_count: batch.items.length,
        total_amount: batch.items.reduce((sum, item) => sum + item.amount, 0),
        status: 'submitted',
        submitted_at: batch.submittedAt.toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'batch_id' });

    // Insert batch items
    const batchItems = batch.items.map(item => ({
      batch_id: batch.batchId,
      account_reference: item.accountReference,
      customer_id: item.customerId,
      invoice_id: item.invoiceId,
      order_id: item.orderId,
      amount: item.amount,
      action_date: item.actionDate.toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    await supabase
      .from('debit_order_batch_items')
      .insert(batchItems);

  } catch (error) {
    console.error('Failed to record batch submission:', error);
    // Don't throw - this is non-critical logging
  }
}

/**
 * Update next billing dates after submission
 */
async function updateNextBillingDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: DebitOrderItem[],
  currentBillingDate: Date
) {
  // Calculate next billing date (1 month from now)
  const nextBillingDate = new Date(currentBillingDate);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  const nextDateStr = nextBillingDate.toISOString().split('T')[0];

  for (const item of items) {
    try {
      if (item.orderId) {
        await supabase
          .from('consumer_orders')
          .update({
            next_billing_date: nextDateStr,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.orderId);
      }
    } catch (error) {
      console.error(`Failed to update next billing date for ${item.accountReference}:`, error);
    }
  }
}

/**
 * Log cron execution
 */
async function logExecution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  result: SubmissionResult,
  status: 'completed' | 'completed_with_errors' | 'failed'
) {
  try {
    await supabase
      .from('cron_execution_log')
      .insert({
        job_name: 'submit-debit-orders',
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
        },
      });
  } catch (error) {
    console.error('Failed to log execution:', error);
  }
}
