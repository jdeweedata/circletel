/**
 * Debit Orders Batch Processing Inngest Function
 *
 * Processes debit order batches for customers with active mandates.
 * Migrated from cron job at app/api/cron/submit-debit-orders/route.ts
 *
 * Features:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron (06:00 SAST) and manual event
 * - Progress tracking via cron_execution_log table
 * - Cancellation support
 * - Pay Now fallback for pending/missing mandates
 *
 * Schedule: Daily at 06:00 SAST (04:00 UTC)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  netcashDebitBatchService,
  DebitOrderItem,
} from '@/lib/payments/netcash-debit-batch-service';
import { PayNowBillingService } from '@/lib/billing/paynow-billing-service';

// =============================================================================
// TYPES
// =============================================================================

interface SubmissionResult {
  date: string;
  totalEligible: number;
  submitted: number;
  skipped: number;
  paynowSent: number;
  batchId?: string;
  errors: string[];
}

interface SkippedInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  reason: 'no_mandate' | 'mandate_pending';
}

interface MandateStatusMap {
  [customerId: string]: 'active' | 'pending' | 'none';
}

// =============================================================================
// DEBIT ORDERS BATCH FUNCTION
// =============================================================================

/**
 * Main debit orders batch processing function.
 * Triggered by:
 * - Cron schedule: Daily at 06:00 SAST (04:00 UTC)
 * - Event: 'billing/debit-orders.requested' for manual triggers
 */
export const debitOrdersFunction = inngest.createFunction(
  {
    id: 'debit-orders-batch',
    name: 'Debit Orders Batch Processing',
    retries: 3,
    cancelOn: [
      {
        event: 'billing/debit-orders.cancelled',
        match: 'data.batch_log_id',
      },
    ],
  },
  [
    // Cron trigger: 06:00 SAST = 04:00 UTC
    { cron: '0 4 * * *' },
    // Event trigger: manual requests
    { event: 'billing/debit-orders.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data (if triggered manually)
    const eventData = event?.data as {
      batch_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      admin_user_id?: string;
      billing_date?: string;
      options?: {
        dryRun?: boolean;
      };
    } | undefined;

    const dryRun = eventData?.options?.dryRun ?? false;
    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;

    // Use custom billing date if provided, otherwise use today
    const billingDate = eventData?.billing_date
      ? new Date(eventData.billing_date)
      : new Date();
    const billingDay = billingDate.getDate();
    const dateStr = billingDate.toISOString().split('T')[0];

    // Track timing
    const startTime = Date.now();

    // Track results
    const result: SubmissionResult = {
      date: dateStr,
      totalEligible: 0,
      submitted: 0,
      skipped: 0,
      paynowSent: 0,
      errors: [],
    };

    const skippedInvoices: SkippedInvoice[] = [];

    console.log(`[DebitOrders] Starting batch processing for billing day ${billingDay} (${dateStr})`);

    // Step 1: Create or update batch log
    const batchLogId = await step.run('create-batch-log', async () => {
      const supabase = await createClient();

      // If batch_log_id provided (manual trigger), update existing log
      if (eventData?.batch_log_id) {
        const { error } = await supabase
          .from('cron_execution_log')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.batch_log_id);

        if (error) {
          console.error('[DebitOrders] Failed to update batch log:', error);
          throw new Error(`Failed to update batch log: ${error.message}`);
        }

        console.log(`[DebitOrders] Updated batch log ${eventData.batch_log_id} to running`);
        return eventData.batch_log_id;
      }

      // Create new batch log for cron trigger
      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'submit-debit-orders',
          status: 'running',
          started_at: new Date().toISOString(),
          result: {
            triggered_by: triggeredBy,
            triggered_by_user_id: adminUserId || null,
            billing_date: dateStr,
            dry_run: dryRun,
          },
        })
        .select('id')
        .single();

      if (error || !newLog) {
        console.error('[DebitOrders] Failed to create batch log:', error);
        throw new Error(`Failed to create batch log: ${error?.message || 'Unknown error'}`);
      }

      console.log(`[DebitOrders] Created batch log ${newLog.id}`);
      return newLog.id;
    });

    // Step 2: Check NetCash configuration
    const isNetCashConfigured = await step.run('check-netcash-config', async () => {
      const configured = netcashDebitBatchService.isConfigured();
      if (!configured) {
        console.error('[DebitOrders] NetCash Debit Order Service not configured');
      }
      return configured;
    });

    if (!isNetCashConfigured) {
      result.errors.push('NetCash Debit Order Service not configured');

      await step.run('log-config-failure', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            result: {
              ...result,
              duration_ms: Date.now() - startTime,
            },
          })
          .eq('id', batchLogId);
      });

      return { success: false, batchLogId, result };
    }

    // Step 3: Fetch eligible invoices
    const invoices = await step.run('fetch-eligible-invoices', async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          total_amount,
          due_date,
          status,
          payment_collection_method
        `)
        .in('status', ['draft', 'sent', 'partial', 'overdue'])
        .eq('due_date', dateStr)
        .in('payment_collection_method', ['debit_order', 'Debit Order']);

      if (error) {
        console.error('[DebitOrders] Failed to fetch invoices:', error);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      console.log(`[DebitOrders] Found ${data?.length || 0} eligible invoices`);
      return data || [];
    });

    // Step 4: Fetch eligible orders
    const orders = await step.run('fetch-eligible-orders', async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
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

      if (error) {
        console.error('[DebitOrders] Failed to fetch orders:', error);
        // Don't throw - orders are secondary to invoices
        return [];
      }

      console.log(`[DebitOrders] Found ${data?.length || 0} eligible orders`);
      return data || [];
    });

    // Step 5: Batch check mandates (single query instead of N queries)
    const mandateStatusMap = await step.run('batch-check-mandates', async () => {
      const supabase = await createClient();

      // Collect all unique customer IDs
      const customerIds = new Set<string>();
      invoices.forEach(inv => customerIds.add(inv.customer_id));
      orders.forEach(ord => customerIds.add(ord.customer_id));

      if (customerIds.size === 0) {
        return {} as MandateStatusMap;
      }

      // Single query to get all mandate statuses
      const { data: paymentMethods, error } = await supabase
        .from('customer_payment_methods')
        .select('customer_id, method_type, mandate_status, is_active, encrypted_details')
        .in('customer_id', Array.from(customerIds))
        .eq('is_active', true)
        .eq('method_type', 'debit_order');

      if (error) {
        console.error('[DebitOrders] Failed to fetch mandates:', error);
        throw new Error(`Failed to fetch mandates: ${error.message}`);
      }

      // Build status map
      const statusMap: MandateStatusMap = {};

      // Initialize all customers as 'none'
      customerIds.forEach(id => {
        statusMap[id] = 'none';
      });

      // Process payment methods
      if (paymentMethods) {
        for (const pm of paymentMethods) {
          const isVerified = pm.encrypted_details?.verified === true ||
                            pm.encrypted_details?.verified === 'true';
          const mandateActive = pm.mandate_status === 'active' ||
                               pm.mandate_status === 'approved';

          if (isVerified && mandateActive) {
            statusMap[pm.customer_id] = 'active';
          } else if (statusMap[pm.customer_id] !== 'active') {
            // Payment method exists but not fully active
            statusMap[pm.customer_id] = 'pending';
          }
        }
      }

      console.log(`[DebitOrders] Mandate status map built for ${customerIds.size} customers`);
      return statusMap;
    });

    // Step 6: Categorize items into eligible/skipped
    const categorizeResult = await step.run('categorize-items', async () => {
      const items: DebitOrderItem[] = [];
      const skippedList: SkippedInvoice[] = [];

      // Process invoices
      for (const invoice of invoices) {
        const mandateStatus = mandateStatusMap[invoice.customer_id] || 'none';

        if (mandateStatus === 'active') {
          items.push({
            accountReference: invoice.invoice_number,
            amount: invoice.total_amount,
            actionDate: billingDate,
            customerId: invoice.customer_id,
            invoiceId: invoice.id,
          });
        } else {
          skippedList.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            customerId: invoice.customer_id,
            reason: mandateStatus === 'pending' ? 'mandate_pending' : 'no_mandate',
          });
          console.log(`[DebitOrders] Skipping invoice ${invoice.invoice_number}: ${mandateStatus === 'pending' ? 'Mandate pending authentication' : 'No active mandate'}`);
        }
      }

      // Process orders (for first-time billing)
      for (const order of orders) {
        // Check if already covered by an invoice
        const alreadyCovered = items.some(
          item => item.orderId === order.id ||
                  item.accountReference.includes(order.order_number)
        );

        if (alreadyCovered) continue;

        const mandateStatus = mandateStatusMap[order.customer_id] || 'none';

        if (mandateStatus === 'active') {
          items.push({
            accountReference: `PAY-${order.order_number}`,
            amount: order.package_price,
            actionDate: billingDate,
            customerId: order.customer_id,
            orderId: order.id,
          });
        } else {
          // Orders don't generate invoices automatically, just log the skip
          console.log(`[DebitOrders] Skipping order ${order.order_number}: ${mandateStatus === 'pending' ? 'Mandate pending authentication' : 'No active mandate'}`);
        }
      }

      console.log(`[DebitOrders] Categorized: ${items.length} eligible, ${skippedList.length} skipped`);
      return { eligibleItems: items, skipped: skippedList };
    });

    // Type-assert the result since Inngest jsonifies step results (dates become strings)
    const eligibleItems = categorizeResult.eligibleItems as unknown as DebitOrderItem[];
    const skipped = categorizeResult.skipped as unknown as SkippedInvoice[];

    // Store skipped invoices for Pay Now processing later
    skippedInvoices.push(...skipped);
    result.totalEligible = eligibleItems.length + skippedInvoices.length;
    result.skipped = skippedInvoices.length;

    // Handle empty batch
    if (eligibleItems.length === 0) {
      console.log('[DebitOrders] No eligible debit orders to submit');

      // Still need to process Pay Now fallback
      if (skippedInvoices.length > 0 && !dryRun) {
        const paynowResult = await step.run('process-paynow-fallback-empty-batch', async () => {
          let sent = 0;
          for (const inv of skippedInvoices) {
            try {
              const paynowRes = await PayNowBillingService.processPayNowForInvoice(
                inv.invoiceId,
                {
                  sendEmail: true,
                  sendSms: true,
                  smsTemplate: 'emandatePending',
                  includeEmandateReminder: true,
                }
              );
              if (paynowRes.success) sent++;
            } catch (err) {
              console.error(`[DebitOrders] Pay Now failed for ${inv.invoiceNumber}:`, err);
            }
            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          return sent;
        });

        result.paynowSent = paynowResult;
      }

      await step.run('update-empty-batch-log', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: {
              ...result,
              duration_ms: Date.now() - startTime,
            },
          })
          .eq('id', batchLogId);
      });

      // Send completion event
      await step.run('send-completion-event-empty', async () => {
        await inngest.send({
          name: 'billing/debit-orders.completed',
          data: {
            batch_log_id: batchLogId,
            billing_date: dateStr,
            total_eligible: result.totalEligible,
            submitted: 0,
            skipped: result.skipped,
            paynow_sent: result.paynowSent,
            duration_ms: Date.now() - startTime,
          },
        });
      });

      return { success: true, batchLogId, result };
    }

    // Step 7: Submit batch to NetCash (skip if dry run)
    let batchId: string | undefined;
    let itemsSubmitted = 0;

    if (!dryRun) {
      const batchResult = await step.run('submit-netcash-batch', async () => {
        const batchName = `CircleTel-${dateStr}-${Date.now()}`;
        console.log(`[DebitOrders] Submitting batch with ${eligibleItems.length} items`);

        const res = await netcashDebitBatchService.submitBatch(eligibleItems, batchName);

        if (!res.success) {
          console.error('[DebitOrders] Batch submission failed:', res.errors);
        } else {
          console.log(`[DebitOrders] Batch submitted: ${res.batchId}`);
        }

        return res;
      });

      if (!batchResult.success) {
        result.errors.push(...batchResult.errors);
      } else {
        batchId = batchResult.batchId;
        itemsSubmitted = batchResult.itemsSubmitted;
        result.batchId = batchId;
        result.submitted = itemsSubmitted;
      }

      // Step 8: Authorize the batch
      if (batchId) {
        await step.run('authorize-batch', async () => {
          const authResult = await netcashDebitBatchService.authoriseBatch(batchId!);

          if (!authResult.success) {
            result.errors.push(`Batch authorisation failed: ${authResult.error}`);
            console.warn('[DebitOrders] Batch submitted but not authorised:', authResult.error);
          } else {
            console.log(`[DebitOrders] Batch ${batchId} authorised successfully`);
          }
        });
      }

      // Step 9: Record batch submission in database
      if (batchId) {
        await step.run('record-batch-submission', async () => {
          const supabase = await createClient();

          try {
            // Insert batch record
            await supabase
              .from('debit_order_batches')
              .upsert({
                batch_id: batchId,
                batch_name: `CircleTel-${dateStr}-${Date.now()}`,
                item_count: eligibleItems.length,
                total_amount: eligibleItems.reduce((sum, item) => sum + item.amount, 0),
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              }, { onConflict: 'batch_id' });

            // Insert batch items
            const batchItems = eligibleItems.map(item => ({
              batch_id: batchId,
              account_reference: item.accountReference,
              customer_id: item.customerId,
              invoice_id: item.invoiceId,
              order_id: item.orderId,
              amount: item.amount,
              action_date: dateStr,
              status: 'pending',
              created_at: new Date().toISOString(),
            }));

            await supabase.from('debit_order_batch_items').insert(batchItems);

            console.log(`[DebitOrders] Batch ${batchId} recorded in database`);
          } catch (error) {
            console.error('[DebitOrders] Failed to record batch submission:', error);
            // Non-critical - don't fail the whole job
          }
        });
      }

      // Step 10: Update next billing dates
      await step.run('update-billing-dates', async () => {
        const supabase = await createClient();

        // Calculate next billing date (1 month from now)
        const nextBillingDate = new Date(billingDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        const nextDateStr = nextBillingDate.toISOString().split('T')[0];

        for (const item of eligibleItems) {
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
            console.error(`[DebitOrders] Failed to update billing date for ${item.accountReference}:`, error);
          }
        }

        console.log(`[DebitOrders] Updated next billing dates to ${nextDateStr}`);
      });

      // Step 11: Process Pay Now fallback for skipped invoices
      if (skippedInvoices.length > 0) {
        const paynowSent = await step.run('process-paynow-fallback', async () => {
          console.log(`[DebitOrders] Processing ${skippedInvoices.length} invoices for Pay Now fallback`);
          let sent = 0;

          for (const inv of skippedInvoices) {
            try {
              const paynowRes = await PayNowBillingService.processPayNowForInvoice(
                inv.invoiceId,
                {
                  sendEmail: true,
                  sendSms: true,
                  smsTemplate: 'emandatePending',
                  includeEmandateReminder: true,
                }
              );

              if (paynowRes.success) {
                sent++;
                console.log(`[DebitOrders] Pay Now sent for ${inv.invoiceNumber} (${inv.reason})`);
              } else {
                console.warn(`[DebitOrders] Failed to send Pay Now for ${inv.invoiceNumber}`, {
                  errors: paynowRes.errors,
                });
              }

              // Rate limiting delay
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`[DebitOrders] Error sending Pay Now for ${inv.invoiceNumber}`, { error });
            }
          }

          return sent;
        });

        result.paynowSent = paynowSent;
      }
    } else {
      // Dry run - just log what would happen
      console.log(`[DebitOrders] DRY RUN: Would submit ${eligibleItems.length} items`);
      result.submitted = 0;
    }

    // Step 12: Update final log
    const finalStatus = result.errors.length > 0 ? 'completed_with_errors' : 'completed';
    const duration = Date.now() - startTime;

    await step.run('update-final-log', async () => {
      const supabase = await createClient();

      await supabase
        .from('cron_execution_log')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          result: {
            ...result,
            dry_run: dryRun,
            duration_ms: duration,
          },
        })
        .eq('id', batchLogId);

      console.log(
        `[DebitOrders] Complete: ${result.submitted} submitted, ${result.skipped} skipped, ${result.paynowSent} Pay Now sent ` +
          `(${duration}ms, ${result.errors.length} errors)`
      );
    });

    // Step 13: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'billing/debit-orders.completed',
        data: {
          batch_log_id: batchLogId,
          billing_date: dateStr,
          batch_id: batchId,
          total_eligible: result.totalEligible,
          submitted: result.submitted,
          skipped: result.skipped,
          paynow_sent: result.paynowSent,
          duration_ms: duration,
        },
      });
    });

    return {
      success: result.errors.length === 0,
      batchLogId,
      result,
      dryRun,
    };
  }
);

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

/**
 * Handle debit orders completion.
 * Triggers billing-day processing to continue the billing workflow.
 */
export const debitOrdersCompletedFunction = inngest.createFunction(
  {
    id: 'debit-orders-completed',
    name: 'Debit Orders Completed Handler',
  },
  { event: 'billing/debit-orders.completed' },
  async ({ event, step }) => {
    const {
      batch_log_id,
      billing_date,
      batch_id,
      total_eligible,
      submitted,
      skipped,
      paynow_sent,
      duration_ms,
    } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[DebitOrders] Batch ${batch_log_id} completed: ` +
          `${submitted} submitted, ${skipped} skipped, ${paynow_sent} Pay Now sent (${duration_ms}ms)`
      );
    });

    // Trigger billing-day processing
    await step.run('trigger-billing-day', async () => {
      const supabase = await createClient();

      // Create a process log for billing-day
      const { data: processLog } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'billing-day-processor',
          status: 'pending',
          result: {
            triggered_by: 'debit-completion',
            billing_date,
            debit_batch_log_id: batch_log_id,
          },
        })
        .select('id')
        .single();

      if (processLog) {
        await inngest.send({
          name: 'billing/day.requested',
          data: {
            triggered_by: 'debit-completion',
            billing_date,
            process_log_id: processLog.id,
          },
        });

        console.log(`[DebitOrders] Triggered billing-day processing: ${processLog.id}`);
      }
    });

    return { logged: true, triggered_billing_day: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

/**
 * Handle debit orders failure.
 * Updates logs and sends alerts on failure.
 */
export const debitOrdersFailedFunction = inngest.createFunction(
  {
    id: 'debit-orders-failed',
    name: 'Debit Orders Failed Handler',
  },
  { event: 'billing/debit-orders.failed' },
  async ({ event, step }) => {
    const { batch_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(`[DebitOrders] Batch ${batch_log_id} failed (attempt ${attempt}): ${error}`);

      const supabase = await createClient();

      // Update batch log with failure status
      await supabase
        .from('cron_execution_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          result: {
            error,
            failed_attempt: attempt,
          },
        })
        .eq('id', batch_log_id);

      // TODO: Send alert notification for batch failures
      // TODO: Log to error tracking service (Sentry, etc.)
    });

    return { handled: true };
  }
);
