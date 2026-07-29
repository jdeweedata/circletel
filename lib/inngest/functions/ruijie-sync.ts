/**
 * Ruijie Device Sync Inngest Function
 *
 * Syncs device data from Ruijie Cloud API to ruijie_device_cache table with:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron and manual event
 * - Progress tracking via ruijie_sync_logs table
 *
 * Schedule: Every 30 minutes (reduced from 5min to stay within Inngest free tier)
 */

import { inngest } from '../client';
import { ruijieSyncCompleted, ruijieSyncSessions } from '../events/ruijie';
import {
  getAllDevices,
  enrichDevicesWithLiveMetrics,
  upsertDevices,
  pruneDevicesNotInSet,
  filterActiveDevices,
  RUIJIE_ACTIVE_WINDOW_DAYS,
  createSyncLog,
  logSyncRun,
  seedMockData,
  isCacheEmpty,
  isMockMode,
  RuijieDevice,
} from '@/lib/ruijie';

// =============================================================================
// RUIJIE SYNC FUNCTION
// =============================================================================

/**
 * Main Ruijie device sync function.
 * Triggered by:
 * - Cron schedule: Every 5 minutes
 * - Event: 'ruijie/sync.requested' for manual triggers
 */
export const ruijieSyncFunction = inngest.createFunction(
  {

    id: 'ruijie-sync',
    name: 'Ruijie Device Sync',
    retries: 3,
    cancelOn: [
      {
        event: 'ruijie/sync.cancelled',
        match: 'data.sync_log_id',
      },
    ],
  triggers: [
    // Cron trigger: every 30 minutes (reduced to stay within Inngest free tier)
    { cron: '*/30 * * * *' },
    // Event trigger: manual requests
    { event: 'ruijie/sync.requested' },
  ],
}, async ({ event, step }) => {
    const startTime = Date.now();

    // Extract options from event data (if triggered manually)
    const eventData = event?.data as {
      sync_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      admin_user_id?: string;
    } | undefined;

    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;

    // Step 1: Create sync log
    const syncLogId = await step.run('create-sync-log', async () => {
      if (eventData?.sync_log_id) {
        console.log(`[RuijieSync] Using existing sync log ${eventData.sync_log_id}`);
        return eventData.sync_log_id;
      }
      const id = await createSyncLog(triggeredBy, adminUserId);
      console.log(`[RuijieSync] Created sync log ${id}`);
      return id;
    });

    // Step 2: Check if mock mode needs seeding
    if (isMockMode()) {
      await step.run('check-mock-seed', async () => {
        const empty = await isCacheEmpty();
        if (empty) {
          console.log('[RuijieSync] Mock mode, cache empty, seeding...');
          await seedMockData();
        }
      });
    }

    // Step 3: Fetch devices
    const devices = await step.run('fetch-devices', async () => {
      console.log('[RuijieSync] Fetching devices...');
      const result = await getAllDevices();
      console.log(`[RuijieSync] Fetched ${result.length} devices`);
      return result;
    });

    // Step 3b: Keep only online or last_seen within 14 days
    const activeDevices = await step.run('filter-active-window', async () => {
      const filtered = filterActiveDevices(
        devices as unknown as RuijieDevice[]
      );
      console.log(
        `[RuijieSync] Active window ${RUIJIE_ACTIVE_WINDOW_DAYS}d: ` +
          `${filtered.length}/${(devices as unknown as RuijieDevice[]).length} kept`
      );
      return filtered;
    });

    // Step 4: Enrich with current_performance + STA util/clients (Tier 1)
    const enrichedDevices = await step.run('enrich-live-metrics', async () => {
      console.log('[RuijieSync] Enriching CPU/mem + STA metrics...');
      const result = await enrichDevicesWithLiveMetrics(
        activeDevices as unknown as RuijieDevice[]
      );
      const withCpu = result.filter((d) => d.cpu_usage != null).length;
      const withClients = result.reduce((s, d) => s + (d.online_clients || 0), 0);
      console.log(
        `[RuijieSync] Metrics: ${withCpu} devices with CPU, ${withClients} total STA clients`
      );
      return result;
    });

    // Step 5: Upsert devices
    const syncResult = await step.run('upsert-devices', async () => {
      console.log('[RuijieSync] Upserting devices to cache...');
      // Cast needed because Inngest's JsonifyObject type wrapper differs from RuijieDevice
      const result = await upsertDevices(
        enrichedDevices as unknown as RuijieDevice[],
        isMockMode()
      );
      console.log(`[RuijieSync] Upserted: ${result.added} added, ${result.updated} updated`);
      return result;
    });

    // Step 5b: Remove cache rows outside the active window
    const pruneResult = await step.run('prune-inactive-devices', async () => {
      const keepSns = (enrichedDevices as unknown as RuijieDevice[]).map((d) => d.sn);
      const result = await pruneDevicesNotInSet(keepSns);
      if (result.deleted > 0) {
        console.log(
          `[RuijieSync] Pruned ${result.deleted} inactive devices: ${result.deletedSns.join(', ')}`
        );
      }
      return result;
    });

    // Step 6: Update sync log
    const duration = Date.now() - startTime;
    await step.run('update-sync-log', async () => {
      await logSyncRun(
        {
          ...syncResult,
          devicesFetched: (activeDevices as unknown as RuijieDevice[]).length,
          durationMs: duration,
        },
        triggeredBy,
        adminUserId,
        syncLogId
      );
      console.log(`[RuijieSync] Updated sync log ${syncLogId}`);
    });

    // Step 7: Send completion event (session groups fan-out runs in dashboard)
    await step.sendEvent(
      'send-completion-event',
      ruijieSyncCompleted.create(
        {
          sync_log_id: syncLogId,
          devices_fetched: (activeDevices as unknown as RuijieDevice[]).length,
          added: syncResult.added,
          updated: syncResult.updated,
          pruned: pruneResult.deleted,
          errors: syncResult.errors.length,
          duration_ms: duration,
        },
        {
          meta: {
            sessions: ruijieSyncSessions(syncLogId),
          },
        }
      )
    );

    return {
      success: syncResult.errors.length === 0,
      syncLogId,
      devicesFetched: (activeDevices as unknown as RuijieDevice[]).length,
      added: syncResult.added,
      updated: syncResult.updated,
      pruned: pruneResult.deleted,
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
export const ruijieSyncCompletedFunction = inngest.createFunction(
  {

    id: 'ruijie-sync-completed',
    name: 'Ruijie Sync Completed Handler',
  triggers: [ruijieSyncCompleted],
}, async ({ event, step }) => {
    const { sync_log_id, devices_fetched, added, updated, errors, duration_ms } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[RuijieSync] Sync ${sync_log_id} completed: ` +
        `${devices_fetched} fetched, ${added} added, ${updated} updated, ${errors} errors (${duration_ms}ms)` +
        ` [session:sync_log_id=${sync_log_id}]`
      );

      // Future: Send Slack notification for large syncs or errors
      // Future: Update dashboard metrics
    });

    return { logged: true };
  }
);
