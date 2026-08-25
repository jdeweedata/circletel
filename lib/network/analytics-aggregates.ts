/**
 * Pure helpers for Network Analytics (Phase 3).
 * No I/O — unit-tested aggregates for group traffic, radio util, SSID activity.
 */

import { avgOrNull, roundPercent } from './performance-aggregates';

/** Persist one row per Ruijie hourly flow sample (not a rolling 24h window total). */
export const HOURLY_ROLLUP_WINDOW = 1;

/** Longest preset analytics query window (UI offers up to 30d). */
export const MAX_ANALYTICS_HOURS = 720;
export const DEFAULT_ANALYTICS_HOURS = 24;
/** Longest custom calendar range (matches ruijie_traffic_rollups retention). */
export const MAX_ANALYTICS_CUSTOM_DAYS = 90;

const SAST_OFFSET = '+02:00';

/** Parse ?hours= for Network Analytics; invalid values fall back to 24h. */
export function parseAnalyticsHours(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_ANALYTICS_HOURS;
  return Math.min(Math.floor(n), MAX_ANALYTICS_HOURS);
}

export type AnalyticsCustomRange = {
  startDate: string;
  endDate: string;
  startUtc: Date;
  endUtc: Date;
  inclusiveDayCount: number;
};

type SastDateParts = { year: number; month: number; day: number };

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseSastDateString(date: string): SastDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Reject non-existent calendar days (e.g. 2026-02-31).
  const probe = new Date(`${year}-${pad2(month)}-${pad2(day)}T12:00:00${SAST_OFFSET}`);
  if (Number.isNaN(probe.getTime())) return null;
  const isoDay = probe.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
  if (isoDay !== `${year}-${pad2(month)}-${pad2(day)}`) return null;
  return { year, month, day };
}

function sastCalendarMs({ year, month, day }: SastDateParts): number {
  return new Date(`${year}-${pad2(month)}-${pad2(day)}T12:00:00${SAST_OFFSET}`).getTime();
}

/**
 * Parse inclusive SAST calendar dates for Cached analytics.
 * Returns null when missing, invalid, reversed, or longer than 90 days.
 */
export function parseAnalyticsCustomRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): AnalyticsCustomRange | null {
  if (!startDate || !endDate) return null;
  const start = parseSastDateString(startDate);
  const end = parseSastDateString(endDate);
  if (!start || !end) return null;

  const startMs = sastCalendarMs(start);
  const endMs = sastCalendarMs(end);
  if (endMs < startMs) return null;

  const inclusiveDayCount = Math.round((endMs - startMs) / 86_400_000) + 1;
  if (inclusiveDayCount < 1 || inclusiveDayCount > MAX_ANALYTICS_CUSTOM_DAYS) {
    return null;
  }

  const startUtc = new Date(
    `${start.year}-${pad2(start.month)}-${pad2(start.day)}T00:00:00.000${SAST_OFFSET}`
  );
  const endUtc = new Date(
    `${end.year}-${pad2(end.month)}-${pad2(end.day)}T23:59:59.999${SAST_OFFSET}`
  );

  return {
    startDate: `${start.year}-${pad2(start.month)}-${pad2(start.day)}`,
    endDate: `${end.year}-${pad2(end.month)}-${pad2(end.day)}`,
    startUtc,
    endUtc,
    inclusiveDayCount,
  };
}

/** Filter hourly rollups to one group, optionally one device. */
export function filterRollupsForScope<
  T extends { group_id: string; device_sn?: string | null },
>(rows: T[], options: { groupId: string; deviceSn?: string | null }): T[] {
  const deviceSn = options.deviceSn?.trim() || null;
  return rows.filter((row) => {
    if (row.group_id !== options.groupId) return false;
    if (deviceSn) return row.device_sn === deviceSn;
    return true;
  });
}

export type GroupRollupRow = {
  group_id: string;
  group_name: string | null;
  total_rx_bytes: number | null;
  total_tx_bytes: number | null;
  captured_at: string;
};

export type HourlyTrafficPoint = {
  timestamp: number;
  rxBytes: number;
  txBytes: number;
};

export type HourlyRollupUpsert = {
  group_id: string;
  group_name: string | null;
  /** Serial of the device this hour's flow came from — part of the unique key. */
  device_sn: string;
  captured_at: string;
  hours_window: number;
  total_rx_bytes: number;
  total_tx_bytes: number;
  avg_rx_bps: number;
  avg_tx_bps: number;
  peak_rx_bps: number;
  peak_tx_bps: number;
  raw_summary: {
    flowSn: string;
    source: 'hourly_flow';
  };
};

/**
 * Bucket a timestamp to the UTC hour ISO string used as rollup captured_at.
 */
export function hourBucketIso(timestamp: number): string {
  const d = new Date(timestamp);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/**
 * Build hours_window=1 upserts from Ruijie hourly flow points.
 * One row per hour — analytics charts and group cards can sum without double-counting.
 */
export function buildHourlyRollupUpserts(params: {
  groupId: string;
  groupName: string | null;
  flowSn: string;
  dataPoints: HourlyTrafficPoint[];
}): HourlyRollupUpsert[] {
  const byHour = new Map<string, { rx: number; tx: number }>();

  for (const point of params.dataPoints) {
    if (!Number.isFinite(point.timestamp)) continue;
    const key = hourBucketIso(point.timestamp);
    const prev = byHour.get(key) || { rx: 0, tx: 0 };
    prev.rx += Number(point.rxBytes) || 0;
    prev.tx += Number(point.txBytes) || 0;
    byHour.set(key, prev);
  }

  return Array.from(byHour.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([captured_at, { rx, tx }]) => {
      const avgRxBps = (rx * 8) / 3600;
      const avgTxBps = (tx * 8) / 3600;
      return {
        group_id: params.groupId,
        group_name: params.groupName,
        // The device this flow belongs to. Group totals are the SUM across
        // device_sn — one AP's series is never the group's, nor a site's (#702).
        device_sn: params.flowSn,
        captured_at,
        hours_window: HOURLY_ROLLUP_WINDOW,
        total_rx_bytes: Math.round(rx),
        total_tx_bytes: Math.round(tx),
        avg_rx_bps: avgRxBps,
        avg_tx_bps: avgTxBps,
        peak_rx_bps: avgRxBps,
        peak_tx_bps: avgTxBps,
        raw_summary: {
          flowSn: params.flowSn,
          source: 'hourly_flow' as const,
        },
      };
    });
}

export type GroupTrafficCard = {
  groupId: string;
  groupName: string;
  totalRxBytes: number;
  totalTxBytes: number;
  totalBytes: number;
  sampleCount: number;
  lastCapturedAt: string | null;
};

export type RadioDeviceRow = {
  sn: string;
  device_name: string;
  status: string;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
  radio_2g_channel?: number | null;
  radio_5g_channel?: number | null;
};

export type RadioUtilSummary = {
  avg2g: number | null;
  avg5g: number | null;
  avgBlended: number | null;
  devicesWithRadio: number;
  totalDevices: number;
  channels2g: number[];
  channels5g: number[];
  byDevice: Array<{
    sn: string;
    device_name: string;
    status: string;
    radio_2g_utilization: number | null;
    radio_5g_utilization: number | null;
  }>;
};

export type SsidStaRow = {
  ssid?: string | null;
};

export type SsidActivityCard = {
  ssid: string;
  clients: number;
};

/**
 * Sum rollup traffic per group within the selected window.
 * Only returns groups that have at least one rollup row.
 */
export function computeGroupTrafficCards(rows: GroupRollupRow[]): GroupTrafficCard[] {
  const byGroup = new Map<
    string,
    {
      groupName: string;
      rx: number;
      tx: number;
      samples: number;
      lastCapturedAt: string | null;
    }
  >();

  for (const row of rows) {
    if (!row.group_id) continue;
    const prev = byGroup.get(row.group_id) || {
      groupName: row.group_name || row.group_id,
      rx: 0,
      tx: 0,
      samples: 0,
      lastCapturedAt: null as string | null,
    };
    prev.rx += Number(row.total_rx_bytes) || 0;
    prev.tx += Number(row.total_tx_bytes) || 0;
    prev.samples += 1;
    if (row.group_name) prev.groupName = row.group_name;
    if (
      !prev.lastCapturedAt ||
      new Date(row.captured_at).getTime() > new Date(prev.lastCapturedAt).getTime()
    ) {
      prev.lastCapturedAt = row.captured_at;
    }
    byGroup.set(row.group_id, prev);
  }

  return Array.from(byGroup.entries())
    .map(([groupId, v]) => ({
      groupId,
      groupName: v.groupName,
      totalRxBytes: v.rx,
      totalTxBytes: v.tx,
      totalBytes: v.rx + v.tx,
      sampleCount: v.samples,
      lastCapturedAt: v.lastCapturedAt,
    }))
    .filter((c) => c.totalBytes > 0 || c.sampleCount > 0)
    .sort((a, b) => b.totalBytes - a.totalBytes);
}

/**
 * Radio / channel util from device cache only.
 * Returns null averages when no device has util metrics (empty UI, no fake dBm).
 */
export function computeRadioUtilSummary(devices: RadioDeviceRow[]): RadioUtilSummary {
  const withRadio = devices.filter(
    (d) => d.radio_2g_utilization != null || d.radio_5g_utilization != null
  );
  const channels2g = [
    ...new Set(
      devices
        .map((d) => d.radio_2g_channel)
        .filter((c): c is number => typeof c === 'number' && !Number.isNaN(c))
    ),
  ].sort((a, b) => a - b);
  const channels5g = [
    ...new Set(
      devices
        .map((d) => d.radio_5g_channel)
        .filter((c): c is number => typeof c === 'number' && !Number.isNaN(c))
    ),
  ].sort((a, b) => a - b);

  const avg2g = avgOrNull(devices.map((d) => d.radio_2g_utilization));
  const avg5g = avgOrNull(devices.map((d) => d.radio_5g_utilization));
  const blended = devices.map((d) =>
    avgOrNull([d.radio_2g_utilization, d.radio_5g_utilization])
  );

  return {
    avg2g: avg2g == null ? null : roundPercent(avg2g),
    avg5g: avg5g == null ? null : roundPercent(avg5g),
    avgBlended: (() => {
      const v = avgOrNull(blended);
      return v == null ? null : roundPercent(v);
    })(),
    devicesWithRadio: withRadio.length,
    totalDevices: devices.length,
    channels2g,
    channels5g,
    byDevice: withRadio
      .map((d) => ({
        sn: d.sn,
        device_name: d.device_name,
        status: d.status,
        radio_2g_utilization: d.radio_2g_utilization,
        radio_5g_utilization: d.radio_5g_utilization,
      }))
      .sort((a, b) => {
        const aMax = Math.max(a.radio_2g_utilization ?? 0, a.radio_5g_utilization ?? 0);
        const bMax = Math.max(b.radio_2g_utilization ?? 0, b.radio_5g_utilization ?? 0);
        return bMax - aMax;
      }),
  };
}

/**
 * Client counts by SSID from live STA rows (not byte traffic).
 * Empty when Ruijie STA has no SSID associations.
 */
export function aggregateSsidActivity(stas: SsidStaRow[]): SsidActivityCard[] {
  const counts = new Map<string, number>();
  for (const sta of stas) {
    const ssid = (sta.ssid || '').trim();
    if (!ssid) continue;
    counts.set(ssid, (counts.get(ssid) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([ssid, clients]) => ({ ssid, clients }))
    .sort((a, b) => b.clients - a.clients || a.ssid.localeCompare(b.ssid));
}
