/**
 * Ruijie Traffic Rollup
 *
 * After each device sync, fetch hourly flow per group (via a representative
 * device SN — API V2.0.3 §2.6.2) and persist rollups for Health / Analytics.
 *
 * Trigger: ruijie/sync.completed
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { getNetworkTraffic, pickFlowDeviceSn } from '@/lib/ruijie/client';

const HOURS_WINDOW = 24;
const RETENTION_DAYS = 14;
const GROUP_DELAY_MS = 400;

type GroupRow = {
  group_id: string;
  group_name: string | null;
};

export const ruijieTrafficRollupFunction = inngest.createFunction(
  {
    id: 'ruijie-traffic-rollup',
    name: 'Ruijie Traffic Rollup',
    retries: 2,
  },
  { event: 'ruijie/sync.completed' },
  async ({ step }) => {
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
      return { groupsProcessed: 0, rowsInserted: 0 };
    }

    // Bucket to the hour so retries/upserts coalesce within the same window
    const hourBucket = new Date();
    hourBucket.setUTCMinutes(0, 0, 0);
    const capturedAt = hourBucket.toISOString();

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

          const traffic = await getNetworkTraffic({ sn: flowSn, hours: HOURS_WINDOW });
          const hoursSeconds = Math.max(HOURS_WINDOW, 1) * 3600;
          const peakRxBps = (traffic.peakRxBytes * 8) / hoursSeconds;
          const peakTxBps = (traffic.peakTxBytes * 8) / hoursSeconds;

          const { error } = await supabase.from('ruijie_traffic_rollups').upsert(
            {
              group_id: group.group_id,
              group_name: group.group_name,
              captured_at: capturedAt,
              hours_window: HOURS_WINDOW,
              total_rx_bytes: Math.round(traffic.totalRxBytes),
              total_tx_bytes: Math.round(traffic.totalTxBytes),
              avg_rx_bps: traffic.avgRxRate,
              avg_tx_bps: traffic.avgTxRate,
              peak_rx_bps: peakRxBps,
              peak_tx_bps: peakTxBps,
              raw_summary: {
                totalBytes: traffic.totalBytes,
                dataPointCount: traffic.dataPoints.length,
                flowSn,
              },
            },
            { onConflict: 'group_id,captured_at,hours_window' }
          );

          if (error) {
            console.error(`[TrafficRollup] Upsert failed for ${group.group_id}:`, error);
          } else {
            inserted += 1;
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

    return { groupsProcessed: groups.length, rowsInserted };
  }
);
