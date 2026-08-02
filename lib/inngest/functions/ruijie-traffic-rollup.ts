/**
 * Ruijie Traffic Rollup
 *
 * After each device sync, fetch hourly flow for EVERY device (API V2.0.3 §2.6.2
 * is per-SN) and persist one hours_window=1 row per device per hour, so a site
 * can be attributed its own AP and a group total is a real sum.
 *
 * Until #702 this polled one representative device per group and stored its
 * flow as the group's — which meant ~10 Unjani clinics shared one arbitrary
 * clinic's traffic. See supabase/migrations/20260802090000_*.
 *
 * Trigger: ruijie/sync.completed
 *
 * Ops notes:
 * - Must be registered with Inngest Cloud after deploys that add/change functions
 *   (Coolify: `curl -X PUT https://www.circletel.co.za/api/inngest`).
 * - Starts with a short delay so Ruijie is not hammered immediately after
 *   enrichDevicesWithLiveMetrics in ruijie-sync.
 */

import { inngest } from '../client';
import { ruijieSyncCompleted } from '../events/ruijie';
import { createClient } from '@/lib/supabase/server';
import { getNetworkTraffic } from '@/lib/ruijie/client';
import { buildHourlyRollupUpserts } from '@/lib/network/analytics-aggregates';

const HOURS_WINDOW = 24;
/**
 * 90 days, matching the longest report period the spec allows (custom ranges are
 * capped at 90 inclusive days).
 *
 * This table is the system of record, not a cache. Ruijie Cloud itself only
 * serves ~3 days of per-device flow — measured 2026-08-02: four APs all cut off
 * at the same instant, and a 90-day request returns a full 12,960-point grid
 * that is 88% zero-padded rather than truncated. So anything pruned here is
 * gone for good; there is nothing upstream to re-fetch it from.
 *
 * Cost is negligible: ~22 devices x 24 hourly rows = ~530 rows/day, so 90 days
 * is roughly 48k rows.
 */
const RETENTION_DAYS = 90;
/** Pace between per-device flow calls — the fleet is ~25 devices per sync. */
const DEVICE_DELAY_MS = 600;
/** Let Ruijie cool down after device metric enrichment on the same event. */
const POST_SYNC_COOLDOWN_MS = 12_000;
const EMPTY_RETRY_DELAY_MS = 5_000;

type GroupRow = {
  group_id: string;
  group_name: string | null;
};

export const ruijieTrafficRollupFunction = inngest.createFunction(
  {

    id: 'ruijie-traffic-rollup',
    name: 'Ruijie Traffic Rollup',
    retries: 2,
    concurrency: {
      // One rollup at a time — avoids Ruijie rate limits when syncs overlap.
      limit: 1,
    },
  triggers: [ruijieSyncCompleted],
}, async ({ event, step }) => {
    const syncLogId = (event.data as { sync_log_id?: string } | undefined)?.sync_log_id;

    await step.sleep('cooldown-after-sync', '12s');

    const groups = await step.run('fetch-groups', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ruijie_device_cache')
        .select('group_id, group_name')
        .not('group_id', 'is', null);

      if (error) {
        console.error('[TrafficRollup] Failed to fetch groups:', error);
        return [] as GroupRow[];
      }

      const map = new Map<string, string | null>();
      for (const row of data || []) {
        if (!row.group_id) continue;
        if (!map.has(row.group_id)) {
          map.set(row.group_id, row.group_name);
        }
      }

      return Array.from(map.entries()).map(([group_id, group_name]) => ({
        group_id,
        group_name,
      }));
    });

    if (groups.length === 0) {
      console.warn('[TrafficRollup] No groups in device cache', { syncLogId });
      return { groupsProcessed: 0, rowsInserted: 0, syncLogId };
    }

    const rowsInserted = await step.run('rollup-groups', async () => {
      const supabase = await createClient();
      let inserted = 0;

      for (const group of groups) {
        const { data: devices } = await supabase
          .from('ruijie_device_cache')
          .select('sn, status, model')
          .eq('group_id', group.group_id);

        const serials = (devices || [])
          .map((device) => device.sn as string | null)
          .filter((sn): sn is string => Boolean(sn));

        if (serials.length === 0) {
          console.warn(`[TrafficRollup] No device SNs for group ${group.group_id}`);
          continue;
        }

        // Every device, not a representative — the whole point of #702.
        for (const sn of serials) {
          try {
            let traffic = await getNetworkTraffic({ sn, hours: HOURS_WINDOW });

            // Ruijie flow can return empty under load right after sync — one retry.
            if (!traffic.dataPoints.length) {
              console.warn(
                `[TrafficRollup] Empty flow for sn=${sn} (group ${group.group_id}); retrying once`
              );
              await new Promise((r) => setTimeout(r, EMPTY_RETRY_DELAY_MS));
              traffic = await getNetworkTraffic({ sn, hours: HOURS_WINDOW });
            }

            const upserts = buildHourlyRollupUpserts({
              groupId: group.group_id,
              groupName: group.group_name,
              flowSn: sn,
              dataPoints: traffic.dataPoints,
            });

            if (upserts.length === 0) {
              console.warn(
                `[TrafficRollup] No hourly points for sn=${sn} (group=${group.group_id}, totalBytes=${traffic.totalBytes}, rawPoints=${traffic.dataPoints.length})`
              );
              continue;
            }

            const { error } = await supabase
              .from('ruijie_traffic_rollups')
              .upsert(upserts, {
                onConflict: 'group_id,device_sn,captured_at,hours_window',
              });

            if (error) {
              console.error(`[TrafficRollup] Upsert failed for sn=${sn}:`, error);
            } else {
              inserted += upserts.length;
              console.log(
                `[TrafficRollup] group=${group.group_id} sn=${sn} upserts=${upserts.length} bytes=${traffic.totalBytes}`
              );
            }
          } catch (err) {
            console.error(`[TrafficRollup] Device ${sn} failed:`, err);
          }

          await new Promise((r) => setTimeout(r, DEVICE_DELAY_MS));
        }
      }

      return inserted;
    });

    await step.run('prune-old-rollups', async () => {
      const supabase = await createClient();
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('ruijie_traffic_rollups')
        .delete()
        .lt('captured_at', cutoff);

      if (error) {
        console.error('[TrafficRollup] Prune failed:', error);
      }
    });

    console.log(
      `[TrafficRollup] done syncLogId=${syncLogId ?? 'n/a'} groups=${groups.length} rowsInserted=${rowsInserted}`
    );

    return { groupsProcessed: groups.length, rowsInserted, syncLogId };
  }
);
