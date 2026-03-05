/**
 * DFA Building Sync Inngest Function
 *
 * Syncs building data from DFA ArcGIS API to dfa_buildings table with:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron and manual event
 * - Progress tracking via dfa_sync_logs table
 * - Cancellation support
 *
 * Schedule: Daily at 2 AM SAST (00:00 UTC)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { dfaSyncService } from '@/lib/coverage/providers/dfa/dfa-sync-service';

// =============================================================================
// DFA SYNC FUNCTION
// =============================================================================

/**
 * Main DFA building sync function.
 * Triggered by:
 * - Cron schedule: Daily at 2 AM SAST (00:00 UTC)
 * - Event: 'dfa/sync.requested' for manual triggers
 */
export const dfaSyncFunction = inngest.createFunction(
  {
    id: 'dfa-sync',
    name: 'DFA Building Sync',
    retries: 3,
    cancelOn: [
      {
        event: 'dfa/sync.cancelled',
        match: 'data.sync_log_id',
      },
    ],
  },
  [
    // Cron trigger: 2 AM SAST = 00:00 UTC
    { cron: '0 0 * * *' },
    // Event trigger: manual requests
    { event: 'dfa/sync.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data (if triggered manually)
    const eventData = event?.data as
      | {
          sync_log_id?: string;
          triggered_by?: 'cron' | 'manual';
          admin_user_id?: string;
          options?: {
            connectedOnly?: boolean;
            nearNetOnly?: boolean;
            dryRun?: boolean;
          };
        }
      | undefined;

    const dryRun = eventData?.options?.dryRun ?? false;
    const connectedOnly = eventData?.options?.connectedOnly ?? false;
    const nearNetOnly = eventData?.options?.nearNetOnly ?? false;
    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;

    // Track timing
    const startTime = Date.now();

    // Step 1: Create or update sync log
    const syncLogId = await step.run('create-sync-log', async () => {
      const supabase = await createClient();

      // If sync_log_id provided (manual trigger), update existing log
      if (eventData?.sync_log_id) {
        const { error } = await supabase
          .from('dfa_sync_logs')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.sync_log_id);

        if (error) {
          console.error('[DFASync] Failed to update sync log:', error);
          throw new Error(`Failed to update sync log: ${error.message}`);
        }

        console.log(
          `[DFASync] Updated sync log ${eventData.sync_log_id} to running`
        );
        return eventData.sync_log_id;
      }

      // Create new sync log for cron trigger
      const { data: newLog, error } = await supabase
        .from('dfa_sync_logs')
        .insert({
          status: 'running',
          triggered_by: triggeredBy,
          triggered_by_user_id: adminUserId || null,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error || !newLog) {
        console.error('[DFASync] Failed to create sync log:', error);
        throw new Error(
          `Failed to create sync log: ${error?.message || 'Unknown error'}`
        );
      }

      console.log(`[DFASync] Created sync log ${newLog.id}`);
      return newLog.id;
    });

    // Step 2: PiCheckBold API health
    await step.run('check-api-health', async () => {
      const health = await dfaSyncService.checkHealth();

      if (!health.healthy) {
        throw new Error(
          `DFA API unhealthy: Connected=${health.connectedLayer}, NearNet=${health.nearNetLayer}`
        );
      }

      console.log(`[DFASync] API health check passed (${health.responseTime}ms)`);
    });

    // Step 3: Run the sync
    const syncResult = await step.run('sync-buildings', async () => {
      console.log('[DFASync] Starting building sync...');

      const result = await dfaSyncService.sync({
        connectedOnly,
        nearNetOnly,
        dryRun,
      });

      console.log(
        `[DFASync] Sync complete: ${result.connectedCount} connected, ` +
          `${result.nearNetCount} near-net, ${result.recordsInserted} inserted, ` +
          `${result.recordsUpdated} updated (${result.durationMs}ms)`
      );

      return result;
    });

    // Step 4: Update sync log with results
    const finalResult = await step.run('update-sync-log', async () => {
      const supabase = await createClient();
      const duration = Date.now() - startTime;
      const hasErrors = syncResult.errors.length > 0;

      const { error } = await supabase
        .from('dfa_sync_logs')
        .update({
          status: hasErrors
            ? 'completed_with_errors'
            : dryRun
              ? 'completed'
              : 'completed',
          connected_count: syncResult.connectedCount,
          near_net_count: syncResult.nearNetCount,
          records_fetched: syncResult.connectedCount + syncResult.nearNetCount,
          records_inserted: syncResult.recordsInserted,
          records_updated: syncResult.recordsUpdated,
          error_message: hasErrors
            ? syncResult.errors.slice(0, 10).join('; ')
            : null,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
          metadata: { dryRun },
        })
        .eq('id', syncLogId);

      if (error) {
        console.error('[DFASync] Failed to update sync log:', error);
      }

      return {
        success: syncResult.success,
        syncLogId,
        connectedCount: syncResult.connectedCount,
        nearNetCount: syncResult.nearNetCount,
        recordsInserted: syncResult.recordsInserted,
        recordsUpdated: syncResult.recordsUpdated,
        errors: syncResult.errors.length,
        duration,
        dryRun,
      };
    });

    // Step 5: PiPaperPlaneRightBold completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'dfa/sync.completed',
        data: {
          sync_log_id: syncLogId,
          connected_count: syncResult.connectedCount,
          near_net_count: syncResult.nearNetCount,
          records_inserted: syncResult.recordsInserted,
          records_updated: syncResult.recordsUpdated,
          duration_ms: finalResult.duration,
        },
      });
    });

    return finalResult;
  }
);

// =============================================================================
// SYNC COMPLETION HANDLER
// =============================================================================

/**
 * Handle sync completion events.
 * Can be extended to send notifications, trigger downstream processes, etc.
 */
export const dfaSyncCompletedFunction = inngest.createFunction(
  {
    id: 'dfa-sync-completed',
    name: 'DFA Sync Completed Handler',
  },
  { event: 'dfa/sync.completed' },
  async ({ event, step }) => {
    const {
      sync_log_id,
      connected_count,
      near_net_count,
      records_inserted,
      records_updated,
      duration_ms,
    } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[DFASync] Sync ${sync_log_id} completed: ` +
          `${connected_count} connected, ${near_net_count} near-net, ` +
          `${records_inserted} inserted, ${records_updated} updated (${duration_ms}ms)`
      );

      // TODO: PiPaperPlaneRightBold Slack notification for large syncs
      // TODO: Update dashboard metrics
      // TODO: Trigger coverage cache refresh if significant changes
    });

    return { logged: true };
  }
);

// =============================================================================
// SYNC FAILED HANDLER
// =============================================================================

/**
 * Handle sync failure events.
 * Sends alerts and updates logs on failure.
 */
export const dfaSyncFailedFunction = inngest.createFunction(
  {
    id: 'dfa-sync-failed',
    name: 'DFA Sync Failed Handler',
  },
  { event: 'dfa/sync.failed' },
  async ({ event, step }) => {
    const { sync_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(
        `[DFASync] Sync ${sync_log_id} failed (attempt ${attempt}): ${error}`
      );

      const supabase = await createClient();

      // Update sync log with failure status
      await supabase
        .from('dfa_sync_logs')
        .update({
          status: 'failed',
          error_message: error,
          completed_at: new Date().toISOString(),
          metadata: { failedAttempt: attempt },
        })
        .eq('id', sync_log_id);

      // TODO: PiPaperPlaneRightBold alert notification for sync failures
      // TODO: Log to error tracking service (Sentry, etc.)
    });

    return { handled: true };
  }
);
