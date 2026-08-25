/**
 * Network Analytics API (Supabase-backed + live Ruijie)
 *
 * GET /api/admin/network/analytics
 * Query:
 * - groupId (optional)
 * - deviceSn (optional — scopes KPI/traffic series to one AP)
 * - hours (default 24, max 720 = 30 days) OR startDate+endDate (SAST, max 90d, Cached only)
 * - live=true, includeApps
 *
 * Cache-first (default): traffic KPIs/series + group cards from ruijie_traffic_rollups
 * (hours_window=1). Radio from device cache. No live Ruijie calls.
 *
 * Live (?live=true): traffic + optional app-flow + STA from Ruijie (10s timeout).
 * Custom date ranges are ignored in live mode (hours presets only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import {
  getNetworkTraffic,
  getAppFlow,
  getGroupStaUsers,
  pickFlowDeviceSn,
} from '@/lib/ruijie/client';
import { bpsToMbps, roundPercent } from '@/lib/network/performance-aggregates';
import {
  aggregateSsidActivity,
  computeGroupTrafficCards,
  computeRadioUtilSummary,
  filterRollupsForScope,
  HOURLY_ROLLUP_WINDOW,
  parseAnalyticsCustomRange,
  parseAnalyticsHours,
} from '@/lib/network/analytics-aggregates';

export const dynamic = 'force-dynamic';

const emptyTraffic = {
  totalRxBytes: 0,
  totalTxBytes: 0,
  totalBytes: 0,
  avgRxRate: 0,
  avgTxRate: 0,
  peakRxBytes: 0,
  peakTxBytes: 0,
  avgRxMbps: 0,
  avgTxMbps: 0,
  dataPoints: [] as unknown[],
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
  raw_summary: unknown;
};

const ROLLUP_SELECT =
  'group_id, group_name, device_sn, total_rx_bytes, total_tx_bytes, captured_at, hours_window, avg_rx_bps, avg_tx_bps, peak_rx_bps, peak_tx_bps, raw_summary';

function maxIso(dates: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const value of dates) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = value;
    }
  }
  return best;
}

function trafficFromHourlyRollups(rollups: RollupRow[]) {
  const dataPoints = rollups.map((row) => ({
    timestamp: new Date(row.captured_at).getTime(),
    timeString: row.captured_at,
    rxBytes: Number(row.total_rx_bytes) || 0,
    txBytes: Number(row.total_tx_bytes) || 0,
    rxPkts: 0,
    txPkts: 0,
    buildingId: 0,
    avgRxMbps: roundPercent(bpsToMbps(row.avg_rx_bps || 0)),
    avgTxMbps: roundPercent(bpsToMbps(row.avg_tx_bps || 0)),
  }));

  const totalRxBytes = dataPoints.reduce((s, p) => s + p.rxBytes, 0);
  const totalTxBytes = dataPoints.reduce((s, p) => s + p.txBytes, 0);
  const avgRxRate =
    rollups.length > 0
      ? rollups.reduce((s, r) => s + (r.avg_rx_bps || 0), 0) / rollups.length
      : 0;
  const avgTxRate =
    rollups.length > 0
      ? rollups.reduce((s, r) => s + (r.avg_tx_bps || 0), 0) / rollups.length
      : 0;

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

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');
    const requestedDeviceSn = searchParams.get('deviceSn')?.trim() || null;
    const hours = parseAnalyticsHours(searchParams.get('hours'));
    const live = searchParams.get('live') === 'true';
    const includeApps = searchParams.get('includeApps') !== 'false';

    // Custom range is Cached-only; Live always uses hours presets.
    const customRange =
      !live
        ? parseAnalyticsCustomRange(
            searchParams.get('startDate'),
            searchParams.get('endDate')
          )
        : null;

    const supabase = await createClient();
    const since = customRange
      ? customRange.startUtc.toISOString()
      : new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const until = customRange ? customRange.endUtc.toISOString() : null;

    const period = customRange
      ? {
          mode: 'custom' as const,
          startDate: customRange.startDate,
          endDate: customRange.endDate,
          inclusiveDayCount: customRange.inclusiveDayCount,
        }
      : {
          mode: 'hours' as const,
          hours,
        };

    const [{ data: deviceGroups }, { data: lastSync }] = await Promise.all([
      supabase
        .from('ruijie_device_cache')
        .select(
          'group_id, group_name, sn, device_name, status, model, radio_2g_utilization, radio_5g_utilization, radio_2g_channel, radio_5g_channel'
        )
        .not('group_id', 'is', null),
      supabase
        .from('ruijie_sync_logs')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const lastSyncedAt = lastSync?.completed_at ?? null;

    const groupMap = new Map<string, string>();
    for (const row of deviceGroups || []) {
      if (row.group_id && !groupMap.has(row.group_id)) {
        groupMap.set(row.group_id, row.group_name || row.group_id);
      }
    }
    const groups = Array.from(groupMap.entries()).map(([id, name]) => ({ id, name }));
    const effectiveGroupId = groupId || groups[0]?.id || null;

    let hourlyQuery = supabase
      .from('ruijie_traffic_rollups')
      .select(ROLLUP_SELECT)
      .eq('hours_window', HOURLY_ROLLUP_WINDOW)
      // Legacy group blobs would double-count against per-device rows for the
      // 14-day retention overlap (#702).
      .neq('device_sn', '__legacy_group__')
      .gte('captured_at', since)
      .order('captured_at', { ascending: true });
    if (until) {
      hourlyQuery = hourlyQuery.lte('captured_at', until);
    }
    const { data: hourlyRollups } = await hourlyQuery;

    const usingHourlySeries = (hourlyRollups || []).length > 0;
    let rollupsForCards = (hourlyRollups || []) as RollupRow[];

    if (!usingHourlySeries) {
      let legacyQuery = supabase
        .from('ruijie_traffic_rollups')
        .select(ROLLUP_SELECT)
        .gte('captured_at', since)
        .order('captured_at', { ascending: true });
      if (until) {
        legacyQuery = legacyQuery.lte('captured_at', until);
      }
      const { data: legacyRollups } = await legacyQuery;

      // Legacy rows are overlapping window totals — keep only the newest per group.
      const latestByGroup = new Map<string, RollupRow>();
      for (const row of (legacyRollups || []) as RollupRow[]) {
        const prev = latestByGroup.get(row.group_id);
        if (
          !prev ||
          new Date(row.captured_at).getTime() > new Date(prev.captured_at).getTime()
        ) {
          latestByGroup.set(row.group_id, row);
        }
      }
      rollupsForCards = Array.from(latestByGroup.values());
    }

    // Group cards stay group-scoped (all devices) for the window.
    const groupTraffic = computeGroupTrafficCards(rollupsForCards);
    const lastRollupAt = maxIso([
      ...rollupsForCards.map((r) => r.captured_at),
      ...groupTraffic.map((g) => g.lastCapturedAt),
    ]);

    const groupDevices = (deviceGroups || []).filter((d) => d.group_id === effectiveGroupId);
    const devices = groupDevices
      .map((d) => ({
        sn: String(d.sn),
        device_name: d.device_name || String(d.sn),
        status: d.status || 'unknown',
      }))
      .filter((d) => d.sn.length > 0)
      .sort((a, b) => a.device_name.localeCompare(b.device_name));

    const deviceSnInGroup =
      requestedDeviceSn && devices.some((d) => d.sn === requestedDeviceSn)
        ? requestedDeviceSn
        : null;

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

    if (!effectiveGroupId) {
      return NextResponse.json({
        groups,
        groupId: null,
        deviceSn: null,
        devices: [],
        hours,
        period,
        source: 'supabase',
        traffic: emptyTraffic,
        appFlow: [],
        groupTraffic,
        ssidActivity: [],
        radio,
        lastRollupAt,
        lastSyncedAt,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Live Ruijie extras only when explicitly requested — keeps Cached first paint fast.
    let ssidActivity: ReturnType<typeof aggregateSsidActivity> = [];
    let appFlow: Awaited<ReturnType<typeof getAppFlow>> = [];

    if (live) {
      try {
        const stas = await getGroupStaUsers(effectiveGroupId);
        ssidActivity = aggregateSsidActivity(stas);
      } catch {
        ssidActivity = [];
      }

      if (includeApps) {
        try {
          appFlow = await getAppFlow(effectiveGroupId);
        } catch {
          appFlow = [];
        }
      }

      const flowSn =
        deviceSnInGroup ||
        pickFlowDeviceSn(
          groupDevices.map((d) => ({ sn: d.sn, status: d.status, model: d.model }))
        );
      if (!flowSn) {
        return NextResponse.json(
          { error: 'No device available in group for live flow API' },
          { status: 404 }
        );
      }

      const trafficSummary = await getNetworkTraffic({ sn: flowSn, hours });

      return NextResponse.json({
        groups,
        groupId: effectiveGroupId,
        deviceSn: deviceSnInGroup,
        devices,
        flowSn,
        hours,
        period: { mode: 'hours' as const, hours },
        source: 'live',
        traffic: {
          ...trafficSummary,
          avgRxMbps: roundPercent(bpsToMbps(trafficSummary.avgRxRate)),
          avgTxMbps: roundPercent(bpsToMbps(trafficSummary.avgTxRate)),
        },
        appFlow,
        groupTraffic,
        ssidActivity,
        radio,
        lastRollupAt,
        lastSyncedAt,
        fetchedAt: new Date().toISOString(),
      });
    }

    const seriesRows = filterRollupsForScope(rollupsForCards, {
      groupId: effectiveGroupId,
      deviceSn: deviceSnInGroup,
    }).sort(
      (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
    );

    const traffic = trafficFromHourlyRollups(seriesRows);
    const groupLastRollupAt = maxIso(seriesRows.map((r) => r.captured_at)) ?? lastRollupAt;

    return NextResponse.json({
      groups,
      groupId: effectiveGroupId,
      deviceSn: deviceSnInGroup,
      devices,
      hours,
      period,
      source: 'supabase',
      traffic,
      appFlow: [],
      groupTraffic,
      ssidActivity: [],
      radio,
      lastRollupAt: groupLastRollupAt,
      lastSyncedAt,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AnalyticsAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
