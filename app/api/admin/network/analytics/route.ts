/**
 * Network Analytics API (Supabase-backed + live Ruijie)
 *
 * GET /api/admin/network/analytics
 * Query: groupId (optional), hours (default 24, max 168), live=true, includeApps
 *
 * Returns rollup throughput, app-flow, group traffic cards, SSID STA activity,
 * and radio util from device cache (honest empty when missing).
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

    const { data: deviceGroups } = await supabase
      .from('ruijie_device_cache')
      .select(
        'group_id, group_name, sn, device_name, status, model, radio_2g_utilization, radio_5g_utilization, radio_2g_channel, radio_5g_channel'
      )
      .not('group_id', 'is', null);

    const groupMap = new Map<string, string>();
    for (const row of deviceGroups || []) {
      if (row.group_id && !groupMap.has(row.group_id)) {
        groupMap.set(row.group_id, row.group_name || row.group_id);
      }
    }
    const groups = Array.from(groupMap.entries()).map(([id, name]) => ({ id, name }));
    const effectiveGroupId = groupId || groups[0]?.id || null;

    // Group traffic cards from all rollups in window
    const { data: allRollups } = await supabase
      .from('ruijie_traffic_rollups')
      .select(
        'group_id, group_name, total_rx_bytes, total_tx_bytes, captured_at'
      )
      .gte('captured_at', since);

    const groupTraffic = computeGroupTrafficCards(allRollups || []);

    const groupDevices = (deviceGroups || []).filter(
      (d) => d.group_id === effectiveGroupId
    );
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

    let ssidActivity: ReturnType<typeof aggregateSsidActivity> = [];
    if (effectiveGroupId) {
      try {
        const stas = await getGroupStaUsers(effectiveGroupId);
        ssidActivity = aggregateSsidActivity(stas);
      } catch {
        ssidActivity = [];
      }
    }

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
        fetchedAt: new Date().toISOString(),
      });
    }

    let appFlow: Awaited<ReturnType<typeof getAppFlow>> = [];
    if (includeApps) {
      try {
        appFlow = await getAppFlow(effectiveGroupId);
      } catch {
        appFlow = [];
      }
    }

    if (live) {
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
        fetchedAt: new Date().toISOString(),
      });
    }

    const { data: rollups, error } = await supabase
      .from('ruijie_traffic_rollups')
      .select(
        'group_id, group_name, captured_at, hours_window, total_rx_bytes, total_tx_bytes, avg_rx_bps, avg_tx_bps, peak_rx_bps, peak_tx_bps, raw_summary'
      )
      .eq('group_id', effectiveGroupId)
      .gte('captured_at', since)
      .order('captured_at', { ascending: true });

    if (error) {
      console.error('[AnalyticsAPI] Failed to fetch rollups:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const dataPoints = (rollups || []).map((row) => ({
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
      rollups && rollups.length > 0
        ? rollups.reduce((s, r) => s + (r.avg_rx_bps || 0), 0) / rollups.length
        : 0;
    const avgTxRate =
      rollups && rollups.length > 0
        ? rollups.reduce((s, r) => s + (r.avg_tx_bps || 0), 0) / rollups.length
        : 0;

    return NextResponse.json({
      groups,
      groupId: effectiveGroupId,
      hours,
      source: 'supabase',
      traffic: {
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
      },
      appFlow,
      groupTraffic,
      ssidActivity,
      radio,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AnalyticsAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
