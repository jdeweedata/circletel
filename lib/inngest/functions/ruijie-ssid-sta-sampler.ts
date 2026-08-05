/**
 * Ruijie SSID STA Sampler
 *
 * Every 5 minutes: pull `/sta/sta_users` per group, credit allow-listed SSIDs
 * (`Unjani Clinic Staff`, `Unjani Clinic Free WiFi`) session-byte deltas into
 * UTC hour buckets on `ruijie_ssid_traffic_rollups`, maintain
 * `ruijie_ssid_sta_sample_state`.
 *
 * Wayfinder #679 / #672. Retention: 90d rollups, ~36h sample-state.
 *
 * Ops: re-register Inngest after deploy (`PUT /api/inngest`).
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { getGroupStaUsers } from '@/lib/ruijie/client';
import type { StaUserRaw } from '@/lib/ruijie/performance-metrics';
import {
  SSID_GROUP_DELAY_MS,
  SSID_ROLLUP_RETENTION_DAYS,
  SSID_SAMPLE_STATE_RETENTION_HOURS,
  computeSsidHourDeltas,
  sampleStateKey,
  type StaSampleStateSnapshot,
} from '@/lib/ruijie/ssid-sta-rollup';

type GroupRow = { group_id: string };

function toSampleInput(sta: StaUserRaw) {
  return {
    sn: String(sta.sn ?? ''),
    mac: String(sta.mac ?? ''),
    ssid: String(sta.ssid ?? ''),
    wifiUp: Number(sta.wifiUp),
    wifiDown: Number(sta.wifiDown),
  };
}

async function loadSiteIdBySn(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  const { data: devices } = await supabase
    .from('network_devices')
    .select('serial_number, ruijie_device_sn, corporate_site_id')
    .not('corporate_site_id', 'is', null);

  for (const row of devices || []) {
    const siteId = row.corporate_site_id as string | null;
    if (!siteId) continue;
    if (row.serial_number) map.set(String(row.serial_number), siteId);
    if (row.ruijie_device_sn) map.set(String(row.ruijie_device_sn), siteId);
  }

  const { data: cache } = await supabase
    .from('ruijie_device_cache')
    .select('sn, corporate_site_id')
    .not('corporate_site_id', 'is', null);

  for (const row of cache || []) {
    if (!row.sn || !row.corporate_site_id) continue;
    if (!map.has(row.sn)) {
      map.set(row.sn, row.corporate_site_id as string);
    }
  }

  return map;
}

export const ruijieSsidStaSamplerFunction = inngest.createFunction(
  {
    id: 'ruijie-ssid-sta-sampler',
    name: 'Ruijie SSID STA Sampler',
    retries: 2,
    concurrency: {
      // One sampler at a time — share Ruijie rate budget with sync/rollup.
      limit: 1,
    },
    triggers: [
      { cron: '*/5 * * * *' },
      { event: 'ruijie/ssid-sta-sample.requested' },
    ],
  },
  async ({ step }) => {
    const groups = await step.run('fetch-groups', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ruijie_device_cache')
        .select('group_id')
        .not('group_id', 'is', null);

      if (error) {
        console.error('[SsidStaSampler] Failed to fetch groups:', error);
        return [] as GroupRow[];
      }

      const ids = new Set<string>();
      for (const row of data || []) {
        if (row.group_id) ids.add(String(row.group_id));
      }
      return Array.from(ids).map((group_id) => ({ group_id }));
    });

    if (groups.length === 0) {
      console.warn('[SsidStaSampler] No groups in device cache');
      return { groupsProcessed: 0, hourRowsTouched: 0, stasSeen: 0 };
    }

    const previous = await step.run('load-sample-state', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ruijie_ssid_sta_sample_state')
        .select('device_sn, mac, ssid, last_wifi_up, last_wifi_down');

      if (error) {
        console.error('[SsidStaSampler] Failed to load sample state:', error);
        return [] as StaSampleStateSnapshot[];
      }

      return (data || []) as StaSampleStateSnapshot[];
    });

    const previousMap = new Map(
      previous.map((row) => [sampleStateKey(row.device_sn, row.mac, row.ssid), row] as const)
    );

    const sampleResult = await step.run('sample-groups-and-delta', async () => {
      const sampledAtMs = Date.now();
      const sampledAtIso = new Date(sampledAtMs).toISOString();
      const allStas: ReturnType<typeof toSampleInput>[] = [];

      for (let i = 0; i < groups.length; i += 1) {
        const group = groups[i];
        try {
          const stas = await getGroupStaUsers(group.group_id);
          for (const sta of stas) {
            allStas.push(toSampleInput(sta));
          }
        } catch (err) {
          console.error(`[SsidStaSampler] STA fetch failed group=${group.group_id}:`, err);
        }
        if (i < groups.length - 1) {
          await new Promise((r) => setTimeout(r, SSID_GROUP_DELAY_MS));
        }
      }

      const deltas = computeSsidHourDeltas({
        samples: allStas,
        previous: previousMap,
        sampledAtMs,
      });

      return {
        stasSeen: allStas.length,
        sampledAtIso,
        ...deltas,
      };
    });

    const hourRowsTouched = await step.run('upsert-hour-rollups', async () => {
      if (sampleResult.hourDeltas.length === 0) return 0;

      const supabase = await createClient();
      const siteBySn = await loadSiteIdBySn(supabase);
      const nowIso = new Date().toISOString();
      let touched = 0;

      for (const delta of sampleResult.hourDeltas) {
        const { data: existing, error: readError } = await supabase
          .from('ruijie_ssid_traffic_rollups')
          .select('rx_bytes, tx_bytes, corporate_site_id')
          .eq('device_sn', delta.device_sn)
          .eq('ssid', delta.ssid)
          .eq('hour_bucket', delta.hour_bucket)
          .maybeSingle();

        if (readError) {
          console.error('[SsidStaSampler] Read hour row failed:', readError);
          continue;
        }

        const siteId =
          siteBySn.get(delta.device_sn) ??
          (existing?.corporate_site_id as string | null) ??
          null;

        const row = {
          device_sn: delta.device_sn,
          ssid: delta.ssid,
          hour_bucket: delta.hour_bucket,
          hours_window: 1,
          corporate_site_id: siteId,
          rx_bytes: Number(existing?.rx_bytes ?? 0) + delta.rx_bytes,
          tx_bytes: Number(existing?.tx_bytes ?? 0) + delta.tx_bytes,
          updated_at: nowIso,
        };

        const { error } = await supabase.from('ruijie_ssid_traffic_rollups').upsert(row, {
          onConflict: 'device_sn,ssid,hour_bucket',
        });

        if (error) {
          console.error('[SsidStaSampler] Hour upsert failed:', error, row);
        } else {
          touched += 1;
        }
      }

      return touched;
    });

    await step.run('upsert-sample-state', async () => {
      if (sampleResult.nextState.length === 0) return;

      const supabase = await createClient();
      const nowIso = new Date().toISOString();
      const upserts = sampleResult.nextState.map((s) => ({
        device_sn: s.device_sn,
        mac: s.mac,
        ssid: s.ssid,
        last_wifi_up: s.last_wifi_up,
        last_wifi_down: s.last_wifi_down,
        sampled_at: sampleResult.sampledAtIso,
        updated_at: nowIso,
      }));

      // Chunk to keep payloads modest
      const chunkSize = 200;
      for (let i = 0; i < upserts.length; i += chunkSize) {
        const chunk = upserts.slice(i, i + chunkSize);
        const { error } = await supabase.from('ruijie_ssid_sta_sample_state').upsert(chunk, {
          onConflict: 'device_sn,mac,ssid',
        });
        if (error) {
          console.error('[SsidStaSampler] Sample-state upsert failed:', error);
        }
      }
    });

    await step.run('prune-old-rows', async () => {
      const supabase = await createClient();
      const rollupCutoff = new Date(
        Date.now() - SSID_ROLLUP_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
      const stateCutoff = new Date(
        Date.now() - SSID_SAMPLE_STATE_RETENTION_HOURS * 60 * 60 * 1000
      ).toISOString();

      const { error: rollupErr } = await supabase
        .from('ruijie_ssid_traffic_rollups')
        .delete()
        .lt('hour_bucket', rollupCutoff);
      if (rollupErr) {
        console.error('[SsidStaSampler] Rollup prune failed:', rollupErr);
      }

      const { error: stateErr } = await supabase
        .from('ruijie_ssid_sta_sample_state')
        .delete()
        .lt('sampled_at', stateCutoff);
      if (stateErr) {
        console.error('[SsidStaSampler] Sample-state prune failed:', stateErr);
      }
    });

    console.log(
      `[SsidStaSampler] done groups=${groups.length} stas=${sampleResult.stasSeen} hourRows=${hourRowsTouched} skippedFree=${sampleResult.skippedNonAllowlisted}`
    );

    return {
      groupsProcessed: groups.length,
      stasSeen: sampleResult.stasSeen,
      hourRowsTouched,
      skippedNonAllowlisted: sampleResult.skippedNonAllowlisted,
      skippedIncomplete: sampleResult.skippedIncomplete,
    };
  }
);
