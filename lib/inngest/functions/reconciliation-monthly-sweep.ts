/**
 * Monthly Reconciliation Sweep Inngest Function
 *
 * Runs on the 3rd of each month to catch any payments from the previous month
 * that were missed by the daily reconciliation runs. Pulls the full month's
 * deposits from Zoho Books cashbook and cross-references with payment_transactions.
 *
 * Only processes deposits that don't already have a matching payment_transactions
 * record or existing reconciliation_queue entry.
 *
 * Schedule: 3rd of every month at 06:00 UTC (08:00 SAST)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { cashbookService } from '@/lib/integrations/zoho/cashbook-service';
import { matchInvoiceByReference } from '@/lib/billing/invoice-matcher';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';
import { cronLogger } from '@/lib/logging';

// =============================================================================
// MONTHLY SWEEP FUNCTION
// =============================================================================

export const reconciliationMonthlySweepFunction = inngest.createFunction(
  {
    id: 'reconciliation-monthly-sweep',
    name: 'Monthly Reconciliation Sweep',
    retries: 2,
    cancelOn: [
      {
        event: 'reconciliation/monthly-sweep.cancelled',
        match: 'data.process_log_id',
      },
    ],
  },
  [
    { cron: '0 6 3 * *' },
    { event: 'reconciliation/monthly-sweep.requested' },
  ],
  async ({ event, step }) => {
    const eventData = event?.data as {
      process_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      year?: number;
      month?: number;
      admin_user_id?: string;
      options?: {
        dryRun?: boolean;
      };
    } | undefined;

    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;
    const dryRun = eventData?.options?.dryRun ?? false;

    // Default: previous month
    const now = new Date();
    const targetYear = eventData?.year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const targetMonth = eventData?.month ?? (now.getMonth() === 0 ? 12 : now.getMonth());
    const monthLabel = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const startTime = Date.now();

    cronLogger.info(`[MonthlySweep] Starting monthly sweep for ${monthLabel}`, {
      triggeredBy,
      dryRun,
    });

    // ── Step 1: Create process log ──────────────────────────────────────────

    const processLogId = await step.run('create-process-log', async () => {
      const supabase = await createClient();

      if (eventData?.process_log_id) {
        await supabase
          .from('cron_execution_log')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', eventData.process_log_id);
        return eventData.process_log_id;
      }

      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'reconciliation-monthly-sweep',
          status: 'running',
          started_at: new Date().toISOString(),
          result: {
            triggered_by: triggeredBy,
            triggered_by_user_id: adminUserId || null,
            target_month: monthLabel,
            dry_run: dryRun,
          },
        })
        .select('id')
        .single();

      if (error || !newLog) {
        throw new Error(`Failed to create process log: ${error?.message || 'Unknown'}`);
      }
      return newLog.id;
    });

    // ── Step 2: Pull full month's deposits from Zoho Books ──────────────────

    const cashbookResult = await step.run('pull-month-deposits', async () => {
      try {
        const result = await cashbookService.pullMonthDeposits(targetYear, targetMonth);
        cronLogger.info('[MonthlySweep] Month deposits pulled', {
          month: monthLabel,
          count: result.totalCount,
          totalAmount: result.totalAmount,
        });
        return { success: true as const, ...result };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        cronLogger.error('[MonthlySweep] Failed to pull month deposits', { error: msg });
        return { success: false as const, error: msg, deposits: [], totalCount: 0, totalAmount: 0 };
      }
    });

    if (!cashbookResult.success) {
      const errorMsg = `Monthly cashbook pull failed: ${cashbookResult.error}`;

      await step.run('finalize-log-failure', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed_with_errors',
            completed_at: new Date().toISOString(),
            result: { target_month: monthLabel, errors: [errorMsg], duration_ms: Date.now() - startTime },
          })
          .eq('id', processLogId);
      });

      return { success: false, processLogId, target_month: monthLabel, errors: [errorMsg] };
    }

    // ── Step 3: Filter to unreconciled deposits and process ─────────────────

    const processingResult = await step.run('process-unreconciled-deposits', async () => {
      const supabase = await createClient();

      const counters = {
        total_month_deposits: cashbookResult.deposits.length,
        total_amount: cashbookResult.totalAmount,
        already_reconciled: 0,
        already_queued: 0,
        newly_matched: 0,
        newly_queued: 0,
        errors: [] as string[],
      };

      if (cashbookResult.deposits.length === 0 || dryRun) {
        if (dryRun) {
          cronLogger.info(`[MonthlySweep] DRY RUN: Would sweep ${cashbookResult.deposits.length} deposits`);
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
          // Skip if already recorded as a payment
          const { data: existingPayment } = await supabase
            .from('payment_transactions')
            .select('id')
            .eq('provider_reference', `EFT-${deposit.transactionId}`)
            .maybeSingle();

          if (existingPayment) {
            counters.already_reconciled++;
            continue;
          }

          // Skip if already in reconciliation queue
          const { data: existingQueued } = await supabase
            .from('reconciliation_queue')
            .select('id')
            .eq('source', 'zoho_cashbook')
            .eq('source_reference', deposit.transactionId)
            .maybeSingle();

          if (existingQueued) {
            counters.already_queued++;
            continue;
          }

          // Attempt to match
          const matchResult = await matchInvoiceByReference(reference, supabase);

          if (!matchResult.matched || !matchResult.invoice) {
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

            if (!queueError) counters.newly_queued++;
            continue;
          }

          const invoice = matchResult.invoice;

          if (invoice.status === 'paid') {
            counters.already_reconciled++;
            continue;
          }

          // Create payment record and mark invoice paid
          const paymentNow = new Date().toISOString();
          const { data: paymentRecord, error: insertError } = await supabase
            .from('payment_transactions')
            .insert({
              invoice_id: invoice.id,
              transaction_id: `EFT-SWEEP-${deposit.transactionId}`,
              provider_reference: `EFT-${deposit.transactionId}`,
              amount: deposit.amount,
              currency: 'ZAR',
              payment_method: 'eft',
              status: 'completed',
              reconciliation_source: 'eft_cashbook',
              completed_at: paymentNow,
              netcash_response: deposit.rawData,
            })
            .select('id')
            .single();

          if (insertError) {
            counters.errors.push(`Payment insert failed for ${deposit.transactionId}: ${insertError.message}`);
            continue;
          }

          const { error: invoiceError } = await supabase
            .from('customer_invoices')
            .update({
              status: 'paid',
              amount_paid: deposit.amount,
              paid_at: paymentNow,
              payment_method: 'eft',
              payment_reference: reference,
              updated_at: paymentNow,
            })
            .eq('id', invoice.id);

          if (invoiceError) {
            counters.errors.push(`Invoice update failed for ${invoice.invoice_number}: ${invoiceError.message}`);
            continue;
          }

          counters.newly_matched++;
          cronLogger.info('[MonthlySweep] Invoice matched in sweep', {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: deposit.amount,
            matchMethod: matchResult.matchMethod,
          });

          // Zoho sync (non-fatal)
          if (paymentRecord?.id) {
            try {
              await syncPaymentToZohoBilling(paymentRecord.id);
            } catch {
              // Non-fatal
            }
          }
        } catch (error) {
          counters.errors.push(
            `Error processing ${deposit.transactionId}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return counters;
    });

    // ── Step 4: Finalize ────────────────────────────────────────────────────

    const duration = Date.now() - startTime;
    const finalStatus = processingResult.errors.length > 0 ? 'completed_with_errors' : 'completed';

    await step.run('update-final-log', async () => {
      const supabase = await createClient();

      await supabase
        .from('cron_execution_log')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          result: {
            target_month: monthLabel,
            dry_run: dryRun,
            ...processingResult,
            duration_ms: duration,
          },
        })
        .eq('id', processLogId);

      cronLogger.info('[MonthlySweep] Sweep complete', {
        month: monthLabel,
        ...processingResult,
        duration_ms: duration,
      });
    });

    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'reconciliation/monthly-sweep.completed',
        data: {
          process_log_id: processLogId,
          target_month: monthLabel,
          ...processingResult,
          duration_ms: duration,
        },
      });
    });

    return {
      success: processingResult.errors.length === 0,
      processLogId,
      target_month: monthLabel,
      ...processingResult,
      duration_ms: duration,
    };
  }
);
