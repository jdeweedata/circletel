/**
 * Query helpers for per-client Ruijie STA hour rollups
 * (`ruijie_ssid_sta_traffic_rollups`). Collection is forward-only from sampler
 * go-live; admin-only RLS. Not accounting-grade.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ClientHourRow = {
  device_sn: string;
  mac: string;
  ssid: string;
  hour_bucket: string;
  rx_bytes: number;
  tx_bytes: number;
  hostname: string | null;
  manufacture: string | null;
  band: string | null;
};

export type ClientTrafficSummary = {
  mac: string;
  ssid: string;
  device_sn: string;
  rx_bytes: number;
  tx_bytes: number;
  total_bytes: number;
  hostname: string | null;
  manufacture: string | null;
  band: string | null;
};

export async function loadClientHourRows(
  supabase: SupabaseClient,
  siteId: string,
  startUtc: Date,
  endUtc: Date,
  ssid?: string
): Promise<ClientHourRow[]> {
  let query = supabase
    .from('ruijie_ssid_sta_traffic_rollups')
    .select(
      'device_sn, mac, ssid, hour_bucket, rx_bytes, tx_bytes, hostname, manufacture, band'
    )
    .eq('corporate_site_id', siteId)
    .gte('hour_bucket', startUtc.toISOString())
    .lte('hour_bucket', endUtc.toISOString())
    .order('hour_bucket', { ascending: true });

  if (ssid) {
    query = query.eq('ssid', ssid);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    device_sn: String(row.device_sn),
    mac: String(row.mac),
    ssid: String(row.ssid),
    hour_bucket: String(row.hour_bucket),
    rx_bytes: Number(row.rx_bytes || 0),
    tx_bytes: Number(row.tx_bytes || 0),
    hostname: (row.hostname as string | null) ?? null,
    manufacture: (row.manufacture as string | null) ?? null,
    band: (row.band as string | null) ?? null,
  }));
}

/**
 * Aggregate hour rows into per-client totals, ranked by total bytes descending.
 * Last non-null hostname / manufacture / band wins for display.
 */
export function summarizeTopClients(
  rows: ClientHourRow[],
  limit = 20
): ClientTrafficSummary[] {
  const byKey = new Map<string, ClientTrafficSummary>();

  for (const row of rows) {
    const key = `${row.device_sn}\0${row.mac}\0${row.ssid}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        mac: row.mac,
        ssid: row.ssid,
        device_sn: row.device_sn,
        rx_bytes: row.rx_bytes,
        tx_bytes: row.tx_bytes,
        total_bytes: row.rx_bytes + row.tx_bytes,
        hostname: row.hostname,
        manufacture: row.manufacture,
        band: row.band,
      });
      continue;
    }

    existing.rx_bytes += row.rx_bytes;
    existing.tx_bytes += row.tx_bytes;
    existing.total_bytes = existing.rx_bytes + existing.tx_bytes;
    if (row.hostname) existing.hostname = row.hostname;
    if (row.manufacture) existing.manufacture = row.manufacture;
    if (row.band) existing.band = row.band;
  }

  return Array.from(byKey.values())
    .sort((a, b) => b.total_bytes - a.total_bytes)
    .slice(0, Math.max(0, limit));
}
