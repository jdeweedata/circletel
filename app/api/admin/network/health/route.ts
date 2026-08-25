/**
 * Network Health Dashboard API
 *
 * GET /api/admin/network/health
 * System Health aggregate payload for WiFi (Ruijie) fleet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import {
  bpsToMbps,
  buildDailyUptimeSeries,
  classifyDeviceRole,
  computeFleetOverview,
  computeNetworkInventory,
  roundPercent,
} from '@/lib/network/performance-aggregates';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabase = await createClient();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: devices, error: devicesError } = await supabase
      .from('ruijie_device_cache')
      .select(
        'sn, device_name, model, group_name, customer_name, status, online_clients, cpu_usage, memory_usage, radio_2g_utilization, radio_5g_utilization, management_ip, wan_ip, synced_at, last_seen_at'
      )
      .order('device_name');

    if (devicesError) {
      console.error('[HealthAPI] Failed to fetch devices:', devicesError);
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }

    const { data: latestSnapshots, error: snapshotsError } = await supabase
      .from('device_health_snapshots')
      .select('device_sn, health_score, anomaly_detected, anomaly_type, status, captured_at')
      .gte('captured_at', thirtyDaysAgo)
      .order('captured_at', { ascending: false });

    if (snapshotsError) {
      console.error('[HealthAPI] Failed to fetch snapshots:', snapshotsError);
    }

    const deviceHealthMap: Record<
      string,
      {
        health_score: number;
        anomaly_count: number;
        last_anomaly_type: string | null;
        last_anomaly_at: string | null;
      }
    > = {};

    const snapshots24h = (latestSnapshots || []).filter((s) => s.captured_at >= twentyFourHoursAgo);
    const snapshotsPriorDay = (latestSnapshots || []).filter(
      (s) => s.captured_at >= fortyEightHoursAgo && s.captured_at < twentyFourHoursAgo
    );

    for (const snapshot of snapshots24h) {
      if (!deviceHealthMap[snapshot.device_sn]) {
        deviceHealthMap[snapshot.device_sn] = {
          health_score: snapshot.health_score,
          anomaly_count: 0,
          last_anomaly_type: null,
          last_anomaly_at: null,
        };
      }

      if (snapshot.anomaly_detected) {
        deviceHealthMap[snapshot.device_sn].anomaly_count++;
        if (!deviceHealthMap[snapshot.device_sn].last_anomaly_type) {
          deviceHealthMap[snapshot.device_sn].last_anomaly_type = snapshot.anomaly_type;
          deviceHealthMap[snapshot.device_sn].last_anomaly_at = snapshot.captured_at;
        }
      }
    }

    let priorOnline = 0;
    let priorTotal = 0;
    for (const snap of snapshotsPriorDay) {
      priorTotal += 1;
      if (snap.status === 'online') priorOnline += 1;
    }
    const priorOnlineRate =
      priorTotal > 0 ? roundPercent((priorOnline / priorTotal) * 100) : null;

    const fleetDevices = (devices || []).map((d) => ({
      sn: d.sn,
      status: d.status,
      online_clients: d.online_clients || 0,
      cpu_usage: d.cpu_usage,
      memory_usage: d.memory_usage,
      radio_2g_utilization: d.radio_2g_utilization,
      radio_5g_utilization: d.radio_5g_utilization,
    }));

    const overviewBase = computeFleetOverview({
      devices: fleetDevices,
      healthBySn: deviceHealthMap,
      priorOnlineRate,
    });

    const { data: alerts, error: alertsError } = await supabase
      .from('network_health_alerts')
      .select('id, device_sn, alert_type, severity, message, acknowledged, created_at')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (alertsError) {
      console.error('[HealthAPI] Failed to fetch alerts:', alertsError);
    }

    const enrichedAlerts = (alerts || []).map((alert) => {
      const device = devices?.find((d) => d.sn === alert.device_sn);
      return {
        ...alert,
        device_name: device?.device_name,
        customer_name: device?.customer_name,
      };
    });

    const devicesByHealth = (devices || []).map((device) => {
      const healthData = deviceHealthMap[device.sn] || {
        health_score: device.status === 'online' ? 100 : 40,
        anomaly_count: 0,
        last_anomaly_type: null,
        last_anomaly_at: null,
      };

      return {
        sn: device.sn,
        device_name: device.device_name,
        model: device.model,
        group_name: device.group_name,
        customer_name: device.customer_name,
        status: device.status,
        online_clients: device.online_clients,
        health_score: healthData.health_score,
        anomaly_count: healthData.anomaly_count,
        last_anomaly_type: healthData.last_anomaly_type,
        last_anomaly_at: healthData.last_anomaly_at,
        synced_at: device.synced_at,
        last_seen_at: device.last_seen_at,
      };
    });

    devicesByHealth.sort((a, b) => a.health_score - b.health_score);

    const recentAnomalies = devicesByHealth
      .filter((d) => d.anomaly_count > 0)
      .sort((a, b) => {
        const aTime = a.last_anomaly_at ? new Date(a.last_anomaly_at).getTime() : 0;
        const bTime = b.last_anomaly_at ? new Date(b.last_anomaly_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);

    const uptimeSeries = buildDailyUptimeSeries({
      days: 30,
      now,
      snapshots: (latestSnapshots || []).map((s) => ({
        device_sn: s.device_sn,
        status: s.status,
        captured_at: s.captured_at,
      })),
      deviceCount: overviewBase.totalDevices,
    });

    const { data: trafficRows, error: trafficError } = await supabase
      .from('ruijie_traffic_rollups')
      .select(
        'group_id, group_name, captured_at, avg_rx_bps, avg_tx_bps, peak_rx_bps, peak_tx_bps, total_rx_bytes, total_tx_bytes'
      )
      // Exclude legacy group blobs so they do not double-count against
      // per-device rows during the retention overlap (#702).
      .neq('device_sn', '__legacy_group__')
      .gte('captured_at', twentyFourHoursAgo)
      .order('captured_at', { ascending: true });

    if (trafficError) {
      console.error('[HealthAPI] Failed to fetch traffic rollups:', trafficError);
    }

    // Aggregate all groups per timestamp for fleet bandwidth series
    const bandwidthByTs = new Map<
      string,
      { rx: number; tx: number; count: number }
    >();
    for (const row of trafficRows || []) {
      const key = row.captured_at;
      const existing = bandwidthByTs.get(key) || { rx: 0, tx: 0, count: 0 };
      existing.rx += row.avg_rx_bps || 0;
      existing.tx += row.avg_tx_bps || 0;
      existing.count += 1;
      bandwidthByTs.set(key, existing);
    }

    const bandwidthSeries = Array.from(bandwidthByTs.entries()).map(([captured_at, v]) => ({
      captured_at,
      avgRxMbps: roundPercent(bpsToMbps(v.rx)),
      avgTxMbps: roundPercent(bpsToMbps(v.tx)),
      avgThroughputMbps: roundPercent(bpsToMbps(v.rx + v.tx)),
    }));

    const latestBandwidth = bandwidthSeries[bandwidthSeries.length - 1] || null;
    const priorBandwidth =
      bandwidthSeries.length > 1 ? bandwidthSeries[bandwidthSeries.length - 2] : null;
    const throughputDelta =
      latestBandwidth && priorBandwidth && priorBandwidth.avgThroughputMbps > 0
        ? roundPercent(
            ((latestBandwidth.avgThroughputMbps - priorBandwidth.avgThroughputMbps) /
              priorBandwidth.avgThroughputMbps) *
              100
          )
        : null;

    const failedShare = roundPercent(
      100 - overviewBase.successRatePercent
    );

    const inventory = computeNetworkInventory(
      (devices || []).map((d) => ({
        sn: d.sn,
        device_name: d.device_name,
        model: d.model,
        status: d.status,
        online_clients: d.online_clients || 0,
        cpu_usage: d.cpu_usage,
        memory_usage: d.memory_usage,
        radio_2g_utilization: d.radio_2g_utilization,
        radio_5g_utilization: d.radio_5g_utilization,
        management_ip: d.management_ip,
        wan_ip: d.wan_ip,
        synced_at: d.synced_at,
      }))
    );

    const edge = inventory.edgeDevice;
    const edgeDevice = edge
      ? {
          sn: edge.sn,
          device_name: edge.device_name,
          model: edge.model ?? null,
          status: edge.status,
          role: classifyDeviceRole(edge.model, edge.device_name),
          online_clients: edge.online_clients,
          cpu_usage: edge.cpu_usage ?? null,
          memory_usage: edge.memory_usage ?? null,
          radio_2g_utilization: edge.radio_2g_utilization ?? null,
          radio_5g_utilization: edge.radio_5g_utilization ?? null,
          management_ip: edge.management_ip ?? null,
          wan_ip: edge.wan_ip ?? null,
          synced_at: edge.synced_at ?? null,
        }
      : null;

    return NextResponse.json({
      overview: {
        overallScore: overviewBase.overallScore,
        totalDevices: overviewBase.totalDevices,
        healthyDevices: overviewBase.healthyDevices,
        warningDevices: overviewBase.warningDevices,
        criticalDevices: overviewBase.criticalDevices,
        offlineDevices: overviewBase.offlineDevices,
        onlineDevices: overviewBase.onlineDevices,
        totalClients: overviewBase.totalClients,
        anomaliesLast24h: overviewBase.anomaliesLast24h,
        uptimePercent: overviewBase.uptimePercent,
        uptimeDeltaVsPrior: overviewBase.uptimeDeltaVsPrior,
        successRatePercent: overviewBase.successRatePercent,
        failedSharePercent: failedShare,
        responseConsistencyPercent: overviewBase.responseConsistencyPercent,
        resources: {
          avgCpu: overviewBase.resources.avgCpu == null ? null : roundPercent(overviewBase.resources.avgCpu),
          avgMemory:
            overviewBase.resources.avgMemory == null
              ? null
              : roundPercent(overviewBase.resources.avgMemory),
          avgRadio:
            overviewBase.resources.avgRadio == null
              ? null
              : roundPercent(overviewBase.resources.avgRadio),
          updatedAt:
            devices?.reduce<string | null>((latest, d) => {
              if (!d.synced_at) return latest;
              if (!latest || d.synced_at > latest) return d.synced_at;
              return latest;
            }, null) ?? null,
        },
        bandwidth: {
          avgThroughputMbps: latestBandwidth?.avgThroughputMbps ?? null,
          avgRxMbps: latestBandwidth?.avgRxMbps ?? null,
          avgTxMbps: latestBandwidth?.avgTxMbps ?? null,
          deltaPercent: throughputDelta,
        },
      },
      inventory: {
        gateway: inventory.gateway,
        ap: inventory.ap,
        switch: { online: inventory.switchOnline, total: inventory.switchTotal },
        client: inventory.client,
        guest: inventory.guest,
      },
      edgeDevice,
      uptimeSeries,
      bandwidthSeries,
      devicesByHealth,
      unacknowledgedAlerts: enrichedAlerts,
      recentAnomalies,
    });
  } catch (error) {
    console.error('[HealthAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
