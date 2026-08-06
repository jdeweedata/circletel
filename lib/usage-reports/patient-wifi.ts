import type { SupabaseClient } from '@supabase/supabase-js';
import { RUIJIE_SSID_ROLLUP_ALLOWLIST } from '@/lib/ruijie/types';
import type { PatientWifiState } from './types';

/** Exact Ruijie broadcast name — must stay in RUIJIE_SSID_ROLLUP_ALLOWLIST. */
export const FREE_SSID = 'Unjani Clinic Free WiFi';

export interface TdxPatientRow {
  siteCode: string;
  uniqueUsers: number;
  loginSessions: number;
  downloadGb: number;
}

/**
 * Match an uploaded TDX row to a site by account number. Shared so preview and
 * download resolve the same row — a preview that matched differently would show
 * figures the downloaded PDF does not contain.
 */
export function patientRowForSite(
  rows: TdxPatientRow[],
  accountNumber: string
): TdxPatientRow | null {
  const normalizedAccount = accountNumber.trim().toLowerCase();
  return (
    rows.find((row) => row.siteCode.trim().toLowerCase() === normalizedAccount) ??
    null
  );
}

/** Runtime guard for rows arriving over the wire from the admin UI. */
export function isTdxPatientRow(value: unknown): value is TdxPatientRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  const nonNegativeNumber = (input: unknown) =>
    typeof input === 'number' && Number.isFinite(input) && input >= 0;
  return (
    typeof row.siteCode === 'string' &&
    nonNegativeNumber(row.uniqueUsers) &&
    nonNegativeNumber(row.loginSessions) &&
    nonNegativeNumber(row.downloadGb)
  );
}

const SITE_CODE_HEADERS = ['site code', 'account_number', 'account number'];
const UNIQUE_USERS_HEADERS = ['unique users', 'users'];
const SESSIONS_HEADERS = ['sessions', 'login sessions'];
const DOWNLOAD_HEADERS = ['download gb', 'download (gb)'];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findColumnIndex(headers: string[], aliases: readonly string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseCsvLine(line: string): string[] {
  return line.split(',').map((cell) => cell.trim());
}

export function parseTdxPatientCsv(csv: string): TdxPatientRow[] {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const siteIdx = findColumnIndex(headers, SITE_CODE_HEADERS);
  const usersIdx = findColumnIndex(headers, UNIQUE_USERS_HEADERS);
  const sessionsIdx = findColumnIndex(headers, SESSIONS_HEADERS);
  const downloadIdx = findColumnIndex(headers, DOWNLOAD_HEADERS);
  if (siteIdx < 0) return [];

  const rows: TdxPatientRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const siteCode = cols[siteIdx]?.trim();
    if (!siteCode) continue;

    rows.push({
      siteCode,
      uniqueUsers: usersIdx >= 0 ? Number(cols[usersIdx] || 0) : 0,
      loginSessions: sessionsIdx >= 0 ? Number(cols[sessionsIdx] || 0) : 0,
      downloadGb: downloadIdx >= 0 ? Number(cols[downloadIdx] || 0) : 0,
    });
  }

  return rows;
}

export async function loadFreeHourRows(
  supabase: SupabaseClient,
  siteId: string,
  startUtc: Date,
  endUtc: Date
) {
  if (!(RUIJIE_SSID_ROLLUP_ALLOWLIST as readonly string[]).includes(FREE_SSID)) {
    throw new Error('Free Clinic SSID not allow-listed');
  }
  const { data, error } = await supabase
    .from('ruijie_ssid_traffic_rollups')
    .select('rx_bytes, tx_bytes, hour_bucket')
    .eq('corporate_site_id', siteId)
    .eq('ssid', FREE_SSID)
    .gte('hour_bucket', startUtc.toISOString())
    .lte('hour_bucket', endUtc.toISOString());
  if (error) throw error;
  return data ?? [];
}

/**
 * Prefer CircleTel Free Clinic SSID STA rollups for period GB; optionally merge
 * TDX unique users / sessions when a Looker CSV row is present. Do not sum
 * TDX download GB with Ruijie STA bytes — Ruijie wins for download when both.
 */
export function resolvePatientWifi(input: {
  apLinkedToSite: boolean;
  hourRows: Array<{ rx_bytes: number; tx_bytes: number }>;
  tdxRow: TdxPatientRow | null;
}): PatientWifiState {
  const hasRollups = input.hourRows.length > 0;
  const tdx = input.tdxRow;

  if (hasRollups) {
    const rxBytes = input.hourRows.reduce((a, r) => a + Number(r.rx_bytes || 0), 0);
    const txBytes = input.hourRows.reduce((a, r) => a + Number(r.tx_bytes || 0), 0);
    const totalBytes = rxBytes + txBytes;
    return {
      kind: 'available',
      source: tdx ? 'combined' : 'ruijie_ssid',
      uniqueUsers: tdx ? tdx.uniqueUsers : null,
      loginSessions: tdx ? tdx.loginSessions : null,
      downloadGb: totalBytes / 1e9,
      rxBytes,
      txBytes,
      totalBytes,
    };
  }

  if (tdx) {
    return {
      kind: 'available',
      source: 'tdx_csv',
      uniqueUsers: tdx.uniqueUsers,
      loginSessions: tdx.loginSessions,
      downloadGb: tdx.downloadGb,
      rxBytes: null,
      txBytes: null,
      totalBytes: null,
    };
  }

  if (!input.apLinkedToSite) return { kind: 'ap_unlinked' };
  return { kind: 'no_samples' };
}
