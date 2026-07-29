/**
 * One-shot Ruijie sync: devices + live metrics + traffic rollups.
 * Usage: npx tsx scripts/ruijie-sync-now.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

async function main() {
  loadEnvLocal();
  process.env.RUIJIE_MOCK_MODE = 'false';

  const {
    getAllDevices,
    enrichDevicesWithLiveMetrics,
    getNetworkTraffic,
    pickFlowDeviceSn,
  } = await import('../lib/ruijie/client');
  const { upsertDevices, createSyncLog, logSyncRun } = await import(
    '../lib/ruijie/sync-service'
  );
  const { createClient } = await import('../lib/supabase/server');

  const started = Date.now();
  const syncLogId = await createSyncLog('manual');
  console.log(`[sync-now] log=${syncLogId}`);

  console.log('[sync-now] fetching devices…');
  const devices = await getAllDevices();
  console.log(`[sync-now] fetched ${devices.length}`);

  console.log('[sync-now] enriching CPU/mem + STA…');
  const enriched = await enrichDevicesWithLiveMetrics(devices);
  const withCpu = enriched.filter((d) => d.cpu_usage != null).length;
  const clients = enriched.reduce((s, d) => s + (d.online_clients || 0), 0);
  const withRadio = enriched.filter(
    (d) => d.radio_2g_utilization != null || d.radio_5g_utilization != null
  ).length;
  console.log(
    `[sync-now] metrics: cpu=${withCpu} clients=${clients} radioUtil=${withRadio}`
  );

  const result = await upsertDevices(enriched, false);
  console.log(
    `[sync-now] upsert added=${result.added} updated=${result.updated} errors=${result.errors.length}`
  );

  // Traffic rollups (same as Inngest function)
  const supabase = await createClient();
  const { data: groupRows } = await supabase
    .from('ruijie_device_cache')
    .select('group_id, group_name, sn, status, model')
    .not('group_id', 'is', null);

  const byGroup = new Map<
    string,
    { group_name: string | null; devices: Array<{ sn: string; status?: string; model?: string | null }> }
  >();
  for (const row of groupRows || []) {
    if (!row.group_id) continue;
    if (!byGroup.has(row.group_id)) {
      byGroup.set(row.group_id, { group_name: row.group_name, devices: [] });
    }
    byGroup.get(row.group_id)!.devices.push({
      sn: row.sn,
      status: row.status,
      model: row.model,
    });
  }

  // Traffic rollups — hours_window=1 series (required by /admin/network/analytics)
  const { buildHourlyRollupUpserts } = await import(
    '../lib/network/analytics-aggregates'
  );
  let rollups = 0;

  for (const [groupId, info] of byGroup) {
    const flowSn = pickFlowDeviceSn(info.devices);
    if (!flowSn) {
      console.log([sync-now] skip traffic group= (no sn));
      continue;
    }
    try {
      const traffic = await getNetworkTraffic({ sn: flowSn, hours: 24 });
      const upserts = buildHourlyRollupUpserts({
        groupId,
        groupName: info.group_name,
        flowSn,
        dataPoints: traffic.dataPoints,
      });
      if (upserts.length === 0) {
        console.log([sync-now] no hourly points group= sn=);
        continue;
      }
      const { error } = await supabase
        .from('ruijie_traffic_rollups')
        .upsert(upserts, { onConflict: 'group_id,captured_at,hours_window' });
      if (error) {
        console.log([sync-now] traffic upsert fail group=: );
      } else {
        rollups += upserts.length;
        console.log(
          [sync-now] traffic group= sn= points= upserts= bytes=
        );
      }
    } catch (e) {
      console.log(
        [sync-now] traffic error group=: 
      );
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const durationMs = Date.now() - started;
  await logSyncRun(
    {
      ...result,
      devicesFetched: devices.length,
      durationMs,
    },
    'manual',
    undefined,
    syncLogId
  );

  console.log(
    JSON.stringify({
      ok: result.errors.length === 0,
      devices: devices.length,
      withCpu,
      clients,
      withRadio,
      rollups,
      durationMs,
      sample: enriched
        .filter((d) => d.status === 'online')
        .slice(0, 5)
        .map((d) => ({
          sn: d.sn,
          name: d.device_name,
          cpu: d.cpu_usage,
          mem: d.memory_usage,
          clients: d.online_clients,
          r2: d.radio_2g_utilization,
          r5: d.radio_5g_utilization,
        })),
    })
  );
}

main().catch((e) => {
  console.error('[sync-now] FATAL', e);
  process.exit(1);
});
