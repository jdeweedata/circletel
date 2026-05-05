/**
 * EFT Reconciliation Inngest Function
 *
 * Reconciles EFT deposits from the Zoho Books Standard Bank cashbook against
 * customer invoices. The financial accountant records EFT deposits in Zoho Books;
 * this function pulls those deposits daily and matches them to unpaid invoices.
 *
 * Matching strategies (via invoice-matcher.ts):
 * 1. Invoice number extracted from reference (CT-INV... → INV-...)
 * 2. PayNow transaction reference stored on invoice
 * 3. Customer account number (CT-YYYY-NNNNN) → oldest unpaid invoice
 *
 * Schedule: Daily at 07:30 UTC (09:30 SAST) — runs 30 min after PayNow recon
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { cashbookService } from '@/lib/integrations/zoho/cashbook-service';
import { matchInvoiceByReference } from '@/lib/billing/invoice-matcher';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';
import { cronLogger } from '@/lib/logging';

// =============================================================================
// EFT RECONCILIATION FUNCTION
// =============================================================================

export const eftReconciliationFunction = inngest.createFunction(
  {
    id: 'eft-reconciliation',
    name: 'EFT Daily Reconciliation',
    retries: 3,
    cancelOn: [
      {
        event: 'eft/reconciliation.cancelled',
        match: 'data.process_log_id',
      },
    ],
  },
  [
    { cron: '30 7 * * *' },
    { event: 'eft/reconciliation.requested' },
  ],
  async ({ event, step }) => {
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

    const reconciliationDate = eventData?.reconciliation_date
      ? new Date(eventData.reconciliation_date)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = reconciliationDate.toISOString().split('T')[0];

    const startTime = Date.now();

    cronLogger.info(`[EFTRecon] Starting EFT reconciliation for ${dateStr}`, {
      triggeredBy,
      dryRun,
    });

    // ── Step 1: Create process log ──────────────────────────────────────────

    const processLogId = await step.run('create-process-log', async () => {
      const supabase = await createClient();

      if (eventData?.process_log_id) {
        const { error } = await supabase
          .from('cron_execution_log')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.process_log_id);

        if (error) {
          throw new Error(`Failed to update process log: ${error.message}`);
        }
        return eventData.process_log_id;
      }

      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'eft-reconciliation',
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
        throw new Error(`Failed to create process log: ${error?.message || 'Unknown error'}`);
      }

      return newLog.id;
    });

    // ── Step 2: Pull EFT deposits from Zoho Books cashbook ──────────────────

    const cashbookResult = await step.run('pull-zoho-cashbook-deposits', async () => {
      try {
        const result = await cashbookService.pullDeposits(dateStr, dateStr);
        cronLogger.info('[EFTRecon] Cashbook deposits pulled', {
          count: result.totalCount,
          totalAmount: result.totalAmount,
        });
        return { success: true as const, ...result };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        cronLogger.error('[EFTRecon] Failed to pull cashbook deposits', { error: msg });
        return { success: false as const, error: msg, deposits: [], totalCount: 0, totalAmount: 0 };
      }
    });

    if (!cashbookResult.success) {
      const errorMsg = `Zoho cashbook pull failed: ${cashbookResult.error}`;

      await step.run('finalize-log-no-deposits', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed_with_errors',
            completed_at: new Date().toISOString(),
            result: {
              reconciliation_date: dateStr,
              cashbook_fetched: false,
              errors: [errorMsg],
              duration_ms: Date.now() - startTime,
            },
          })
          .eq('id', processLogId);
      });

      await step.run('send-completion-event-no-deposits', async () => {
        await inngest.send({
          name: 'eft/reconciliation.completed',
          data: {
            process_log_id: processLogId,
            reconciliation_date: dateStr,
            total_deposits: 0,
            matched: 0,
            newly_matched: 0,
            already_paid: 0,
            unmatched: 0,
            queued: 0,
            errors: [errorMsg],
            duration_ms: Date.now() - startTime,
          },
        });
      });

      return {
        success: false,
        processLogId,
        reconciliation_date: dateStr,
        cashbook_fetched: false,
        errors: [errorMsg],
      };
    }

    // ── Step 3: Process deposits — match to invoices ────────────────────────

    const processingResult = await step.run('process-eft-deposits', async () => {
      const supabase = await createClient();

      const counters = {
        total_deposits: cashbookResult.deposits.length,
        total_amount: cashbookResult.totalAmount,
        matched: 0,
        newly_matched: 0,
        already_paid: 0,
        unmatched: 0,
        queued: 0,
        errors: [] as string[],
      };

      if (cashbookResult.deposits.length === 0 || dryRun) {
        if (dryRun) {
          cronLogger.info(`[EFTRecon] DRY RUN: Would process ${cashbookResult.deposits.length} deposits`);
        }
        return counters;
      }

      for (const deposit of cashbookResult.deposits) {
        const reference = deposit.reference || deposit.payerName || deposit.description;

        if (!reference) {
          counters.errors.push(`Deposit with no reference skipped: ${deposit.transactionId}`);
          continue;
        }

        try {
          // Idempotency: skip if this Zoho transaction already recorded
          const { data: existing } = await supabase
            .from('payment_transactions')
            .select('id')
            .eq('provider_reference', `EFT-${deposit.transactionId}`)
            .maybeSingle();

          if (existing) {
            counters.already_paid++;
            continue;
          }

          // Also check reconciliation_queue to avoid re-queuing
          const { data: existingQueued } = await supabase
            .from('reconciliation_queue')
            .select('id')
            .eq('source', 'zoho_cashbook')
            .eq('source_reference', deposit.transactionId)
            .maybeSingle();

          if (existingQueued) {
            counters.already_paid++;
            continue;
          }

          // Match reference to an invoice
          const matchResult = await matchInvoiceByReference(reference, supabase);

          if (!matchResult.matched || !matchResult.invoice) {
            counters.unmatched++;

            // Queue for admin review
            const { error: queueError } = await supabase
              .from('reconciliation_queue')
              .upsert(
                {
                  source: 'zoho_cashbook',
                  source_reference: deposit.transactionId,
                  source_date: deposit.date,
                  amount: deposit.amount,
                  currency: 'ZAR',
                  payment_method: 'eft',
                  payer_reference: reference,
                  payer_name: deposit.payerName || null,
                  match_confidence: 0.0,
                  match_method: null,
                  status: 'pending',
                  raw_data: deposit.rawData,
                },
                { onConflict: 'source,source_reference', ignoreDuplicates: true }
              );

            if (queueError) {
              cronLogger.warn('[EFTRecon] Failed to queue unmatched deposit', {
                transactionId: deposit.transactionId,
                error: queueError.message,
              });
            } else {
              counters.queued++;
            }
            continue;
          }

          counters.matched++;
          const invoice = matchResult.invoice;

          // Skip invoices already paid
          if (invoice.status === 'paid') {
            counters.already_paid++;
            continue;
          }

          // Create payment_transactions record
          const now = new Date().toISOString();
          const { data: paymentRecord, error: insertError } = await supabase
            .from('payment_transactions')
            .insert({
              invoice_id: invoice.id,
              transaction_id: `EFT-RECON-${deposit.transactionId}`,
              provider_reference: `EFT-${deposit.transactionId}`,
              amount: deposit.amount,
              currency: 'ZAR',
              payment_method: 'eft',
              status: 'completed',
              reconciliation_source: 'eft_cashbook',
              completed_at: now,
              netcash_response: deposit.rawData,
            })
            .select('id')
            .single();

          if (insertError) {
            const msg = `Failed to create payment record for EFT ${deposit.transactionId}: ${insertError.message}`;
            cronLogger.error('[EFTRecon] ' + msg);
            counters.errors.push(msg);
            continue;
          }

          // Update invoice status to paid
          const { error: invoiceError } = await supabase
            .from('customer_invoices')
            .update({
              status: 'paid',
              amount_paid: deposit.amount,
              paid_at: now,
              payment_method: 'eft',
              payment_reference: reference,
              updated_at: now,
            })
            .eq('id', invoice.id);

          if (invoiceError) {
            const msg = `Failed to update invoice ${invoice.invoice_number}: ${invoiceError.message}`;
            cronLogger.error('[EFTRecon] ' + msg);
            counters.errors.push(msg);
            continue;
          }

          counters.newly_matched++;
          cronLogger.info('[EFTRecon] Invoice marked as paid via EFT reconciliation', {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            reference,
            amount: deposit.amount,
            matchMethod: matchResult.matchMethod,
          });

          // Sync payment to Zoho Billing (non-fatal)
          if (paymentRecord?.id) {
            try {
              const zohoResult = await syncPaymentToZohoBilling(paymentRecord.id);
              if (!zohoResult.success) {
                cronLogger.warn('[EFTRecon] Zoho billing sync failed (non-fatal)', {
                  paymentId: paymentRecord.id,
                  error: zohoResult.error,
                });
              }
            } catch (zohoError) {
              cronLogger.warn('[EFTRecon] Zoho billing sync threw (non-fatal)', {
                error: zohoError instanceof Error ? zohoError.message : String(zohoError),
              });
            }
          }
        } catch (error) {
          const msg = `Unexpected error processing deposit ${deposit.transactionId}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          cronLogger.error('[EFTRecon] ' + msg);
          counters.errors.push(msg);
        }
      }

      return counters;
    });

    // ── Step 4: Finalize log and send completion event ──────────────────────

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
            cashbook_fetched: true,
            dry_run: dryRun,
            ...processingResult,
            duration_ms: duration,
          },
        })
        .eq('id', processLogId);

      cronLogger.info('[EFTRecon] Reconciliation complete', {
        date: dateStr,
        ...processingResult,
        duration_ms: duration,
      });
    });

    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'eft/reconciliation.completed',
        data: {
          process_log_id: processLogId,
          reconciliation_date: dateStr,
          total_deposits: processingResult.total_deposits,
          matched: processingResult.matched,
          newly_matched: processingResult.newly_matched,
          already_paid: processingResult.already_paid,
          unmatched: processingResult.unmatched,
          queued: processingResult.queued,
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

export const eftReconciliationCompletedFunction = inngest.createFunction(
  {
    id: 'eft-reconciliation-completed',
    name: 'EFT Reconciliation Completed Handler',
  },
  { event: 'eft/reconciliation.completed' },
  async ({ event }) => {
    const {
      process_log_id,
      reconciliation_date,
      total_deposits,
      matched,
      newly_matched,
      unmatched,
      queued,
      errors,
      duration_ms,
    } = event.data;

    cronLogger.info('[EFTRecon] Completion event received', {
      process_log_id,
      reconciliation_date,
      total_deposits,
      matched,
      newly_matched,
      unmatched,
      queued,
      errors: errors.length,
      duration_ms,
    });
  }
);
