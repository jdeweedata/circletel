/**
 * Tarana Link Metrics Service
 *
 * Collects signal and link data from active Tarana RNs via the TCS Portal API
 * and stores snapshots in the tarana_link_metrics table.
 */

import { getDeviceBySerial, getBnDevicesForSector } from './client';
import { createClient } from '@/lib/supabase/server';
import type { TaranaDeviceState } from './types';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Haversine distance between two lat/lng points, in metres.
 */
function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in metres
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// =============================================================================
// COLLECTION
// =============================================================================

export interface CollectLinkMetricsResult {
  collected: number;
  skipped: number;
  errors: string[];
}

/**
 * Collect a snapshot of link metrics for all active Tarana RNs.
 *
 * Procedure:
 * 1. Load active tarana_router serial numbers from network_devices
 * 2. For each RN: call GET /api/nqs/v1/devices/{sn} to get losRange, txPower, linkState, coords
 * 3. Resolve parent BN: check tarana_base_stations by sectorId (or siteName fallback)
 *    If BN not in DB, call GET /api/tni/v2/sectors/{sectorId}/devices?type=BN
 * 4. Build snapshot and bulk-insert into tarana_link_metrics
 */
export async function collectLinkMetrics(): Promise<CollectLinkMetricsResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  let collected = 0;
  let skipped = 0;

  // Step 1 — load active devices
  const { data: devices, error: devicesError } = await supabase
    .from('network_devices')
    .select('serial_number, site_name')
    .eq('device_type', 'tarana_router')
    .neq('status', 'decommissioned');

  if (devicesError) {
    throw new Error(`Failed to load network_devices: ${devicesError.message}`);
  }

  if (!devices || devices.length === 0) {
    console.log('[MetricsService] No active Tarana RN devices found — skipping collection');
    return { collected: 0, skipped: 0, errors: [] };
  }

  console.log(`[MetricsService] Collecting metrics for ${devices.length} devices`);

  // Cache BN data per sectorId to avoid repeated API calls
  const bnCache = new Map<number, TaranaDeviceState | null>();

  const snapshots: Record<string, unknown>[] = [];
  const capturedAt = new Date().toISOString();

  // Step 2 — per-device NQS query
  for (const device of devices) {
    let rn: TaranaDeviceState;

    try {
      rn = await getDeviceBySerial(device.serial_number);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`NQS fetch failed for ${device.serial_number}: ${msg}`);
      skipped++;
      continue;
    }

    const rnLat = rn.installParams?.latitude;
    const rnLng = rn.installParams?.longitude;

    // Step 3 — resolve BN
    let bnSerial: string | null = null;
    let bnLat: number | null = null;
    let bnLng: number | null = null;
    let bnHeightM: number | null = null;

    // First try tarana_base_stations using sectorId
    if (rn.sectorId) {
      const { data: bnRow } = await supabase
        .from('tarana_base_stations')
        .select('serial_number, lat, lng, height_m')
        .eq('sector_id', rn.sectorId)
        .limit(1)
        .maybeSingle();

      if (bnRow) {
        bnSerial = bnRow.serial_number;
        bnLat = bnRow.lat;
        bnLng = bnRow.lng;
        bnHeightM = bnRow.height_m ?? null;
      } else {
        // Not in DB yet — fetch from TCS Portal and cache
        if (!bnCache.has(rn.sectorId)) {
          try {
            const bns = await getBnDevicesForSector(rn.sectorId);
            bnCache.set(rn.sectorId, bns.length > 0 ? bns[0] : null);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`BN fetch failed for sector ${rn.sectorId}: ${msg}`);
            bnCache.set(rn.sectorId, null);
          }
        }

        const bn = bnCache.get(rn.sectorId) ?? null;
        if (bn) {
          bnSerial = bn.serialNumber || null;
          bnLat = bn.installParams?.latitude ?? null;
          bnLng = bn.installParams?.longitude ?? null;
          bnHeightM = bn.installParams?.height ?? null;
        }
      }
    }

    // Prefer radio-measured losRange; fall back to haversine if coords available
    let distanceM: number | null = null;
    if (typeof rn.losRange === 'number' && rn.losRange > 0) {
      distanceM = Math.round(rn.losRange);
    } else if (rnLat != null && rnLng != null && bnLat != null && bnLng != null) {
      distanceM = Math.round(haversineDistanceM(rnLat, rnLng, bnLat, bnLng));
    }

    const carrier0 = rn.carriers?.[0] ?? null;
    const txPower = carrier0?.txPower ?? null;
    // rxPower from carriers[0] IS the per-RN received signal strength (RSSI equivalent).
    // Confirmed available in NQS v1 device state — see tarana-tcs-api-correction learnings.
    const rxPower = carrier0?.rxPower ?? null;
    // losRange = radio-measured LOS distance in metres (more accurate than haversine).
    const rfDistanceM = typeof rn.losRange === 'number' && rn.losRange > 0
      ? rn.losRange
      : null;

    const snapshot: Record<string, unknown> = {
      rn_serial_number: rn.serialNumber,
      bn_serial_number: bnSerial,
      captured_at: capturedAt,
      rssi_dbm: typeof rxPower === 'number' ? rxPower : null,
      sinr_db: null,             // Not exposed by NQS v1
      noise_floor_dbm: null,     // Not exposed by NQS v1
      tx_power_dbm: typeof txPower === 'number' ? txPower : null,
      rx_power_dbm: typeof rxPower === 'number' ? rxPower : null,
      mcs_dl: null,              // Not a TCS KPI field — derived from path loss + SINR
      mcs_ul: null,
      throughput_dl_mbps: null,  // TMQ v5 dl-subscriber-rate returns 0 data points
      throughput_ul_mbps: null,
      distance_m: distanceM,
      rf_distance_m: rfDistanceM,
      rn_lat: rnLat ?? null,
      rn_lng: rnLng ?? null,
      rn_height_m: rn.installParams?.height ?? null,
      bn_lat: bnLat,
      bn_lng: bnLng,
      bn_height_m: bnHeightM,
      link_status: rn.linkState ?? null,
      raw_fields: {
        losRange: rn.losRange,
        linkState: rn.linkState,
        sectorId: rn.sectorId,
        band: rn.band,
        carriers: rn.carriers,
        ancestry: rn.ancestry,
      },
    };

    snapshots.push(snapshot);
  }

  // Step 4 — bulk insert (ignore duplicates on unique constraint)
  if (snapshots.length > 0) {
    const { error: insertError } = await supabase
      .from('tarana_link_metrics')
      .insert(snapshots);

    if (insertError) {
      const isDuplicate =
        insertError.code === '23505' ||
        insertError.message.includes('duplicate') ||
        insertError.message.includes('unique');

      if (!isDuplicate) {
        throw new Error(`Failed to insert metrics: ${insertError.message}`);
      }
      console.warn(`[MetricsService] Some rows were duplicates and skipped`);
    }

    collected = snapshots.length;
  }

  console.log(`[MetricsService] Collection complete: ${collected} collected, ${skipped} skipped, ${errors.length} errors`);

  return { collected, skipped, errors };
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get the most recent metrics snapshot for a specific RN serial number.
 */
export async function getLatestMetrics(rnSerial: string): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tarana_link_metrics')
    .select('*')
    .eq('rn_serial_number', rnSerial)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get latest metrics for ${rnSerial}: ${error.message}`);
  }

  return data ?? null;
}

/**
 * Get metrics history for a specific RN within a time window.
 */
export async function getMetricsHistory(
  rnSerial: string,
  from: Date,
  to: Date
): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tarana_link_metrics')
    .select('*')
    .eq('rn_serial_number', rnSerial)
    .gte('captured_at', from.toISOString())
    .lte('captured_at', to.toISOString())
    .order('captured_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Failed to get metrics history for ${rnSerial}: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Aggregate metrics for all RNs on a given BN over the last 7 days.
 */
export async function getAggregateByBn(bnSerial: string): Promise<{
  avgRssiDbm: number | null;
  avgSinrDb: number | null;
  avgThroughputDlMbps: number | null;
  avgDistanceM: number | null;
  sampleCount: number;
  rnCount: number;
}> {
  const supabase = await createClient();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('tarana_link_metrics')
    .select('rssi_dbm, sinr_db, throughput_dl_mbps, distance_m, rn_serial_number')
    .eq('bn_serial_number', bnSerial)
    .gte('captured_at', since);

  if (error) {
    throw new Error(`Failed to get aggregate metrics for BN ${bnSerial}: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      avgRssiDbm: null,
      avgSinrDb: null,
      avgThroughputDlMbps: null,
      avgDistanceM: null,
      sampleCount: 0,
      rnCount: 0,
    };
  }

  const avg = (values: (number | null)[]): number | null => {
    const nums = values.filter((v): v is number => v !== null);
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  const uniqueRns = new Set(data.map((r) => r.rn_serial_number));

  return {
    avgRssiDbm: avg(data.map((r) => r.rssi_dbm as number | null)),
    avgSinrDb: avg(data.map((r) => r.sinr_db as number | null)),
    avgThroughputDlMbps: avg(data.map((r) => r.throughput_dl_mbps as number | null)),
    avgDistanceM: avg(data.map((r) => r.distance_m as number | null)),
    sampleCount: data.length,
    rnCount: uniqueRns.size,
  };
}
