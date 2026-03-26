/**
 * Tarana Base Station Sync Inngest Function
 *
 * Syncs BN data from Tarana Portal API to tarana_base_stations table with:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron and manual event
 * - Progress tracking via tarana_sync_logs table
 * - Cancellation support
 *
 * Schedule: Daily at midnight SAST (22:00 UTC)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { getAllBaseNodes } from '@/lib/tarana/client';
import type { TaranaRadio } from '@/lib/tarana/types';

// =============================================================================
// TARANA SYNC FUNCTION
// =============================================================================

/**
 * Main Tarana base station sync function.
 * Triggered by:
 * - Cron schedule: Daily at midnight SAST (22:00 UTC)
 * - Event: 'tarana/sync.requested' for manual triggers
 */
export const taranaSyncFunction = inngest.createFunction(
  {
    id: 'tarana-sync',
    name: 'Tarana Base Station Sync',
    retries: 3,
    cancelOn: [
      {
        event: 'tarana/sync.cancelled',
        match: 'data.sync_log_id',
      },
    ],
  },
  [
    // Cron trigger: midnight SAST = 22:00 UTC
    { cron: '0 22 * * *' },
    // Event trigger: manual requests
    { event: 'tarana/sync.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data (if triggered manually)
    const eventData = event?.data as {
      sync_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      admin_user_id?: string;
      options?: {
        deleteStale?: boolean;
        dryRun?: boolean;
      };
    } | undefined;

    const deleteStale = eventData?.options?.deleteStale ?? false;
    const dryRun = eventData?.options?.dryRun ?? false;
    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;

    // Track timing
    const startTime = Date.now();
    let inserted = 0;
    let updated = 0;
    let deleted = 0;
    const errors: string[] = [];

    // Step 1: Create or update sync log
    const syncLogId = await step.run('create-sync-log', async () => {
      const supabase = await createClient();

      // If sync_log_id provided (manual trigger), update existing log
      if (eventData?.sync_log_id) {
        const { error } = await supabase
          .from('tarana_sync_logs')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.sync_log_id);

        if (error) {
          console.error('[TaranaSync] Failed to update sync log:', error);
          throw new Error(`Failed to update sync log: ${error.message}`);
        }

        console.log(`[TaranaSync] Updated sync log ${eventData.sync_log_id} to running`);
        return eventData.sync_log_id;
      }

      // Create new sync log for cron trigger
      const { data: newLog, error } = await supabase
        .from('tarana_sync_logs')
        .insert({
          status: 'running',
          trigger_type: triggeredBy,
          triggered_by: adminUserId || null,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error || !newLog) {
        console.error('[TaranaSync] Failed to create sync log:', error);
        throw new Error(`Failed to create sync log: ${error?.message || 'Unknown error'}`);
      }

      console.log(`[TaranaSync] Created sync log ${newLog.id}`);
      return newLog.id;
    });

    // Step 2: Fetch base nodes from Tarana API
    const baseNodes = await step.run('fetch-base-nodes', async () => {
      console.log('[TaranaSync] Fetching base nodes from Tarana API...');

      try {
        const nodes = await getAllBaseNodes();
        console.log(`[TaranaSync] Fetched ${nodes.length} base nodes from API`);
        return nodes;
      } catch (error) {
        console.error('[TaranaSync] Failed to fetch base nodes:', error);
        throw error;
      }
    });

    // Step 3: Handle dry run - complete early if dryRun is true
    if (dryRun) {
      const dryRunResult = await step.run('dry-run-complete', async () => {
        const supabase = await createClient();
        const duration = Date.now() - startTime;

        await supabase
          .from('tarana_sync_logs')
          .update({
            status: 'completed',
            stations_fetched: baseNodes.length,
            inserted: 0,
            updated: 0,
            deleted: 0,
            duration_ms: duration,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);

        console.log(`[TaranaSync] DRY RUN complete: ${baseNodes.length} records would be synced`);

        return {
          success: true,
          dryRun: true,
          syncLogId,
          recordsFetched: baseNodes.length,
          inserted: 0,
          updated: 0,
          deleted: 0,
          duration: duration,
        };
      });

      // Send completion event for dry run
      await step.run('send-dry-run-completion-event', async () => {
        await inngest.send({
          name: 'tarana/sync.completed',
          data: {
            sync_log_id: syncLogId,
            inserted: 0,
            updated: 0,
            deleted: 0,
            duration_ms: dryRunResult.duration,
          },
        });
      });

      return dryRunResult;
    }

    // Step 4: Get existing records from database
    const existingSerials = await step.run('get-existing-records', async () => {
      const supabase = await createClient();

      const { data: existing, error } = await supabase
        .from('tarana_base_stations')
        .select('serial_number');

      if (error) {
        console.error('[TaranaSync] Failed to fetch existing records:', error);
        throw new Error(`Failed to fetch existing records: ${error.message}`);
      }

      const serials = new Set(existing?.map((e) => e.serial_number) || []);
      console.log(`[TaranaSync] Found ${serials.size} existing records in database`);
      return Array.from(serials);
    });

    // Step 5: Fetch RN counts per BN site for active_connections
    const rnCountsBySite = await step.run('fetch-rn-counts', async () => {
      try {
        const { getAllRemoteNodes } = await import('@/lib/tarana/client');
        console.log('[TaranaSync] Fetching remote nodes for active connection counts...');

        const remoteNodes = await getAllRemoteNodes();
        console.log(`[TaranaSync] Fetched ${remoteNodes.length} remote nodes`);

        // Count connected RNs (deviceStatus === 1) per site name
        const counts: Record<string, number> = {};
        for (const rn of remoteNodes) {
          if (rn.deviceStatus === 1 && rn.siteName) {
            counts[rn.siteName] = (counts[rn.siteName] || 0) + 1;
          }
        }

        const sitesWithRNs = Object.keys(counts).length;
        console.log(`[TaranaSync] ${sitesWithRNs} sites have active RN connections`);

        return counts;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[TaranaSync] Failed to fetch RN counts (continuing with zeros):', message);
        return {} as Record<string, number>;
      }
    });

    // Step 6: Upsert records (insert new, update existing)
    const upsertResult = await step.run('upsert-records', async () => {
      const supabase = await createClient();
      const existingSet = new Set(existingSerials);
      const apiSerials = new Set<string>();
      let stepInserted = 0;
      let stepUpdated = 0;
      const stepErrors: string[] = [];

      for (const bn of baseNodes) {
        // Skip records with missing required data
        if (!bn.serialNumber || !bn.latitude || !bn.longitude) {
          stepErrors.push(`Skipping BN with missing data: ${bn.serialNumber || 'unknown'}`);
          continue;
        }

        apiSerials.add(bn.serialNumber);

        const record = {
          serial_number: bn.serialNumber,
          hostname: bn.deviceId || bn.serialNumber,
          site_name: bn.siteName || 'Unknown Site',
          active_connections: rnCountsBySite[bn.siteName ?? ''] ?? 0,
          market: bn.marketName || 'Unknown',
          lat: bn.latitude,
          lng: bn.longitude,
          region: bn.regionName || 'South Africa',
          last_updated: new Date().toISOString(),
        };

        if (existingSet.has(bn.serialNumber)) {
          // Update existing record
          const { error } = await supabase
            .from('tarana_base_stations')
            .update(record)
            .eq('serial_number', bn.serialNumber);

          if (error) {
            stepErrors.push(`Update failed for ${bn.serialNumber}: ${error.message}`);
          } else {
            stepUpdated++;
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from('tarana_base_stations')
            .insert(record);

          if (error) {
            stepErrors.push(`Insert failed for ${bn.serialNumber}: ${error.message}`);
          } else {
            stepInserted++;
          }
        }
      }

      console.log(`[TaranaSync] Upserted: ${stepInserted} inserted, ${stepUpdated} updated, ${stepErrors.length} errors`);

      return {
        inserted: stepInserted,
        updated: stepUpdated,
        errors: stepErrors,
        apiSerials: Array.from(apiSerials),
      };
    });

    inserted = upsertResult.inserted;
    updated = upsertResult.updated;
    errors.push(...upsertResult.errors);

    // Step 7: Delete stale records (if option enabled)
    if (deleteStale) {
      const deleteResult = await step.run('delete-stale-records', async () => {
        const supabase = await createClient();
        const existingSet = new Set(existingSerials);
        const apiSerialsSet = new Set(upsertResult.apiSerials);

        // Find serials in database that are not in API response
        const staleSerials = [...existingSet].filter((s) => !apiSerialsSet.has(s));

        if (staleSerials.length === 0) {
          console.log('[TaranaSync] No stale records to delete');
          return { deleted: 0, errors: [] };
        }

        const { error } = await supabase
          .from('tarana_base_stations')
          .delete()
          .in('serial_number', staleSerials);

        if (error) {
          console.error('[TaranaSync] Failed to delete stale records:', error);
          return { deleted: 0, errors: [`Delete failed: ${error.message}`] };
        }

        console.log(`[TaranaSync] Deleted ${staleSerials.length} stale records`);
        return { deleted: staleSerials.length, errors: [] };
      });

      deleted = deleteResult.deleted;
      errors.push(...deleteResult.errors);
    }

    // Step 8: Update sync log with final results
    const finalResult = await step.run('update-sync-log', async () => {
      const supabase = await createClient();
      const duration = Date.now() - startTime;
      const hasErrors = errors.length > 0;

      const { error } = await supabase
        .from('tarana_sync_logs')
        .update({
          status: hasErrors ? 'completed_with_errors' : 'completed',
          stations_fetched: baseNodes.length,
          inserted,
          updated,
          deleted,
          errors: hasErrors ? errors.slice(0, 10) : [],
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId);

      if (error) {
        console.error('[TaranaSync] Failed to update sync log:', error);
      }

      console.log(
        `[TaranaSync] Complete: ${inserted} inserted, ${updated} updated, ${deleted} deleted ` +
          `(${duration}ms, ${errors.length} errors)`
      );

      return {
        success: !hasErrors,
        syncLogId,
        recordsFetched: baseNodes.length,
        inserted,
        updated,
        deleted,
        errors: errors.length,
        duration,
      };
    });

    // Step 9: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'tarana/sync.completed',
        data: {
          sync_log_id: syncLogId,
          inserted,
          updated,
          deleted,
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
export const taranaSyncCompletedFunction = inngest.createFunction(
  {
    id: 'tarana-sync-completed',
    name: 'Tarana Sync Completed Handler',
  },
  { event: 'tarana/sync.completed' },
  async ({ event, step }) => {
    const { sync_log_id, inserted, updated, deleted, duration_ms } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[TaranaSync] Sync ${sync_log_id} completed: ` +
          `${inserted} inserted, ${updated} updated, ${deleted} deleted (${duration_ms}ms)`
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
export const taranaSyncFailedFunction = inngest.createFunction(
  {
    id: 'tarana-sync-failed',
    name: 'Tarana Sync Failed Handler',
  },
  { event: 'tarana/sync.failed' },
  async ({ event, step }) => {
    const { sync_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(`[TaranaSync] Sync ${sync_log_id} failed (attempt ${attempt}): ${error}`);

      const supabase = await createClient();

      // Update sync log with failure status
      await supabase
        .from('tarana_sync_logs')
        .update({
          status: 'failed',
          errors: [error],
          attempt,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sync_log_id);

      // TODO: PiPaperPlaneRightBold alert notification for sync failures
      // TODO: Log to error tracking service (Sentry, etc.)
    });

    return { handled: true };
  }
);
