import type { PatientWifiState } from './types';

export interface TdxPatientRow {
  siteCode: string;
  uniqueUsers: number;
  loginSessions: number;
  downloadGb: number;
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

export function resolvePatientWifi(row: TdxPatientRow | null): PatientWifiState {
  if (!row) return { kind: 'awaiting_export' };
  return {
    kind: 'available',
    uniqueUsers: row.uniqueUsers,
    loginSessions: row.loginSessions,
    downloadGb: row.downloadGb,
  };
}