import type { SupabaseClient } from '@supabase/supabase-js';
import { RUIJIE_SSID_ROLLUP_ALLOWLIST } from '@/lib/ruijie/types';
import type { StaffWifiState } from './types';

export const STAFF_SSID = 'Unjani Clinic Staff'; // must stay in allowlist

export interface StaffUsageRow {
  corporate_site_id: string | null;
  rx_bytes: number;
  tx_bytes: number;
}

export interface StaffUsageBySite {
  rxBytes: number;
  txBytes: number;
  totalBytes: number;
}

/** Sum Staff SSID hour rows per clinic. Sites with no rows are omitted (caller fills 0). */
export function aggregateStaffUsageBySite(
  rows: StaffUsageRow[]
): Record<string, StaffUsageBySite> {
  const bySite: Record<string, StaffUsageBySite> = {};
  for (const row of rows) {
    const siteId = row.corporate_site_id;
    if (!siteId) continue;
    const current = bySite[siteId] ?? { rxBytes: 0, txBytes: 0, totalBytes: 0 };
    const rxBytes = Number(row.rx_bytes || 0);
    const txBytes = Number(row.tx_bytes || 0);
    current.rxBytes += rxBytes;
    current.txBytes += txBytes;
    current.totalBytes += rxBytes + txBytes;
    bySite[siteId] = current;
  }
  return bySite;
}

export function resolveStaffWifi(input: {
  apLinkedToSite: boolean;
  hourRows: Array<{ rx_bytes: number; tx_bytes: number }>;
}): StaffWifiState {
  if (!input.apLinkedToSite) return { kind: 'ap_unlinked' };
  if (input.hourRows.length === 0) return { kind: 'no_samples' };
  const rxBytes = input.hourRows.reduce((a, r) => a + Number(r.rx_bytes || 0), 0);
  const txBytes = input.hourRows.reduce((a, r) => a + Number(r.tx_bytes || 0), 0);
  return { kind: 'available', rxBytes, txBytes, totalBytes: rxBytes + txBytes };
}

export async function loadStaffHourRows(
  supabase: SupabaseClient,
  siteId: string,
  startUtc: Date,
  endUtc: Date
) {
  if (!RUIJIE_SSID_ROLLUP_ALLOWLIST.includes(STAFF_SSID)) {
    throw new Error('Staff SSID not allow-listed');
  }
  const { data, error } = await supabase
    .from('ruijie_ssid_traffic_rollups')
    .select('rx_bytes, tx_bytes, hour_bucket')
    .eq('corporate_site_id', siteId)
    .eq('ssid', STAFF_SSID)
    .gte('hour_bucket', startUtc.toISOString())
    .lte('hour_bucket', endUtc.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function loadStaffHourRowsForSites(
  supabase: SupabaseClient,
  siteIds: string[],
  startUtc: Date,
  endUtc: Date
) {
  if (siteIds.length === 0) return [];
  if (!RUIJIE_SSID_ROLLUP_ALLOWLIST.includes(STAFF_SSID)) {
    throw new Error('Staff SSID not allow-listed');
  }
  const { data, error } = await supabase
    .from('ruijie_ssid_traffic_rollups')
    .select('corporate_site_id, rx_bytes, tx_bytes')
    .in('corporate_site_id', siteIds)
    .eq('ssid', STAFF_SSID)
    .gte('hour_bucket', startUtc.toISOString())
    .lte('hour_bucket', endUtc.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function siteHasLinkedAp(supabase: SupabaseClient, siteId: string) {
  const { count } = await supabase
    .from('network_devices')
    .select('id', { count: 'exact', head: true })
    .eq('corporate_site_id', siteId);
  return (count ?? 0) > 0;
}
