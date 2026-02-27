/**
 * WhatsApp Billing Notifications Inngest Function
 *
 * Handles sending WhatsApp PayNow notifications for billing.
 * Runs after SMS/email notifications with priority order: WhatsApp > SMS > Email
 *
 * Features:
 * - Dual triggers: scheduled cron (08:00 SAST) and manual event
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability
 * - Respects consent and phone number requirements
 * - Rate limiting to comply with Meta tier limits
 *
 * Schedule: Daily at 08:00 SAST (06:00 UTC)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  WhatsAppPayNowService,
  type WhatsAppPayNowResult,
} from '@/lib/billing/whatsapp-paynow-service';

// =============================================================================
// TYPES
// =============================================================================

interface WhatsAppProcessingResult {
  date: string;
  totalInvoicesDue: number;
  eligibleWithConsent: number;
  processed: number;
  sent: number;
  failed: number;
  skippedNoConsent: number;
  skippedNoPhone: number;
  skippedAlreadySent: number;
  errors: string[];
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  customer_id: string;
  total_amount: number;
  due_date: string;
  status: string;
  whatsapp_sent_at: string | null;
}

// =============================================================================
// WHATSAPP BILLING NOTIFICATIONS FUNCTION
// =============================================================================

/**
 * Main WhatsApp billing notification function.
 * Triggered by:
 * - Cron schedule: Daily at 08:00 SAST (06:00 UTC)
 * - Event: 'billing/whatsapp.requested' for manual triggers
 */
export const whatsappBillingNotifications = inngest.createFunction(
  {
    id: 'whatsapp-billing-notifications',
    name: 'WhatsApp Billing Notifications',
    retries: 3,
    cancelOn: [
      {
        event: 'billing/whatsapp.cancelled',
        match: 'data.process_log_id',
      },
    ],
  },
  [
    // Cron trigger: 08:00 SAST = 06:00 UTC
    { cron: '0 6 * * *' },
    // Event trigger: manual requests
    { event: 'billing/whatsapp.requested' },
  ],
  async ({ event, step }) => {
    const eventData = event?.data as {
      process_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      admin_user_id?: string;
      billing_date?: string;
      options?: {
        dryRun?: boolean;
        includeOverdue?: boolean;
        maxDaysOverdue?: number;
      };
    } | undefined;

    const dryRun = eventData?.options?.dryRun ?? false;
    const includeOverdue = eventData?.options?.includeOverdue ?? true;
    const maxDaysOverdue = eventData?.options?.maxDaysOverdue ?? 7;
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
    const result: WhatsAppProcessingResult = {
      date: dateStr,
      totalInvoicesDue: 0,
      eligibleWithConsent: 0,
      processed: 0,
      sent: 0,
      failed: 0,
      skippedNoConsent: 0,
      skippedNoPhone: 0,
      skippedAlreadySent: 0,
      errors: [],
    };

    console.log(`[WhatsApp] Starting notifications for ${dateStr} (triggered by: ${triggeredBy})`);

    // Step 1: Create process log
    const processLogId = await step.run('create-process-log', async () => {
      const supabase = await createClient();

      if (eventData?.process_log_id) {
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.process_log_id);
        return eventData.process_log_id;
      }

      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'whatsapp-billing-notifications',
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
        throw new Error(`Failed to create process log: ${error?.message || 'Unknown error'}`);
      }

      console.log(`[WhatsApp] Created process log ${newLog.id}`);
      return newLog.id;
    });

    // Step 2: Fetch due invoices (today + overdue)
    const invoices = await step.run('fetch-due-invoices', async () => {
      const supabase = await createClient();

      // Build date range for query
      const today = new Date(dateStr);
      const overdueStart = new Date(today);
      overdueStart.setDate(overdueStart.getDate() - maxDaysOverdue);

      let query = supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          total_amount,
          due_date,
          status,
          whatsapp_sent_at
        `)
        .in('status', ['draft', 'sent', 'partial', 'overdue']);

      if (includeOverdue) {
        // Include invoices due today and overdue within range
        query = query
          .gte('due_date', overdueStart.toISOString().split('T')[0])
          .lte('due_date', dateStr);
      } else {
        // Only invoices due today
        query = query.eq('due_date', dateStr);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      console.log(`[WhatsApp] Found ${data?.length || 0} invoices due`);
      return (data || []) as InvoiceRecord[];
    });

    result.totalInvoicesDue = invoices.length;

    if (invoices.length === 0) {
      console.log('[WhatsApp] No invoices due, completing early');

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

      await step.run('send-completion-event-empty', async () => {
        await inngest.send({
          name: 'billing/whatsapp.completed',
          data: {
            process_log_id: processLogId,
            billing_date: dateStr,
            total_invoices: 0,
            sent: 0,
            failed: 0,
            duration_ms: Date.now() - startTime,
          },
        });
      });

      return { success: true, processLogId, result };
    }

    // Step 3: Batch check WhatsApp consent
    const consentStatuses = await step.run('batch-check-consent', async () => {
      const supabase = await createClient();

      const customerIds = new Set<string>();
      invoices.forEach(inv => customerIds.add(inv.customer_id));

      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, phone, whatsapp_consent')
        .in('id', Array.from(customerIds));

      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }

      const statusMap: Record<string, { hasConsent: boolean; hasPhone: boolean }> = {};

      customerIds.forEach(id => {
        statusMap[id] = { hasConsent: false, hasPhone: false };
      });

      for (const customer of customers || []) {
        statusMap[customer.id] = {
          hasConsent: customer.whatsapp_consent === true,
          hasPhone: !!customer.phone,
        };
      }

      const withConsent = Object.values(statusMap).filter(s => s.hasConsent && s.hasPhone).length;
      console.log(`[WhatsApp] ${withConsent} customers with consent and phone`);

      return statusMap;
    });

    // Step 4: Filter eligible invoices
    const eligibleInvoices = await step.run('filter-eligible-invoices', async () => {
      const eligible: Array<{
        id: string;
        invoice_number: string;
        customer_id: string;
        total_amount: number;
        daysOverdue: number;
      }> = [];

      const today = new Date(dateStr);
      let skippedConsent = 0;
      let skippedPhone = 0;
      let skippedSent = 0;

      for (const invoice of invoices) {
        // Check if already sent WhatsApp today
        if (invoice.whatsapp_sent_at) {
          const sentDate = new Date(invoice.whatsapp_sent_at).toISOString().split('T')[0];
          if (sentDate === dateStr) {
            skippedSent++;
            continue;
          }
        }

        const status = consentStatuses[invoice.customer_id];

        if (!status?.hasConsent) {
          skippedConsent++;
          continue;
        }

        if (!status?.hasPhone) {
          skippedPhone++;
          continue;
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.max(0, Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        ));

        eligible.push({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_id: invoice.customer_id,
          total_amount: invoice.total_amount,
          daysOverdue,
        });
      }

      console.log(
        `[WhatsApp] ${eligible.length} eligible, ` +
        `${skippedConsent} no consent, ${skippedPhone} no phone, ${skippedSent} already sent`
      );

      return {
        eligible,
        skippedNoConsent: skippedConsent,
        skippedNoPhone: skippedPhone,
        skippedAlreadySent: skippedSent,
      };
    });

    result.eligibleWithConsent = eligibleInvoices.eligible.length;
    result.skippedNoConsent = eligibleInvoices.skippedNoConsent;
    result.skippedNoPhone = eligibleInvoices.skippedNoPhone;
    result.skippedAlreadySent = eligibleInvoices.skippedAlreadySent;

    if (eligibleInvoices.eligible.length === 0) {
      console.log('[WhatsApp] No eligible invoices, completing');

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

      return { success: true, processLogId, result };
    }

    // Step 5: Process WhatsApp notifications in batches
    if (!dryRun) {
      const batchSize = 10;
      const eligible = eligibleInvoices.eligible;
      const processResults: WhatsAppPayNowResult[] = [];

      for (let i = 0; i < eligible.length; i += batchSize) {
        const batch = eligible.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(eligible.length / batchSize);

        const batchResult = await step.run(`send-whatsapp-batch-${batchNumber}`, async () => {
          console.log(`[WhatsApp] Processing batch ${batchNumber}/${totalBatches}`);

          const batchResults: WhatsAppPayNowResult[] = [];

          for (const invoice of batch) {
            // Determine notification type based on days overdue
            const notificationType = invoice.daysOverdue > 0
              ? 'payment_reminder'
              : 'invoice_payment';

            const sendResult = await WhatsAppPayNowService.sendPayNowWhatsApp(
              invoice.id,
              notificationType,
              {
                daysOverdue: invoice.daysOverdue,
                createdBy: `inngest:${triggeredBy}`,
              }
            );

            batchResults.push(sendResult);

            // Rate limiting: 100ms between messages
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          return batchResults;
        });

        processResults.push(...batchResult);

        // Delay between batches (500ms)
        if (i + batchSize < eligible.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Count results
      result.processed = processResults.length;
      result.sent = processResults.filter(r => r.whatsappSent).length;
      result.failed = processResults.filter(r => !r.success && !r.error?.includes('not consented') && !r.error?.includes('no phone')).length;
      result.errors = processResults
        .filter(r => !r.success)
        .map(r => `${r.invoiceNumber}: ${r.error}`)
        .slice(0, 10);
    } else {
      console.log(`[WhatsApp] DRY RUN: Would send ${eligibleInvoices.eligible.length} messages`);
    }

    // Step 6: Update final log
    const finalStatus = result.failed > 0
      ? (result.sent > 0 ? 'completed_with_errors' : 'failed')
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
        `[WhatsApp] Complete: ${result.sent} sent, ${result.failed} failed (${duration}ms)`
      );
    });

    // Step 7: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'billing/whatsapp.completed',
        data: {
          process_log_id: processLogId,
          billing_date: dateStr,
          total_invoices: result.totalInvoicesDue,
          eligible: result.eligibleWithConsent,
          sent: result.sent,
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
 * Handle WhatsApp notification completion.
 * Logs metrics for monitoring.
 */
export const whatsappNotificationsCompleted = inngest.createFunction(
  {
    id: 'whatsapp-notifications-completed',
    name: 'WhatsApp Notifications Completed Handler',
  },
  { event: 'billing/whatsapp.completed' },
  async ({ event, step }) => {
    const {
      process_log_id,
      billing_date,
      total_invoices,
      eligible,
      sent,
      failed,
      duration_ms,
    } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[WhatsApp] Process ${process_log_id} completed: ` +
        `${total_invoices} due, ${eligible} eligible, ${sent} sent, ${failed} failed (${duration_ms}ms)`
      );
    });

    return { logged: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

/**
 * Handle WhatsApp notification failure.
 */
export const whatsappNotificationsFailed = inngest.createFunction(
  {
    id: 'whatsapp-notifications-failed',
    name: 'WhatsApp Notifications Failed Handler',
  },
  { event: 'billing/whatsapp.failed' },
  async ({ event, step }) => {
    const { process_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(`[WhatsApp] Process ${process_log_id} failed (attempt ${attempt}): ${error}`);

      const supabase = await createClient();

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
    });

    return { handled: true };
  }
);
