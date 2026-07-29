/**
 * Ruijie Traffic Rollup
 *
 * After each device sync, fetch hourly flow per group (via a representative
 * device SN — API V2.0.3 §2.6.2) and persist one hours_window=1 row per hour
 * so Analytics charts have a usable series (not a single 24h window blob).
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
import { getNetworkTraffic, pickFlowDeviceSn } from '@/lib/ruijie/client';
import { buildHourlyRollupUpserts } from '@/lib/network/analytics-aggregates';

const HOURS_WINDOW = 24;
const RETENTION_DAYS = 14;
const GROUP_DELAY_MS = 600;
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
        try {
          const { data: devices } = await supabase
            .from('ruijie_device_cache')
            .select('sn, status, model')
            .eq('group_id', group.group_id);

          const flowSn = pickFlowDeviceSn(devices || []);
          if (!flowSn) {
            console.warn(`[TrafficRollup] No device SN for group ${group.group_id}`);
            continue;
          }

          let traffic = await getNetworkTraffic({ sn: flowSn, hours: HOURS_WINDOW });

          // Ruijie flow can return empty under load right after sync — one retry.
          if (!traffic.dataPoints.length) {
            console.warn(
              `[TrafficRollup] Empty flow for group ${group.group_id} sn=${flowSn}; retrying once`
            );
            await new Promise((r) => setTimeout(r, EMPTY_RETRY_DELAY_MS));
            traffic = await getNetworkTraffic({ sn: flowSn, hours: HOURS_WINDOW });
          }

          const upserts = buildHourlyRollupUpserts({
            groupId: group.group_id,
            groupName: group.group_name,
            flowSn,
            dataPoints: traffic.dataPoints,
          });

          if (upserts.length === 0) {
            console.warn(
              `[TrafficRollup] No hourly points for group ${group.group_id} (sn=${flowSn}, totalBytes=${traffic.totalBytes}, rawPoints=${traffic.dataPoints.length})`
            );
            continue;
          }

          const { error } = await supabase.from('ruijie_traffic_rollups').upsert(upserts, {
            onConflict: 'group_id,captured_at,hours_window',
          });

          if (error) {
            console.error(`[TrafficRollup] Upsert failed for ${group.group_id}:`, error);
          } else {
            inserted += upserts.length;
            console.log(
              `[TrafficRollup] group=${group.group_id} name=${group.group_name} sn=${flowSn} upserts=${upserts.length} bytes=${traffic.totalBytes}`
            );
          }
        } catch (err) {
          console.error(`[TrafficRollup] Group ${group.group_id} failed:`, err);
        }

        await new Promise((r) => setTimeout(r, GROUP_DELAY_MS));
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
