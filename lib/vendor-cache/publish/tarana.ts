/**
 * Publish staged Tarana BNs to Supabase (NQS path)
 */

import type Database from 'better-sqlite3';
import { createClient } from '@/lib/supabase/server';
import type { TaranaRadio } from '@/lib/tarana/types';
import type { NqsDeviceData } from '@/lib/tarana/client';

export interface TaranaPublishResult {
  published: number;
  inserted: number;
  updated: number;
  deleted: number;
  syncLogId: string;
  errors: string[];
}

function readMeta<T>(db: Database.Database, key: string, fallback: T): T {
  const row = db
    .prepare(`SELECT value_json FROM stage_tarana_meta WHERE key = ?`)
    .get(key) as { value_json: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value_json) as T;
  } catch {
    return fallback;
  }
}

export async function publishTaranaFromStage(
  db: Database.Database,
  options: { deleteStale?: boolean; durationMs?: number } = {}
): Promise<TaranaPublishResult> {
  const { deleteStale = false, durationMs = 0 } = options;
  const errors: string[] = [];
  const supabase = await createClient();

  const { data: newLog, error: logError } = await supabase
    .from('tarana_sync_logs')
    .insert({
      status: 'running',
      trigger_type: 'manual',
      triggered_by: null,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (logError || !newLog) {
    throw new Error(
      `Failed to create tarana_sync_logs: ${logError?.message || 'unknown'}`
    );
  }
  const syncLogId = newLog.id as string;

  const rows = db
    .prepare(
      `SELECT serial_number, payload_json FROM stage_tarana_devices
       WHERE device_type = 'BN' ORDER BY serial_number`
    )
    .all() as Array<{ serial_number: string; payload_json: string }>;

  const baseNodes: TaranaRadio[] = [];
  for (const row of rows) {
    try {
      baseNodes.push(JSON.parse(row.payload_json) as TaranaRadio);
    } catch (err) {
      errors.push(
        `Invalid JSON for ${row.serial_number}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const rnCountsBySite = readMeta<Record<string, number>>(
    db,
    'rnCountsBySite',
    {}
  );
  const deviceCounts = readMeta<NqsDeviceData['deviceCounts']>(db, 'deviceCounts', {
    bn: { connected: 0, disconnected: 0, total: 0 },
    rn: { connected: 0, disconnected: 0, total: 0 },
  });

  const { data: existing, error: existingError } = await supabase
    .from('tarana_base_stations')
    .select('serial_number');

  if (existingError) {
    throw new Error(`Failed to fetch existing BNs: ${existingError.message}`);
  }

  const existingSet = new Set(existing?.map((e) => e.serial_number) || []);
  const apiSerials = new Set<string>();
  let inserted = 0;
  let updated = 0;
  let deleted = 0;

  for (const bn of baseNodes) {
    if (!bn.serialNumber || !bn.latitude || !bn.longitude) {
      errors.push(`Skipping BN with missing data: ${bn.serialNumber || 'unknown'}`);
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
      device_status: bn.deviceStatus ?? 0,
      height_m: bn.height ?? null,
      azimuth_deg: bn.azimuth ?? null,
      band: bn.band ?? null,
      region_id: bn.regionId ?? null,
      market_id: bn.marketId ?? null,
      site_id: bn.siteId ?? null,
      cell_id: bn.cellId ?? null,
      cell_name: bn.cellName ?? null,
      sector_id: bn.sectorId ?? null,
      sector_name: bn.sectorName ?? null,
      last_updated: new Date().toISOString(),
    };

    if (existingSet.has(bn.serialNumber)) {
      const { error } = await supabase
        .from('tarana_base_stations')
        .update(record)
        .eq('serial_number', bn.serialNumber);
      if (error) {
        errors.push(`Update failed for ${bn.serialNumber}: ${error.message}`);
      } else {
        updated++;
      }
    } else {
      const { error } = await supabase.from('tarana_base_stations').insert(record);
      if (error) {
        errors.push(`Insert failed for ${bn.serialNumber}: ${error.message}`);
      } else {
        inserted++;
      }
    }
  }

  const { error: dcError } = await supabase.from('tarana_device_counts').insert({
    sync_log_id: syncLogId,
    bn_connected: deviceCounts.bn.connected,
    bn_disconnected: deviceCounts.bn.disconnected,
    bn_spectrum_unassigned: 0,
    bn_new_installs_30d: 0,
    bn_total: deviceCounts.bn.total,
    rn_connected: deviceCounts.rn.connected,
    rn_disconnected: deviceCounts.rn.disconnected,
    rn_spectrum_unassigned: 0,
    rn_new_installs_30d: 0,
    rn_total: deviceCounts.rn.total,
  });
  if (dcError) {
    errors.push(`Device counts insert failed: ${dcError.message}`);
  }

  if (deleteStale) {
    const staleSerials = [...existingSet].filter((s) => !apiSerials.has(s));
    if (staleSerials.length > 0) {
      const { error } = await supabase
        .from('tarana_base_stations')
        .delete()
        .in('serial_number', staleSerials);
      if (error) {
        errors.push(`Delete stale failed: ${error.message}`);
      } else {
        deleted = staleSerials.length;
      }
    }
  }

  await supabase
    .from('tarana_sync_logs')
    .update({
      status: 'completed',
      stations_fetched: baseNodes.length,
      inserted,
      updated,
      deleted,
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    })
    .eq('id', syncLogId);

  const publishedAt = new Date().toISOString();
  db.prepare(
    `UPDATE stage_tarana_devices SET published_at = ? WHERE published_at IS NULL`
  ).run(publishedAt);

  console.log(
    `[VendorCache:Tarana] Published: +${inserted} ~${updated} -${deleted} (log=${syncLogId})`
  );

  return {
    published: inserted + updated,
    inserted,
    updated,
    deleted,
    syncLogId,
    errors,
  };
}
