/**
 * Fetch Ruijie Cloud devices, keep only those active in the last 14 days
 * (online now, or lastOnline within window), upsert keepers, delete the rest.
 *
 * Usage: npx tsx scripts/ruijie-prune-stale-devices.ts
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

function daysAgo(iso: string | null | undefined, nowMs: number): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (nowMs - t) / (24 * 60 * 60 * 1000);
}

async function main() {
  loadEnvLocal();
  process.env.RUIJIE_MOCK_MODE = 'false';

  const {
    getAllDevices,
    enrichDevicesWithLiveMetrics,
    upsertDevices,
    pruneDevicesNotInSet,
    filterActiveDevices,
    RUIJIE_ACTIVE_WINDOW_DAYS,
  } = await import('../lib/ruijie');

  const nowMs = Date.now();
  console.log(
    `[prune] Fetching Ruijie devices (retain active ≤ ${RUIJIE_ACTIVE_WINDOW_DAYS}d)…`
  );

  const all = await getAllDevices();
  console.log(`[prune] API returned ${all.length} devices`);

  const inactive = all.filter(
    (d) => !filterActiveDevices([d], nowMs, RUIJIE_ACTIVE_WINDOW_DAYS).length
  );
  const active = filterActiveDevices(all, nowMs, RUIJIE_ACTIVE_WINDOW_DAYS);

  console.log(`[prune] Active (keep): ${active.length}`);
  for (const d of active) {
    const age = daysAgo(d.last_seen_at, nowMs);
    console.log(
      `  KEEP  ${d.sn}  ${d.device_name}  status=${d.status}  last_seen=${d.last_seen_at || '—'}  ageDays=${age == null ? '—' : age.toFixed(1)}`
    );
  }

  console.log(`[prune] Inactive (drop): ${inactive.length}`);
  for (const d of inactive) {
    const age = daysAgo(d.last_seen_at, nowMs);
    console.log(
      `  DROP  ${d.sn}  ${d.device_name}  status=${d.status}  last_seen=${d.last_seen_at || '—'}  ageDays=${age == null ? '—' : age.toFixed(1)}`
    );
  }

  console.log('[prune] Enriching active devices…');
  const enriched = await enrichDevicesWithLiveMetrics(active);
  const upsert = await upsertDevices(enriched, false);
  console.log(
    `[prune] Upsert added=${upsert.added} updated=${upsert.updated} errors=${upsert.errors.length}`
  );

  const keepSns = enriched.map((d) => d.sn);
  const pruned = await pruneDevicesNotInSet(keepSns);
  console.log(
    `[prune] Deleted from cache: ${pruned.deleted}` +
      (pruned.deletedSns.length
        ? ` (${pruned.deletedSns.join(', ')})`
        : '')
  );

  console.log(
    JSON.stringify({
      ok: upsert.errors.length === 0,
      apiTotal: all.length,
      kept: active.length,
      droppedFromApi: inactive.length,
      deletedFromDb: pruned.deleted,
      deletedSns: pruned.deletedSns,
      windowDays: RUIJIE_ACTIVE_WINDOW_DAYS,
    })
  );
}

main().catch((e) => {
  console.error('[prune] FATAL', e);
  process.exit(1);
});
