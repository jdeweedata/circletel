/**
 * New Signup Follow-up Inngest Function
 *
 * Daily sweep for customers who registered a CircleTel account but never
 * progressed — no order, no service, no onboarding submission. Each one gets a
 * Zoho Desk ticket in the SALES department, and the Sales team gets one digest
 * email.
 *
 * Why: a review of 13–20 Aug 2026 found six such accounts, none of them contacted
 * by anyone. Without this job the gap reopens every week.
 *
 * The digest goes to SALES_TEAM_EMAIL, never to customers — none of them have
 * opted in to WhatsApp, so customer contact is Sales' job off the Desk ticket.
 *
 * Trigger: event 'sales/new-signup-followup.requested' (manual / programmatic).
 * The daily schedule runs through /api/cron/new-signup-followup instead.
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

const JOB_NAME = 'new-signup-followup';

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export const newSignupFollowupFunction = inngest.createFunction(
  {
    id: 'new-signup-followup',
    name: 'New Signup Follow-up to Sales',
    retries: 2,
    // Event-only. The SCHEDULE lives in vercel.json -> host crontab ->
    // /api/cron/new-signup-followup (see ops/scheduler/generate-crontab.sh).
    // Inngest crons are not the scheduling mechanism in this deployment, and two
    // schedulers for one job would just be confusing.
    triggers: [{ event: 'sales/new-signup-followup.requested' }],
  },
  async ({ event, step }) => {
    const startTime = Date.now();

    // Dual triggers (cron + event) widen event.data to a union, so narrow it here —
    // same approach as whatsapp-notifications.ts.
    const eventData = event?.data as
      | {
          triggered_by?: 'cron' | 'manual';
          admin_user_id?: string;
          process_log_id?: string;
          options?: {
            dryRun?: boolean;
            minAgeHours?: number;
            maxAgeDays?: number;
          };
        }
      | undefined;

    const options = eventData?.options ?? {};
    const dryRun = options.dryRun === true;
    const triggeredBy = eventData?.triggered_by ?? 'cron';

    // =========================================================================
    // Step 1: open a run log
    // =========================================================================
    const processLogId = await step.run('open-run-log', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: JOB_NAME,
          status: 'running',
          trigger_source: triggeredBy === 'manual' ? 'manual' : 'scheduled',
          environment: process.env.NODE_ENV ?? 'unknown',
        })
        .select('id')
        .single();

      if (error) {
        // Logging must never sink the run.
        console.error(`[NewSignupFollowup] Could not open run log: ${error.message}`);
        return null;
      }
      return data.id as string;
    });

    // =========================================================================
    // Step 2: run the follow-up (shared with the cron route, so they cannot drift)
    // =========================================================================
    const result = await step.run('run-followup', async () => {
      const { findUnflaggedSignups, runNewSignupFollowup } = await import(
        '@/lib/sales-engine/new-signup-followup-service'
      );

      const runOptions = {
        minAgeHours: options.minAgeHours ?? 24,
        maxAgeDays: options.maxAgeDays ?? 30,
      };

      if (dryRun) {
        const candidates = await findUnflaggedSignups(runOptions);
        return {
          candidates: candidates.length,
          ticketed: [] as string[],
          errors: [] as string[],
          salesAlerted: false,
        };
      }

      const run = await runNewSignupFollowup(runOptions);
      console.log(
        `[NewSignupFollowup] ${run.candidates} candidate(s), ${run.ticketed.length} ticketed, ` +
          `${run.errors.length} failed`
      );
      return {
        candidates: run.candidates,
        ticketed: run.ticketed,
        errors: run.errors,
        salesAlerted: run.salesAlerted,
      };
    });

    // =========================================================================
    // Step 5: close the run log + emit completion
    // =========================================================================
    const durationMs = Date.now() - startTime;

    await step.run('close-run-log', async () => {
      if (!processLogId) return;
      const supabase = await createClient();
      await supabase
        .from('cron_execution_log')
        .update({
          status: result.errors.length ? 'partial' : 'completed',
          execution_end: new Date().toISOString(),
          records_processed: result.ticketed.length,
          records_failed: result.errors.length,
          error_message: result.errors.length
            ? result.errors.join('; ').slice(0, 1000)
            : null,
          execution_details: {
            candidates: result.candidates,
            ticketed: result.ticketed.length,
            sales_alerted: result.salesAlerted,
          },
        })
        .eq('id', processLogId);
    });

    await step.sendEvent('send-completion-event', {
      name: 'sales/new-signup-followup.completed',
      data: {
        process_log_id: processLogId ?? 'unlogged',
        candidates: result.candidates,
        ticketed: result.ticketed.length,
        failed: result.errors.length,
        sales_alerted: result.salesAlerted,
        duration_ms: durationMs,
      },
    });

    return {
      candidates: result.candidates,
      ticketed: result.ticketed.length,
      failed: result.errors.length,
      salesAlerted: result.salesAlerted,
    };
  }
);

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

export const newSignupFollowupCompleted = inngest.createFunction(
  {
    id: 'new-signup-followup-completed',
    name: 'New Signup Follow-up Completed Handler',
    triggers: { event: 'sales/new-signup-followup.completed' },
  },
  async ({ event, step }) => {
    const { process_log_id, candidates, ticketed, failed, sales_alerted, duration_ms } =
      event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[NewSignupFollowup] Run ${process_log_id} completed: ` +
          `${candidates} candidate(s), ${ticketed} ticketed, ${failed} failed, ` +
          `digest ${sales_alerted ? 'sent' : 'not sent'} (${duration_ms}ms)`
      );
    });

    return { logged: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

export const newSignupFollowupFailed = inngest.createFunction(
  {
    id: 'new-signup-followup-failed',
    name: 'New Signup Follow-up Failed Handler',
    triggers: { event: 'sales/new-signup-followup.failed' },
  },
  async ({ event, step }) => {
    const { process_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(
        `[NewSignupFollowup] Run ${process_log_id} failed (attempt ${attempt}): ${error}`
      );

      if (process_log_id === 'unlogged') return;

      const supabase = await createClient();
      await supabase
        .from('cron_execution_log')
        .update({
          status: 'failed',
          execution_end: new Date().toISOString(),
          error_message: error,
          error_details: { failed_attempt: attempt },
        })
        .eq('id', process_log_id);
    });

    return { handled: true };
  }
);
