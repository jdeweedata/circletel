/**
 * PayNow Reconciliation Inngest Function
 *
 * Catches missed webhook payments by reconciling with the Netcash statement.
 * Migrated from cron job at app/api/cron/paynow-reconciliation/route.ts
 *
 * Features:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron (07:00 UTC / 09:00 SAST) and manual event
 * - Idempotent: skips transactions already recorded in payment_transactions
 * - Progress tracking via cron_execution_log table
 * - Cancellation support
 *
 * Schedule: Daily at 07:00 UTC (09:00 SAST)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { netcashStatementService } from '@/lib/payments/netcash-statement-service';
import { matchInvoiceByReference } from '@/lib/billing/invoice-matcher';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';
import { cronLogger } from '@/lib/logging';

// =============================================================================
// CONSTANTS
// =============================================================================

// PayNow-relevant transaction codes from the NetCash statement.
// These are credit entries representing PayNow gateway collections.
const PAYNOW_TRANSACTION_CODES = new Set([
  'EFT', // EFT / Instant EFT
  'CRD', // Card payment
  'OZW', // Ozow instant EFT
  'INS', // Instant payment
  'PNW', // Pay Now generic
  'WEB', // Web payment
  'ONL', // Online payment
]);

// =============================================================================
// PAYNOW RECONCILIATION FUNCTION
// =============================================================================

/**
 * Main PayNow reconciliation function.
 * Triggered by:
 * - Cron schedule: Daily at 07:00 UTC (09:00 SAST)
 * - Event: 'paynow/reconciliation.requested' for manual triggers
 */
export const paynowReconciliationFunction = inngest.createFunction(
  {
    id: 'paynow-reconciliation',
    name: 'PayNow Daily Reconciliation',
    retries: 3,
    cancelOn: [
      {
        event: 'paynow/reconciliation.cancelled',
        match: 'data.process_log_id',
      },
    ],
  },
  [
    // Cron trigger: daily at 07:00 UTC (09:00 SAST)
    { cron: '0 7 * * *' },
    // Event trigger: manual requests
    { event: 'paynow/reconciliation.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data (if manually triggered)
    const eventData = event?.data as {
      process_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      reconciliation_date?: string;
      admin_user_id?: string;
      options?: {
        dryRun?: boolean;
      };
    } | undefined;

    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;
    const dryRun = eventData?.options?.dryRun ?? false;

    // Default to yesterday — statements are available from 08:30 SAST for the previous day
    const reconciliationDate = eventData?.reconciliation_date
      ? new Date(eventData.reconciliation_date)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = reconciliationDate.toISOString().split('T')[0];

    // Track timing
    const startTime = Date.now();

    console.log(
      `[PayNowRecon] Starting PayNow reconciliation for ${dateStr} (triggered by: ${triggeredBy})`
    );

    // ── Step 1: Create process log ──────────────────────────────────────────

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
          cronLogger.error('[PayNowRecon] Failed to update process log', {
            error: error.message,
          });
          throw new Error(`Failed to update process log: ${error.message}`);
        }

        console.log(
          `[PayNowRecon] Updated process log ${eventData.process_log_id} to running`
        );
        return eventData.process_log_id;
      }

      // Create new process log for cron trigger
      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'paynow-reconciliation',
          status: 'running',
          started_at: new Date().toISOString(),
          result: {
            triggered_by: triggeredBy,
            triggered_by_user_id: adminUserId || null,
            reconciliation_date: dateStr,
            dry_run: dryRun,
          },
        })
        .select('id')
        .single();

      if (error || !newLog) {
        cronLogger.error('[PayNowRecon] Failed to create process log', {
          error: error?.message,
        });
        throw new Error(
          `Failed to create process log: ${error?.message || 'Unknown error'}`
        );
      }

      console.log(`[PayNowRecon] Created process log ${newLog.id}`);
      return newLog.id;
    });

    // ── Step 2: Fetch NetCash statement ─────────────────────────────────────

    const statement = await step.run('fetch-netcash-statement', async () => {
      cronLogger.info('[PayNowRecon] Fetching NetCash statement', {
        date: dateStr,
      });

      const result = await netcashStatementService.getStatement(
        reconciliationDate
      );

      if (!result.success) {
        // Non-retryable: statement simply not available yet
        cronLogger.warn(
          '[PayNowRecon] NetCash statement not available or failed',
          { error: result.error }
        );
      } else {
        cronLogger.info('[PayNowRecon] Statement fetched', {
          totalTransactions: result.transactions.length,
        });
      }

      return result;
    });

    // If statement fetch failed, finalize and exit early
    if (!statement.success) {
      const errorMsg = `NetCash statement not available: ${statement.error ?? 'Unknown error'}`;

      await step.run('finalize-log-no-statement', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed_with_errors',
            completed_at: new Date().toISOString(),
            result: {
              reconciliation_date: dateStr,
              statement_fetched: false,
              errors: [errorMsg],
              duration_ms: Date.now() - startTime,
            },
          })
          .eq('id', processLogId);
      });

      await step.run('send-completion-event-no-statement', async () => {
        await inngest.send({
          name: 'paynow/reconciliation.completed',
          data: {
            process_log_id: processLogId,
            reconciliation_date: dateStr,
            total_transactions: 0,
            matched: 0,
            newly_matched: 0,
            already_paid: 0,
            unmatched: 0,
            errors: [errorMsg],
            duration_ms: Date.now() - startTime,
          },
        });
      });

      return {
        success: false,
        processLogId,
        reconciliation_date: dateStr,
        statement_fetched: false,
        errors: [errorMsg],
      };
    }

    // ── Step 3: Process transactions ─────────────────────────────────────────

    const processingResult = await step.run('process-transactions', async () => {
      const supabase = await createClient();

      // Filter to PayNow credit transactions
      const payNowTransactions = statement.transactions.filter((tx) => {
        if (tx.effect !== '+') return false;
        const isPayNowCode = PAYNOW_TRANSACTION_CODES.has(tx.transactionCode);
        const hasPayNowDescription =
          tx.description?.toLowerCase().includes('paynow') ||
          tx.description?.toLowerCase().includes('ozow') ||
          tx.description?.toLowerCase().includes('online') ||
          tx.description?.toLowerCase().includes('web payment');
        return isPayNowCode || hasPayNowDescription;
      });

      cronLogger.info('[PayNowRecon] PayNow transactions identified', {
        count: payNowTransactions.length,
      });

      const counters = {
        total_transactions: payNowTransactions.length,
        matched: 0,
        newly_matched: 0,
        already_paid: 0,
        unmatched: 0,
        errors: [] as string[],
      };

      if (payNowTransactions.length === 0 || dryRun) {
        if (dryRun) {
          console.log(
            `[PayNowRecon] DRY RUN: Would process ${payNowTransactions.length} transactions`
          );
        } else {
          console.log('[PayNowRecon] No PayNow transactions to reconcile');
        }
        return counters;
      }

      for (const tx of payNowTransactions) {
        const reference =
          tx.accountReference ?? tx.reference ?? tx.description;

        if (!reference) {
          counters.errors.push(
            `Transaction with no reference skipped: ${JSON.stringify(tx)}`
          );
          continue;
        }

        try {
          // Idempotency: skip if already recorded
          const { data: existing } = await supabase
            .from('payment_transactions')
            .select('id')
            .eq('provider_reference', reference)
            .maybeSingle();

          if (existing) {
            cronLogger.debug(
              '[PayNowRecon] Transaction already recorded, skipping',
              { reference }
            );
            counters.already_paid++;
            continue;
          }

          // Match reference to an invoice
          const matchResult = await matchInvoiceByReference(
            reference,
            supabase
          );

          if (!matchResult.matched || !matchResult.invoice) {
            cronLogger.warn('[PayNowRecon] No invoice found for reference', {
              reference,
            });
            counters.unmatched++;
            continue;
          }

          counters.matched++;
          const invoice = matchResult.invoice;

          // Skip invoices already paid
          if (invoice.status === 'paid') {
            cronLogger.debug(
              '[PayNowRecon] Invoice already paid, skipping',
              { invoiceId: invoice.id, reference }
            );
            counters.already_paid++;
            continue;
          }

          // Create payment_transactions record
          const now = new Date().toISOString();
          const { data: paymentRecord, error: insertError } = await supabase
            .from('payment_transactions')
            .insert({
              invoice_id: invoice.id,
              transaction_id: `PAYNOW-RECON-${reference}-${dateStr}`,
              provider_reference: reference,
              amount: tx.amount,
              currency: 'ZAR',
              payment_method: 'paynow',
              status: 'completed',
              netcash_reference: reference,
              netcash_response: tx,
              webhook_received_at: null,
              completed_at: now,
            })
            .select('id')
            .single();

          if (insertError) {
            const msg = `Failed to create payment record for ${reference}: ${insertError.message}`;
            cronLogger.error('[PayNowRecon] ' + msg);
            counters.errors.push(msg);
            continue;
          }

          // Update invoice status to paid
          const { error: invoiceError } = await supabase
            .from('customer_invoices')
            .update({
              status: 'paid',
              amount_paid: tx.amount,
              paid_at: now,
              payment_method: 'paynow',
              payment_reference: reference,
              updated_at: now,
            })
            .eq('id', invoice.id);

          if (invoiceError) {
            const msg = `Failed to update invoice ${invoice.invoice_number}: ${invoiceError.message}`;
            cronLogger.error('[PayNowRecon] ' + msg);
            counters.errors.push(msg);
            continue;
          }

          counters.newly_matched++;
          cronLogger.info(
            '[PayNowRecon] Invoice marked as paid via reconciliation',
            {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              reference,
              amount: tx.amount,
              matchMethod: matchResult.matchMethod,
            }
          );

          // Sync payment to Zoho Billing (non-fatal)
          if (paymentRecord?.id) {
            try {
              const zohoResult = await syncPaymentToZohoBilling(
                paymentRecord.id
              );
              if (zohoResult.success) {
                cronLogger.info('[PayNowRecon] Payment synced to Zoho', {
                  paymentId: paymentRecord.id,
                  zohoPaymentId: zohoResult.zoho_payment_id,
                });
              } else {
                cronLogger.warn(
                  '[PayNowRecon] Zoho sync failed (non-fatal)',
                  { paymentId: paymentRecord.id, error: zohoResult.error }
                );
              }
            } catch (zohoError) {
              cronLogger.warn(
                '[PayNowRecon] Zoho sync threw error (non-fatal)',
                {
                  paymentId: paymentRecord.id,
                  error:
                    zohoError instanceof Error
                      ? zohoError.message
                      : String(zohoError),
                }
              );
            }
          }
        } catch (error) {
          const msg = `Unexpected error processing reference ${reference}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          cronLogger.error('[PayNowRecon] ' + msg);
          counters.errors.push(msg);
        }
      }

      return counters;
    });

    // ── Step 4: Update final log and send completion event ──────────────────

    const duration = Date.now() - startTime;
    const finalStatus =
      processingResult.errors.length > 0
        ? processingResult.newly_matched > 0
          ? 'completed_with_errors'
          : 'failed'
        : 'completed';

    await step.run('update-final-log', async () => {
      const supabase = await createClient();

      await supabase
        .from('cron_execution_log')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          result: {
            reconciliation_date: dateStr,
            statement_fetched: true,
            dry_run: dryRun,
            ...processingResult,
            duration_ms: duration,
          },
        })
        .eq('id', processLogId);

      cronLogger.info('[PayNowRecon] Reconciliation complete', {
        date: dateStr,
        total_transactions: processingResult.total_transactions,
        matched: processingResult.matched,
        newly_matched: processingResult.newly_matched,
        already_paid: processingResult.already_paid,
        unmatched: processingResult.unmatched,
        errors: processingResult.errors.length,
        duration_ms: duration,
      });
    });

    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'paynow/reconciliation.completed',
        data: {
          process_log_id: processLogId,
          reconciliation_date: dateStr,
          total_transactions: processingResult.total_transactions,
          matched: processingResult.matched,
          newly_matched: processingResult.newly_matched,
          already_paid: processingResult.already_paid,
          unmatched: processingResult.unmatched,
          errors: processingResult.errors,
          duration_ms: duration,
        },
      });
    });

    return {
      success: processingResult.errors.length === 0,
      processLogId,
      reconciliation_date: dateStr,
      ...processingResult,
      duration_ms: duration,
      dryRun,
    };
  }
);

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

/**
 * Handle PayNow reconciliation completion.
 * Logs completion metrics for observability.
 */
export const paynowReconciliationCompletedFunction = inngest.createFunction(
  {
    id: 'paynow-reconciliation-completed',
    name: 'PayNow Reconciliation Completed Handler',
  },
  { event: 'paynow/reconciliation.completed' },
  async ({ event, step }) => {
    const {
      process_log_id,
      reconciliation_date,
      total_transactions,
      matched,
      newly_matched,
      already_paid,
      unmatched,
      errors,
      duration_ms,
    } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[PayNowRecon] Process ${process_log_id} completed for ${reconciliation_date}: ` +
          `${total_transactions} transactions, ${matched} matched, ${newly_matched} newly matched, ` +
          `${already_paid} already paid, ${unmatched} unmatched, ${errors.length} errors (${duration_ms}ms)`
      );
    });

    return { logged: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

/**
 * Handle PayNow reconciliation failure.
 * Updates process log with failure status.
 */
export const paynowReconciliationFailedFunction = inngest.createFunction(
  {
    id: 'paynow-reconciliation-failed',
    name: 'PayNow Reconciliation Failed Handler',
  },
  { event: 'paynow/reconciliation.failed' },
  async ({ event, step }) => {
    const { process_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      cronLogger.error(
        `[PayNowRecon] Process ${process_log_id} failed (attempt ${attempt}): ${error}`
      );

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
