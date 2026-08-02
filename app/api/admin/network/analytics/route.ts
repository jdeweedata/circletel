/**
 * Network Analytics API (Supabase-backed + live Ruijie)
 *
 * GET /api/admin/network/analytics
 * Query: groupId (optional), hours (default 24, max 168), live=true, includeApps
 *
 * Cache-first (default): traffic KPIs/series + group cards from ruijie_traffic_rollups
 * (hours_window=1). Radio from device cache. No live Ruijie calls.
 *
 * Live (?live=true): traffic + optional app-flow + STA from Ruijie (10s timeout).
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
  HOURLY_ROLLUP_WINDOW,
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
    const hours = Math.min(parseInt(searchParams.get('hours') || '24', 10), 168);
    const live = searchParams.get('live') === 'true';
    const includeApps = searchParams.get('includeApps') !== 'false';

    const supabase = await createClient();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

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

    // Prefer hours_window=1 (true hourly samples). Fall back to legacy window blobs.
    const { data: hourlyRollups } = await supabase
      .from('ruijie_traffic_rollups')
      .select(
        'group_id, group_name, total_rx_bytes, total_tx_bytes, captured_at, hours_window, avg_rx_bps, avg_tx_bps, peak_rx_bps, peak_tx_bps, raw_summary'
      )
      .eq('hours_window', HOURLY_ROLLUP_WINDOW)
      // Legacy group blobs would double-count against per-device rows for the
      // 14-day retention overlap (#702).
      .neq('device_sn', '__legacy_group__')
      .gte('captured_at', since)
      .order('captured_at', { ascending: true });

    const usingHourlySeries = (hourlyRollups || []).length > 0;
    let rollupsForCards = (hourlyRollups || []) as RollupRow[];

    if (!usingHourlySeries) {
      const { data: legacyRollups } = await supabase
        .from('ruijie_traffic_rollups')
        .select(
          'group_id, group_name, total_rx_bytes, total_tx_bytes, captured_at, hours_window, avg_rx_bps, avg_tx_bps, peak_rx_bps, peak_tx_bps, raw_summary'
        )
        .gte('captured_at', since)
        .order('captured_at', { ascending: true });

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

    const groupTraffic = computeGroupTrafficCards(rollupsForCards);
    const lastRollupAt = maxIso([
      ...rollupsForCards.map((r) => r.captured_at),
      ...groupTraffic.map((g) => g.lastCapturedAt),
    ]);

    const groupDevices = (deviceGroups || []).filter((d) => d.group_id === effectiveGroupId);
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
        hours,
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

      const flowSn = pickFlowDeviceSn(
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
        flowSn,
        hours,
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

    const seriesRows = rollupsForCards
      .filter((row) => row.group_id === effectiveGroupId)
      .sort(
        (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
      );

    const traffic = trafficFromHourlyRollups(seriesRows);
    const groupLastRollupAt = maxIso(seriesRows.map((r) => r.captured_at)) ?? lastRollupAt;

    return NextResponse.json({
      groups,
      groupId: effectiveGroupId,
      hours,
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
