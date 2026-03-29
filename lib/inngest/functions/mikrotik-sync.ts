/**
 * MikroTik Router Sync Inngest Function
 *
 * Syncs router status from edge proxy to mikrotik_routers table with:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron and manual event
 * - Progress tracking via mikrotik_sync_logs table
 *
 * Schedule: Every 30 minutes (reduced from 5min to stay within Inngest free tier)
 *
 * @module lib/inngest/functions/mikrotik-sync
 */

import { inngest } from '../client';
import { MikrotikRouterService } from '@/lib/mikrotik';

// =============================================================================
// MIKROTIK SYNC FUNCTION
// =============================================================================

/**
 * Main MikroTik router sync function.
 * Triggered by:
 * - Cron schedule: Every 5 minutes
 * - Event: 'mikrotik/sync.requested' for manual triggers
 */
export const mikrotikSyncFunction = inngest.createFunction(
  {
    id: 'mikrotik-sync',
    name: 'MikroTik Router Sync',
    retries: 3,
    cancelOn: [
      {
        event: 'mikrotik/sync.cancelled',
        match: 'data.sync_id',
      },
    ],
  },
  [
    // Cron trigger: every 30 minutes (reduced to stay within Inngest free tier)
    { cron: '*/30 * * * *' },
    // Event trigger: manual requests
    { event: 'mikrotik/sync.requested' },
  ],
  async ({ event, step }) => {
    const startTime = Date.now();

    // Extract options from event data (if triggered manually)
    const eventData = event?.data as {
      sync_id?: string;
      triggered_by?: 'cron' | 'manual';
      admin_user_id?: string;
    } | undefined;

    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;

    // Step 1: Run sync
    const syncResult = await step.run('sync-all-routers', async () => {
      console.log('[MikrotikSync] Starting router sync...');
      const result = await MikrotikRouterService.syncAllRouters(triggeredBy, adminUserId);
      console.log(
        `[MikrotikSync] Completed: ${result.online} online, ${result.offline} offline, ${result.errors.length} errors`
      );
      return result;
    });

    // Step 2: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'mikrotik/sync.completed',
        data: {
          routers_online: syncResult.online,
          routers_offline: syncResult.offline,
          routers_failed: syncResult.failed,
          errors: syncResult.errors.slice(0, 10), // Limit errors in event
          duration_ms: syncResult.duration_ms,
          triggered_by: triggeredBy,
        },
      });
    });

    const duration = Date.now() - startTime;

    return {
      success: syncResult.errors.length === 0,
      online: syncResult.online,
      offline: syncResult.offline,
      failed: syncResult.failed,
      errors: syncResult.errors.length,
      duration,
    };
  }
);

// =============================================================================
// SYNC COMPLETION HANDLER
// =============================================================================

/**
 * Handle sync completion events.
 * Can be extended to send notifications, trigger downstream processes, etc.
 */
export const mikrotikSyncCompletedFunction = inngest.createFunction(
  {
    id: 'mikrotik-sync-completed',
    name: 'MikroTik Sync Completed Handler',
  },
  { event: 'mikrotik/sync.completed' },
  async ({ event, step }) => {
    const { routers_online, routers_offline, routers_failed, duration_ms } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[MikrotikSync] Sync completed: ` +
        `${routers_online} online, ${routers_offline} offline, ${routers_failed} failed (${duration_ms}ms)`
      );

      // Future: Send Slack notification if many routers are offline
      // if (routers_offline > 5) {
      //   await sendSlackAlert(`${routers_offline} MikroTik routers offline`);
      // }
    });

    return { logged: true };
  }
);

// =============================================================================
// EXPORTS
// =============================================================================

export const mikrotikFunctions = [
  mikrotikSyncFunction,
  mikrotikSyncCompletedFunction,
];
