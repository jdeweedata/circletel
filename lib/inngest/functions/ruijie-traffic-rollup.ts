/**
 * Ruijie Traffic Rollup / Historic Backfill
 *
 * After each device sync (and on explicit backfill events), fetch hourly flow
 * per group via a representative device SN (API V2.0.3 §2.6.2) and upsert
 * hours_window=1 rows so Analytics can display Supabase-cached history.
 *
 * Triggers:
 * - ruijie/sync.completed
 * - ruijie/traffic.backfill.requested  (manual / recovery)
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { getNetworkTraffic, pickFlowDeviceSn } from '@/lib/ruijie/client';
import { buildHourlyRollupUpserts } from '@/lib/network/analytics-aggregates';
import {
  clampTrafficHistoryHours,
  RUIJIE_TRAFFIC_GROUP_DELAY_MS,
  RUIJIE_TRAFFIC_HISTORY_HOURS,
  RUIJIE_TRAFFIC_RETENTION_DAYS,
} from '@/lib/ruijie/traffic-history';

type GroupRow = {
  group_id: string;
  group_name: string | null;
};

type BackfillEventData = {
  hours?: number;
  triggered_by?: string;
  admin_user_id?: string;
};

export const ruijieTrafficRollupFunction = inngest.createFunction(
  {
    id: 'ruijie-traffic-rollup',
    name: 'Ruijie Traffic Rollup',
    retries: 2,
  },
  [
    { event: 'ruijie/sync.completed' },
    { event: 'ruijie/traffic.backfill.requested' },
  ],
  async ({ event, step }) => {
    const eventData = (event?.data || {}) as BackfillEventData;
    const hoursWindow = clampTrafficHistoryHours(
      eventData.hours ?? RUIJIE_TRAFFIC_HISTORY_HOURS
    );

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
      return {
        groupsProcessed: 0,
        rowsInserted: 0,
        hoursWindow,
        note: 'no_groups_in_device_cache',
      };
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

          const traffic = await getNetworkTraffic({ sn: flowSn, hours: hoursWindow });
          const upserts = buildHourlyRollupUpserts({
            groupId: group.group_id,
            groupName: group.group_name,
            flowSn,
            dataPoints: traffic.dataPoints,
          });

          if (upserts.length === 0) {
            // Leave existing historic rows intact when Ruijie returns nothing.
            console.warn(
              `[TrafficRollup] No hourly points for group ${group.group_id} (sn=${flowSn}); keeping existing rollups`
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
          }
        } catch (err) {
          console.error(`[TrafficRollup] Group ${group.group_id} failed:`, err);
        }

        await new Promise((r) => setTimeout(r, RUIJIE_TRAFFIC_GROUP_DELAY_MS));
      }

      return inserted;
    });

    await step.run('prune-old-rollups', async () => {
      const supabase = await createClient();
      const cutoff = new Date(
        Date.now() - RUIJIE_TRAFFIC_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
      const { error } = await supabase
        .from('ruijie_traffic_rollups')
        .delete()
        .lt('captured_at', cutoff);

      if (error) {
        console.error('[TrafficRollup] Prune failed:', error);
      }
    });

    return {
      groupsProcessed: groups.length,
      rowsInserted,
      hoursWindow,
      triggeredBy: eventData.triggered_by || event?.name || 'unknown',
    };
  }
);
