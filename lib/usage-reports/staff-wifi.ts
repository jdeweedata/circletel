import type { SupabaseClient } from '@supabase/supabase-js';
import { RUIJIE_SSID_ROLLUP_ALLOWLIST } from '@/lib/ruijie/types';
import type { StaffWifiState } from './types';

export const STAFF_SSID = 'Unjani Clinic Staff'; // must stay in allowlist

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

export async function siteHasLinkedAp(supabase: SupabaseClient, siteId: string) {
  const { count } = await supabase
    .from('network_devices')
    .select('id', { count: 'exact', head: true })
    .eq('corporate_site_id', siteId);
  return (count ?? 0) > 0;
}
