/**
 * Billing Day Processing Inngest Function
 *
 * Processes Pay Now payments for customers WITHOUT active eMandate.
 * Runs after debit-orders batch to handle remaining invoices.
 * Migrated from cron job at app/api/cron/process-billing-day/route.ts
 *
 * Features:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron (07:00 SAST) and manual event
 * - Progress tracking via cron_execution_log table
 * - Cancellation support
 * - Filters out debit batch items, already sent today, has eMandate
 *
 * Schedule: Daily at 07:00 SAST (05:00 UTC) - runs after debit-orders (06:00 SAST)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  PayNowBillingService,
  PayNowProcessResult,
} from '@/lib/billing/paynow-billing-service';

// =============================================================================
// TYPES
// =============================================================================

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

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  customer_id: string;
  total_amount: number;
  due_date: string;
  status: string;
  paynow_sent_at: string | null;
}

// =============================================================================
// BILLING DAY PROCESSING FUNCTION
// =============================================================================

/**
 * Main billing day processing function.
 * Triggered by:
 * - Cron schedule: Daily at 07:00 SAST (05:00 UTC)
 * - Event: 'billing/day.requested' for manual triggers or debit-completion chain
 */
export const billingDayFunction = inngest.createFunction(
  {
    id: 'billing-day-processing',
    name: 'Billing Day Processing',
    retries: 3,
    cancelOn: [
      {
        event: 'billing/day.cancelled',
        match: 'data.process_log_id',
      },
    ],
  },
  [
    // Cron trigger: 07:00 SAST = 05:00 UTC (fallback if not triggered by debit-completion)
    { cron: '0 5 * * *' },
    // Event trigger: manual requests or debit-completion chain
    { event: 'billing/day.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data (if triggered manually or by debit-completion)
    const eventData = event?.data as {
      process_log_id?: string;
      triggered_by?: 'cron' | 'manual' | 'debit-completion';
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
    const dateStr = billingDate.toISOString().split('T')[0];

    // Track timing
    const startTime = Date.now();

    // Track results
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

    console.log(`[BillingDay] Starting Pay Now processing for ${dateStr} (triggered by: ${triggeredBy})`);

    // Step 1: Create or update process log
    const processLogId = await step.run('create-process-log', async () => {
      const supabase = await createClient();

      // If process_log_id provided (from event), update existing log
      if (eventData?.process_log_id) {
        const { error } = await supabase
          .from('cron_execution_log')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.process_log_id);

        if (error) {
          console.error('[BillingDay] Failed to update process log:', error);
          throw new Error(`Failed to update process log: ${error.message}`);
        }

        console.log(`[BillingDay] Updated process log ${eventData.process_log_id} to running`);
        return eventData.process_log_id;
      }

      // Create new process log for cron trigger
      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'process-billing-day',
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
        console.error('[BillingDay] Failed to create process log:', error);
        throw new Error(`Failed to create process log: ${error?.message || 'Unknown error'}`);
      }

      console.log(`[BillingDay] Created process log ${newLog.id}`);
      return newLog.id;
    });

    // Step 2: Fetch due invoices
    const invoices = await step.run('fetch-due-invoices', async () => {
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
          paynow_sent_at
        `)
        .eq('due_date', dateStr)
        .in('status', ['draft', 'sent', 'partial', 'overdue']);

      if (error) {
        console.error('[BillingDay] Failed to fetch invoices:', error);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      console.log(`[BillingDay] Found ${data?.length || 0} unpaid invoices due today`);
      return (data || []) as InvoiceRecord[];
    });

    result.totalInvoicesDue = invoices.length;

    // Step 3: Batch check mandates (single query instead of N queries)
    const mandateStatuses = await step.run('batch-check-mandates', async () => {
      const supabase = await createClient();

      // Collect all unique customer IDs
      const customerIds = new Set<string>();
      invoices.forEach(inv => customerIds.add(inv.customer_id));

      if (customerIds.size === 0) {
        return {} as Record<string, boolean>;
      }

      // Single query to get all mandate statuses
      const { data: paymentMethods, error } = await supabase
        .from('customer_payment_methods')
        .select('customer_id, method_type, mandate_status, is_active, encrypted_details')
        .in('customer_id', Array.from(customerIds))
        .eq('is_active', true)
        .eq('method_type', 'debit_order');

      if (error) {
        console.error('[BillingDay] Failed to fetch mandates:', error);
        throw new Error(`Failed to fetch mandates: ${error.message}`);
      }

      const statusMap: Record<string, boolean> = {};

      // Initialize all customers as no eMandate
      customerIds.forEach(id => {
        statusMap[id] = false;
      });

      // Mark customers with active verified mandates
      for (const pm of paymentMethods || []) {
        const isVerified = pm.encrypted_details?.verified === true ||
                          pm.encrypted_details?.verified === 'true';
        const mandateActive = pm.mandate_status === 'active' ||
                             pm.mandate_status === 'approved';

        if (isVerified && mandateActive) {
          statusMap[pm.customer_id] = true;
        }
      }

      const activeCount = Object.values(statusMap).filter(v => v).length;
      console.log(`[BillingDay] Mandate check: ${activeCount} with eMandate`);

      return statusMap;
    });

    // Handle no invoices case early
    if (invoices.length === 0) {
      console.log('[BillingDay] No unpaid invoices due today');

      await step.run('update-empty-log', async () => {
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
          .eq('id', processLogId);
      });

      // Send completion event
      await step.run('send-completion-event-empty', async () => {
        await inngest.send({
          name: 'billing/day.completed',
          data: {
            process_log_id: processLogId,
            billing_date: dateStr,
            total_invoices: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            duration_ms: Date.now() - startTime,
          },
        });
      });

      return { success: true, processLogId, result };
    }

    // Step 4: Get debit batch items (to skip those invoices)
    const debitBatchInvoiceIds = await step.run('get-debit-batch-items', async () => {
      const supabase = await createClient();

      const { data: debitBatchItems } = await supabase
        .from('debit_order_batch_items')
        .select('invoice_id')
        .eq('action_date', dateStr)
        .not('invoice_id', 'is', null);

      const invoiceIds = new Set(
        debitBatchItems?.map(item => item.invoice_id).filter(Boolean) || []
      );

      console.log(`[BillingDay] Found ${invoiceIds.size} invoices in today's debit batch`);
      return Array.from(invoiceIds);
    });

    const debitBatchSet = new Set(debitBatchInvoiceIds);

    // Step 5: PiFunnelBold invoices (skip debit batch, already sent today, has eMandate)
    const invoicesToProcess = await step.run('filter-invoices', async () => {
      const eligible: Array<{
        id: string;
        invoice_number: string;
        customer_id: string;
        total_amount: number;
      }> = [];

      let skippedDebit = 0;
      let skippedSent = 0;
      let skippedEmandate = 0;

      for (const invoice of invoices) {
        // Skip if already in today's debit order batch
        if (debitBatchSet.has(invoice.id)) {
          skippedDebit++;
          console.log(`[BillingDay] Skipping ${invoice.invoice_number} (in debit batch)`);
          continue;
        }

        // Skip if Pay Now already sent today
        if (invoice.paynow_sent_at) {
          const sentDate = new Date(invoice.paynow_sent_at).toISOString().split('T')[0];
          if (sentDate === dateStr) {
            skippedSent++;
            console.log(`[BillingDay] Skipping ${invoice.invoice_number} (Pay Now already sent today)`);
            continue;
          }
        }

        // Skip if customer has active eMandate (handled by debit order cron)
        const hasEmandate = mandateStatuses[invoice.customer_id] || false;
        if (hasEmandate) {
          skippedEmandate++;
          console.log(`[BillingDay] Skipping ${invoice.invoice_number} (customer has active eMandate)`);
          continue;
        }

        // This invoice needs Pay Now processing
        eligible.push({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_id: invoice.customer_id,
          total_amount: invoice.total_amount,
        });
      }

      console.log(
        `[BillingDay] Filter results: ${eligible.length} eligible, ` +
          `${skippedDebit} in debit batch, ${skippedSent} already sent, ${skippedEmandate} have eMandate`
      );

      return {
        eligible,
        skippedDebitBatch: skippedDebit,
        skippedAlreadySent: skippedSent,
        skippedEmandate,
      };
    });

    // Update result counters
    result.skippedDebitBatch = invoicesToProcess.skippedDebitBatch;
    result.skippedAlreadySent = invoicesToProcess.skippedAlreadySent;
    result.skippedEmandate = invoicesToProcess.skippedEmandate;

    // Handle no eligible invoices
    if (invoicesToProcess.eligible.length === 0) {
      console.log('[BillingDay] No invoices need Pay Now processing');

      await step.run('update-no-eligible-log', async () => {
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
          .eq('id', processLogId);
      });

      // Send completion event
      await step.run('send-completion-event-no-eligible', async () => {
        await inngest.send({
          name: 'billing/day.completed',
          data: {
            process_log_id: processLogId,
            billing_date: dateStr,
            total_invoices: result.totalInvoicesDue,
            processed: 0,
            successful: 0,
            failed: 0,
            duration_ms: Date.now() - startTime,
          },
        });
      });

      return { success: true, processLogId, result };
    }

    // Step 6: Process Pay Now in batches (skip if dry run)
    if (!dryRun) {
      const batchSize = 10;
      const eligible = invoicesToProcess.eligible;
      const processResults: PayNowProcessResult[] = [];

      // Process in batches
      for (let i = 0; i < eligible.length; i += batchSize) {
        const batch = eligible.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(eligible.length / batchSize);

        const batchResult = await step.run(`process-paynow-batch-${batchNumber}`, async () => {
          console.log(`[BillingDay] Processing batch ${batchNumber}/${totalBatches} (${batch.length} invoices)`);

          const batchResults: PayNowProcessResult[] = [];

          for (const invoice of batch) {
            try {
              const processResult = await PayNowBillingService.processPayNowForInvoice(
                invoice.id,
                {
                  sendEmail: true,
                  sendSms: true,
                  smsTemplate: 'paymentDue',
                }
              );

              batchResults.push(processResult);

              if (processResult.success) {
                console.log(`[BillingDay] Pay Now sent for ${invoice.invoice_number}`);
              } else {
                console.warn(`[BillingDay] Failed for ${invoice.invoice_number}:`, processResult.errors);
              }

              // Rate limiting delay between items (200ms)
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              console.error(`[BillingDay] Error processing ${invoice.invoice_number}:`, errorMsg);
              batchResults.push({
                success: false,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoice_number,
                errors: [errorMsg],
              });
            }
          }

          return batchResults;
        });

        processResults.push(...batchResult);

        // Delay between batches (1 second)
        if (i + batchSize < eligible.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Count results
      result.processed = processResults.length;
      result.successful = processResults.filter(r => r.success).length;
      result.failed = processResults.filter(r => !r.success).length;
      result.errors = processResults
        .filter(r => !r.success)
        .flatMap(r => r.errors.map(e => `${r.invoiceNumber}: ${e}`))
        .slice(0, 10); // Limit error storage
    } else {
      console.log(`[BillingDay] DRY RUN: Would process ${invoicesToProcess.eligible.length} invoices`);
      result.processed = 0;
    }

    // Step 7: Update final log
    const finalStatus = result.failed > 0
      ? (result.successful > 0 ? 'completed_with_errors' : 'failed')
      : 'completed';
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
        .eq('id', processLogId);

      console.log(
        `[BillingDay] Complete: ${result.processed} processed, ${result.successful} successful, ` +
          `${result.failed} failed (${duration}ms)`
      );
    });

    // Step 8: PiPaperPlaneRightBold completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'billing/day.completed',
        data: {
          process_log_id: processLogId,
          billing_date: dateStr,
          total_invoices: result.totalInvoicesDue,
          processed: result.processed,
          successful: result.successful,
          failed: result.failed,
          duration_ms: duration,
        },
      });
    });

    return {
      success: result.errors.length === 0,
      processLogId,
      result,
      dryRun,
    };
  }
);

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

/**
 * Handle billing day completion.
 * Logs completion metrics and can trigger downstream processes.
 */
export const billingDayCompletedFunction = inngest.createFunction(
  {
    id: 'billing-day-completed',
    name: 'Billing Day Completed Handler',
  },
  { event: 'billing/day.completed' },
  async ({ event, step }) => {
    const {
      process_log_id,
      billing_date,
      total_invoices,
      processed,
      successful,
      failed,
      duration_ms,
    } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[BillingDay] Process ${process_log_id} completed: ` +
          `${total_invoices} due, ${processed} processed, ${successful} successful, ${failed} failed (${duration_ms}ms)`
      );
    });

    return { logged: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

/**
 * Handle billing day failure.
 * Updates logs and sends alerts on failure.
 */
export const billingDayFailedFunction = inngest.createFunction(
  {
    id: 'billing-day-failed',
    name: 'Billing Day Failed Handler',
  },
  { event: 'billing/day.failed' },
  async ({ event, step }) => {
    const { process_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(`[BillingDay] Process ${process_log_id} failed (attempt ${attempt}): ${error}`);

      const supabase = await createClient();

      // Update process log with failure status
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
        .eq('id', process_log_id);

      // TODO: PiPaperPlaneRightBold alert notification for billing failures
      // TODO: Log to error tracking service (Sentry, etc.)
    });

    return { handled: true };
  }
);
