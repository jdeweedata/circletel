/**
 * Network Analytics export model — group aggregate or single AP.
 *
 * Traffic comes from Supabase rollups (same as Cached Analytics). Connected
 * clients are a live STA snapshot at generation time. Interstellio is an
 * optional secondary series when the AP is linked to a corporate site with a
 * subscriber id.
 */

import { createClient } from '@/lib/supabase/server';
import { getDeviceClients, type RuijieClient } from '@/lib/ruijie/client';
import { bpsToMbps, roundPercent } from '@/lib/network/performance-aggregates';
import {
  computeGroupTrafficCards,
  computeRadioUtilSummary,
  filterRollupsForScope,
  HOURLY_ROLLUP_WINDOW,
  parseAnalyticsCustomRange,
  parseAnalyticsHours,
  type GroupTrafficCard,
  type RadioUtilSummary,
} from '@/lib/network/analytics-aggregates';
import {
  loadInterstellioDailyEntries,
  loadInterstellioSubscriberId,
} from '@/lib/usage-reports/core-traffic';
import type { DataUsageEntry } from '@/lib/interstellio/types';
import type { ReportPeriod } from '@/lib/usage-reports/types';
import { SAST_TIMEZONE } from '@/lib/dates';

const BYTES_PER_INTERSTELLIO_KB = 1_024;

export type AnalyticsExportPeriod =
  | {
      mode: 'hours';
      hours: number;
      label: string;
      startUtc: Date;
      endUtc: Date;
    }
  | {
      mode: 'custom';
      startDate: string;
      endDate: string;
      label: string;
      startUtc: Date;
      endUtc: Date;
      inclusiveDayCount: number;
    };

export type AnalyticsExportInterstellio = {
  linked: boolean;
  siteId?: string;
  siteName?: string;
  dailyDownloadBytes: number[];
  dailyUploadBytes: number[];
  totalDownloadBytes: number;
  totalUploadBytes: number;
  note?: string;
};

export type AnalyticsExportTraffic = {
  totalRxBytes: number;
  totalTxBytes: number;
  totalBytes: number;
  avgRxRate: number;
  avgTxRate: number;
  peakRxBytes: number;
  peakTxBytes: number;
  avgRxMbps: number;
  avgTxMbps: number;
  dataPoints: Array<{
    timestamp: number;
    timeString: string;
    rxBytes: number;
    txBytes: number;
    avgRxMbps: number;
    avgTxMbps: number;
  }>;
};

export type AnalyticsExportDevice = {
  sn: string;
  device_name: string;
  model: string | null;
  status: string;
  group_id: string;
  group_name: string | null;
};

export type AnalyticsExportModel = {
  scope: 'group' | 'device';
  group: { id: string; name: string };
  device?: AnalyticsExportDevice;
  period: AnalyticsExportPeriod;
  traffic: AnalyticsExportTraffic;
  groupTraffic: GroupTrafficCard[];
  radio: RadioUtilSummary;
  clients: RuijieClient[];
  /** null for group scope; object (possibly unlinked) for device scope */
  interstellio: AnalyticsExportInterstellio | null;
  generatedAtIso: string;
  unavailable: Record<string, string>;
};

export type BuildAnalyticsExportInput = {
  groupId: string | null;
  deviceSn: string | null;
  hoursRaw: string | null;
  startDate: string | null;
  endDate: string | null;
};

type RollupRow = {
  group_id: string;
  group_name: string | null;
  device_sn?: string | null;
  captured_at: string;
  hours_window: number;
  total_rx_bytes: number | null;
  total_tx_bytes: number | null;
  avg_rx_bps: number | null;
  avg_tx_bps: number | null;
  peak_rx_bps: number | null;
  peak_tx_bps: number | null;
};

function hoursLabel(hours: number): string {
  if (hours % 24 === 0 && hours >= 24) {
    const days = hours / 24;
    return `Last ${days} day${days > 1 ? 's' : ''}`;
  }
  return `Last ${hours} hours`;
}

function periodSuffix(period: AnalyticsExportPeriod): string {
  if (period.mode === 'custom') {
    return `${period.startDate}_${period.endDate}`;
  }
  if (period.hours % 24 === 0) return `${period.hours / 24}d`;
  return `${period.hours}h`;
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'Network';
}

function sastDayKey(value: Date | string): string | null {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function emptyTraffic(): AnalyticsExportTraffic {
  return {
    totalRxBytes: 0,
    totalTxBytes: 0,
    totalBytes: 0,
    avgRxRate: 0,
    avgTxRate: 0,
    peakRxBytes: 0,
    peakTxBytes: 0,
    avgRxMbps: 0,
    avgTxMbps: 0,
    dataPoints: [],
  };
}

export function resolveAnalyticsExportPeriod(opts: {
  hoursRaw: string | null;
  startDate: string | null;
  endDate: string | null;
}): AnalyticsExportPeriod {
  const custom = parseAnalyticsCustomRange(opts.startDate, opts.endDate);
  if (custom) {
    return {
      mode: 'custom',
      startDate: custom.startDate,
      endDate: custom.endDate,
      label: `${custom.startDate} → ${custom.endDate}`,
      startUtc: custom.startUtc,
      endUtc: custom.endUtc,
      inclusiveDayCount: custom.inclusiveDayCount,
    };
  }

  const hours = parseAnalyticsHours(opts.hoursRaw);
  const endUtc = new Date();
  const startUtc = new Date(endUtc.getTime() - hours * 60 * 60 * 1000);
  return {
    mode: 'hours',
    hours,
    label: hoursLabel(hours),
    startUtc,
    endUtc,
  };
}

export function periodToReportPeriod(period: AnalyticsExportPeriod): ReportPeriod {
  const inclusiveDayCount =
    period.mode === 'custom'
      ? period.inclusiveDayCount
      : Math.max(
          1,
          Math.round(
            (period.endUtc.getTime() - period.startUtc.getTime()) / 86_400_000
          ) + 1
        );

  return {
    preset: 'custom',
    timezone: SAST_TIMEZONE,
    startIso: period.startUtc.toISOString(),
    endIso: period.endUtc.toISOString(),
    startUtc: period.startUtc,
    endUtc: period.endUtc,
    label: period.label,
    rangeLabel: period.label,
    inclusiveDayCount,
    isShortPeriod: inclusiveDayCount <= 7,
  };
}

export function analyticsExportFilename(opts: {
  scope: 'group' | 'device';
  groupName: string;
  deviceSn: string | null;
  period: AnalyticsExportPeriod;
  extension: 'pdf' | 'xlsx';
}): string {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
  }).format(new Date());
  const scopePart =
    opts.scope === 'device' && opts.deviceSn
      ? sanitizeFilenamePart(opts.deviceSn)
      : sanitizeFilenamePart(opts.groupName);
  return `CircleTel_Analytics_${scopePart}_${date}_${periodSuffix(opts.period)}.${opts.extension}`;
}

export function trafficFromAnalyticsRollups(
  rows: Array<{
    captured_at: string;
    total_rx_bytes: number | null;
    total_tx_bytes: number | null;
    avg_rx_bps?: number | null;
    avg_tx_bps?: number | null;
  }>
): AnalyticsExportTraffic {
  if (rows.length === 0) return emptyTraffic();

  const dataPoints = rows.map((row) => {
    const avgRx = Number(row.avg_rx_bps) || 0;
    const avgTx = Number(row.avg_tx_bps) || 0;
    return {
      timestamp: new Date(row.captured_at).getTime(),
      timeString: row.captured_at,
      rxBytes: Number(row.total_rx_bytes) || 0,
      txBytes: Number(row.total_tx_bytes) || 0,
      avgRxMbps: roundPercent(bpsToMbps(avgRx)),
      avgTxMbps: roundPercent(bpsToMbps(avgTx)),
    };
  });

  const totalRxBytes = dataPoints.reduce((s, p) => s + p.rxBytes, 0);
  const totalTxBytes = dataPoints.reduce((s, p) => s + p.txBytes, 0);
  const avgRxRate =
    rows.reduce((s, r) => s + (Number(r.avg_rx_bps) || 0), 0) / rows.length;
  const avgTxRate =
    rows.reduce((s, r) => s + (Number(r.avg_tx_bps) || 0), 0) / rows.length;

  return {
    totalRxBytes,
    totalTxBytes,
    totalBytes: totalRxBytes + totalTxBytes,
    avgRxRate,
    avgTxRate,
    peakRxBytes: Math.max(0, ...dataPoints.map((p) => p.rxBytes), 0),
    peakTxBytes: Math.max(0, ...dataPoints.map((p) => p.txBytes), 0),
    avgRxMbps: roundPercent(bpsToMbps(avgRxRate)),
    avgTxMbps: roundPercent(bpsToMbps(avgTxRate)),
    dataPoints,
  };
}

export function shapeInterstellioSection(input: {
  siteId: string | null;
  siteName: string | null;
  subscriberId: string | null;
  entries: DataUsageEntry[];
  dayCount: number;
  startUtc?: Date;
}): AnalyticsExportInterstellio {
  const dayCount = Math.max(1, input.dayCount);
  const dailyDownloadBytes = Array.from({ length: dayCount }, () => 0);
  const dailyUploadBytes = Array.from({ length: dayCount }, () => 0);

  if (!input.siteId || !input.subscriberId) {
    return {
      linked: false,
      siteId: input.siteId ?? undefined,
      siteName: input.siteName ?? undefined,
      dailyDownloadBytes,
      dailyUploadBytes,
      totalDownloadBytes: 0,
      totalUploadBytes: 0,
      note: 'Interstellio not linked for this AP — set corporate_sites.interstellio_subscriber_id on the linked site.',
    };
  }

  const start = input.startUtc ?? new Date();
  const indexByDay = new Map<string, number>();
  for (let i = 0; i < dayCount; i++) {
    const day = new Date(start.getTime() + i * 86_400_000);
    const key = sastDayKey(day);
    if (key) indexByDay.set(key, i);
  }

  let totalDownloadBytes = 0;
  let totalUploadBytes = 0;
  for (const entry of input.entries) {
    const download = (Number(entry.download_kb) || 0) * BYTES_PER_INTERSTELLIO_KB;
    const upload = (Number(entry.upload_kb) || 0) * BYTES_PER_INTERSTELLIO_KB;
    totalDownloadBytes += download;
    totalUploadBytes += upload;
    const index = indexByDay.get(sastDayKey(entry.time) ?? '');
    if (index !== undefined) {
      dailyDownloadBytes[index] += download;
      dailyUploadBytes[index] += upload;
    }
  }

  return {
    linked: true,
    siteId: input.siteId,
    siteName: input.siteName ?? undefined,
    dailyDownloadBytes,
    dailyUploadBytes,
    totalDownloadBytes,
    totalUploadBytes,
    note: 'Secondary source: Interstellio BNG daily subscriber usage for the linked corporate site. Not summed into Ruijie AP traffic.',
  };
}

/**
 * Resolve corporate site + Interstellio for one Ruijie SN.
 * Shared by Analytics export and device-page export.
 */
export async function loadInterstellioForDeviceSn(
  sn: string,
  period: AnalyticsExportPeriod
): Promise<AnalyticsExportInterstellio> {
  const supabase = await createClient();
  const reportPeriod = periodToReportPeriod(period);

  const { data: link } = await supabase
    .from('network_devices')
    .select('corporate_site_id')
    .eq('ruijie_device_sn', sn)
    .not('corporate_site_id', 'is', null)
    .limit(1)
    .maybeSingle();

  const siteId = (link?.corporate_site_id as string | null) ?? null;
  if (!siteId) {
    return shapeInterstellioSection({
      siteId: null,
      siteName: null,
      subscriberId: null,
      entries: [],
      dayCount: reportPeriod.inclusiveDayCount,
      startUtc: period.startUtc,
    });
  }

  const { data: site } = await supabase
    .from('corporate_sites')
    .select('id, site_name, interstellio_subscriber_id')
    .eq('id', siteId)
    .maybeSingle();

  const siteName = (site?.site_name as string | null) || null;

  let subscriberId: string | null = null;
  try {
    subscriberId = await loadInterstellioSubscriberId(supabase, siteId);
  } catch {
    subscriberId =
      (site?.interstellio_subscriber_id as string | null | undefined) ?? null;
  }

  if (!subscriberId) {
    return shapeInterstellioSection({
      siteId,
      siteName,
      subscriberId: null,
      entries: [],
      dayCount: reportPeriod.inclusiveDayCount,
      startUtc: period.startUtc,
    });
  }

  let entries: DataUsageEntry[] = [];
  try {
    entries = await loadInterstellioDailyEntries(subscriberId, reportPeriod);
  } catch {
    return {
      ...shapeInterstellioSection({
        siteId,
        siteName,
        subscriberId,
        entries: [],
        dayCount: reportPeriod.inclusiveDayCount,
        startUtc: period.startUtc,
      }),
      note: 'Interstellio linked but usage fetch failed for this period.',
    };
  }

  return shapeInterstellioSection({
    siteId,
    siteName,
    subscriberId,
    entries,
    dayCount: reportPeriod.inclusiveDayCount,
    startUtc: period.startUtc,
  });
}

export async function buildAnalyticsExportModel(
  input: BuildAnalyticsExportInput
): Promise<AnalyticsExportModel | null> {
  const supabase = await createClient();
  const period = resolveAnalyticsExportPeriod({
    hoursRaw: input.hoursRaw,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  const { data: deviceGroups } = await supabase
    .from('ruijie_device_cache')
    .select(
      'group_id, group_name, sn, device_name, model, status, radio_2g_utilization, radio_5g_utilization, radio_2g_channel, radio_5g_channel'
    )
    .not('group_id', 'is', null);

  const groupMap = new Map<string, string>();
  for (const row of deviceGroups || []) {
    if (row.group_id && !groupMap.has(row.group_id)) {
      groupMap.set(row.group_id, row.group_name || row.group_id);
    }
  }

  const effectiveGroupId = input.groupId || groupMap.keys().next().value || null;
  if (!effectiveGroupId) return null;

  const groupName = groupMap.get(effectiveGroupId) || effectiveGroupId;
  const groupDevices = (deviceGroups || []).filter(
    (d) => d.group_id === effectiveGroupId
  );

  const requestedSn = input.deviceSn?.trim() || null;
  const deviceRow =
    requestedSn && groupDevices.find((d) => d.sn === requestedSn)
      ? groupDevices.find((d) => d.sn === requestedSn)!
      : null;
  const scope: 'group' | 'device' = deviceRow ? 'device' : 'group';
  const deviceSn = deviceRow?.sn ?? null;

  let rollupQuery = supabase
    .from('ruijie_traffic_rollups')
    .select(
      'group_id, group_name, device_sn, total_rx_bytes, total_tx_bytes, captured_at, hours_window, avg_rx_bps, avg_tx_bps, peak_rx_bps, peak_tx_bps'
    )
    .eq('hours_window', HOURLY_ROLLUP_WINDOW)
    .neq('device_sn', '__legacy_group__')
    .gte('captured_at', period.startUtc.toISOString())
    .lte('captured_at', period.endUtc.toISOString())
    .order('captured_at', { ascending: true });

  const { data: rollups } = await rollupQuery;
  const allRollups = (rollups || []) as RollupRow[];

  const groupTraffic = computeGroupTrafficCards(allRollups);
  const radio = computeRadioUtilSummary(
    groupDevices.map((d) => ({
      sn: d.sn,
      device_name: d.device_name,
      status: d.status,
      radio_2g_utilization: d.radio_2g_utilization,
      radio_5g_utilization: d.radio_5g_utilization,
      radio_2g_channel: d.radio_2g_channel,
      radio_5g_channel: d.radio_5g_channel,
    }))
  );

  const seriesRows = filterRollupsForScope(allRollups, {
    groupId: effectiveGroupId,
    deviceSn,
  }).sort(
    (a, b) =>
      new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  const traffic = trafficFromAnalyticsRollups(seriesRows);
  const unavailable: Record<string, string> = {};
  if (traffic.dataPoints.length === 0) {
    unavailable.traffic = 'No rollup samples in this window';
  }

  let clients: RuijieClient[] = [];
  let interstellio: AnalyticsExportInterstellio | null = null;

  if (scope === 'group') {
    unavailable.clients =
      'Select an AP for a live connected-clients snapshot at generation time.';
  } else if (deviceSn) {
    try {
      clients = await getDeviceClients(deviceSn, effectiveGroupId);
    } catch (err) {
      unavailable.clients =
        err instanceof Error ? err.message : 'Failed to fetch connected clients';
    }
    try {
      interstellio = await loadInterstellioForDeviceSn(deviceSn, period);
    } catch (err) {
      interstellio = shapeInterstellioSection({
        siteId: null,
        siteName: null,
        subscriberId: null,
        entries: [],
        dayCount: periodToReportPeriod(period).inclusiveDayCount,
        startUtc: period.startUtc,
      });
      unavailable.interstellio =
        err instanceof Error ? err.message : 'Interstellio lookup failed';
    }
  }

  return {
    scope,
    group: { id: effectiveGroupId, name: groupName },
    device: deviceRow
      ? {
          sn: String(deviceRow.sn),
          device_name: deviceRow.device_name || String(deviceRow.sn),
          model: deviceRow.model ?? null,
          status: deviceRow.status || 'unknown',
          group_id: effectiveGroupId,
          group_name: groupName,
        }
      : undefined,
    period,
    traffic,
    groupTraffic,
    radio,
    clients,
    interstellio,
    generatedAtIso: new Date().toISOString(),
    unavailable,
  };
}
