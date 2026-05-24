/**
 * Run Tarana sync locally (mirrors Inngest tarana-sync function steps).
 * Run: set -a && source .env.local && set +a && npx tsx scripts/run-tarana-sync-local.ts
 */
import { createClient } from '@supabase/supabase-js';
import { getAllBaseNodes, getAllRemoteNodes } from '../lib/tarana/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const startTime = Date.now();
  console.log('[TaranaSync-Local] Starting sync...\n');

  // Step 1: Create sync log
  const { data: logEntry, error: logErr } = await supabase
    .from('tarana_sync_logs')
    .insert({
      status: 'running',
      trigger_type: 'manual',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (logErr || !logEntry) {
    console.error('Failed to create sync log:', logErr);
    return;
  }
  const syncLogId = logEntry.id;
  console.log(`[Step 1] Sync log created: ${syncLogId}`);

  try {
    // Step 2: Fetch base nodes
    console.log('[Step 2] Fetching base nodes...');
    const baseNodes = await getAllBaseNodes();
    console.log(`  Fetched ${baseNodes.length} BNs`);

    // Step 3: Get existing records
    console.log('[Step 3] Checking existing records...');
    const { data: existing } = await supabase
      .from('tarana_base_stations')
      .select('serial_number');
    const existingSet = new Set(existing?.map(e => e.serial_number) || []);
    console.log(`  ${existingSet.size} existing records in DB`);

    // Step 4: Fetch RN counts
    console.log('[Step 4] Fetching remote nodes...');
    let rnCountsBySite: Record<string, number> = {};
    try {
      const remoteNodes = await getAllRemoteNodes();
      console.log(`  Fetched ${remoteNodes.length} RNs`);
      for (const rn of remoteNodes) {
        if (rn.deviceStatus === 1 && rn.siteName) {
          rnCountsBySite[rn.siteName] = (rnCountsBySite[rn.siteName] || 0) + 1;
        }
      }
      console.log(`  ${Object.keys(rnCountsBySite).length} sites have active RNs:`, rnCountsBySite);
    } catch (err) {
      console.warn('  RN fetch failed (continuing with zeros):', err);
    }

    // Step 5: Upsert records
    console.log('[Step 5] Upserting records...');
    let inserted = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (const bn of baseNodes) {
      if (!bn.serialNumber || !bn.latitude || !bn.longitude) {
        skipped++;
        continue;
      }

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
        const { error } = await supabase
          .from('tarana_base_stations')
          .update(record)
          .eq('serial_number', bn.serialNumber);
        if (error) errors.push(`Update ${bn.serialNumber}: ${error.message}`);
        else updated++;
      } else {
        const { error } = await supabase
          .from('tarana_base_stations')
          .insert(record);
        if (error) errors.push(`Insert ${bn.serialNumber}: ${error.message}`);
        else inserted++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n[Step 5] Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped (no coords)`);
    if (errors.length > 0) {
      console.log(`  ${errors.length} errors:`);
      for (const e of errors.slice(0, 10)) console.log(`    - ${e}`);
    }

    // Step 6: Update sync log
    const hasErrors = errors.length > 0;
    await supabase
      .from('tarana_sync_logs')
      .update({
        status: hasErrors ? 'completed_with_errors' : 'completed',
        stations_fetched: baseNodes.length,
        inserted,
        updated,
        deleted: 0,
        errors: hasErrors ? errors.slice(0, 10) : [],
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLogId);

    console.log(`\n[TaranaSync-Local] Complete in ${(duration / 1000).toFixed(1)}s`);
    console.log(`  Sync log: ${syncLogId}`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\n[TaranaSync-Local] FAILED:', msg);
    await supabase
      .from('tarana_sync_logs')
      .update({
        status: 'failed',
        errors: [msg],
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      })
      .eq('id', syncLogId);
  }
}

main().catch(console.error);
