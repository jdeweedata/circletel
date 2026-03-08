/**
 * Network Health Dashboard API
 *
 * GET /api/admin/network/health
 * Returns aggregated health data for the network health dashboard
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get all devices with latest health data
    const { data: devices, error: devicesError } = await supabase
      .from('ruijie_device_cache')
      .select('sn, device_name, group_name, customer_name, status, online_clients')
      .order('device_name');

    if (devicesError) {
      console.error('[HealthAPI] Failed to fetch devices:', devicesError);
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }

    // Get latest health snapshot for each device
    const { data: latestSnapshots, error: snapshotsError } = await supabase
      .from('device_health_snapshots')
      .select('device_sn, health_score, anomaly_detected, anomaly_type, captured_at')
      .gte('captured_at', twentyFourHoursAgo)
      .order('captured_at', { ascending: false });

    if (snapshotsError) {
      console.error('[HealthAPI] Failed to fetch snapshots:', snapshotsError);
    }

    // Group snapshots by device and get latest + anomaly count
    const deviceHealthMap: Record<
      string,
      {
        health_score: number;
        anomaly_count: number;
        last_anomaly_type: string | null;
        last_anomaly_at: string | null;
      }
    > = {};

    for (const snapshot of latestSnapshots || []) {
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

    // Get unacknowledged alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('network_health_alerts')
      .select('id, device_sn, alert_type, severity, message, acknowledged, created_at')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (alertsError) {
      console.error('[HealthAPI] Failed to fetch alerts:', alertsError);
    }

    // Enrich alerts with device names
    const enrichedAlerts = (alerts || []).map((alert) => {
      const device = devices?.find((d) => d.sn === alert.device_sn);
      return {
        ...alert,
        device_name: device?.device_name,
        customer_name: device?.customer_name,
      };
    });

    // Calculate overview stats
    const totalDevices = devices?.length || 0;
    const offlineDevices = devices?.filter((d) => d.status === 'offline').length || 0;
    const totalClients = devices?.reduce((sum, d) => sum + (d.online_clients || 0), 0) || 0;

    let healthyDevices = 0;
    let warningDevices = 0;
    let criticalDevices = 0;
    let totalHealthScore = 0;
    let devicesWithHealth = 0;

    // Build devices by health list
    const devicesByHealth = (devices || []).map((device) => {
      const healthData = deviceHealthMap[device.sn] || {
        health_score: device.status === 'online' ? 100 : 80,
        anomaly_count: 0,
        last_anomaly_type: null,
        last_anomaly_at: null,
      };

      const healthScore = healthData.health_score;

      if (healthScore >= 80) healthyDevices++;
      else if (healthScore >= 50) warningDevices++;
      else criticalDevices++;

      totalHealthScore += healthScore;
      devicesWithHealth++;

      return {
        sn: device.sn,
        device_name: device.device_name,
        group_name: device.group_name,
        customer_name: device.customer_name,
        status: device.status,
        online_clients: device.online_clients,
        health_score: healthScore,
        anomaly_count: healthData.anomaly_count,
        last_anomaly_type: healthData.last_anomaly_type,
        last_anomaly_at: healthData.last_anomaly_at,
      };
    });

    // Sort by health score (lowest first to highlight issues)
    devicesByHealth.sort((a, b) => a.health_score - b.health_score);

    // Get devices with recent anomalies
    const recentAnomalies = devicesByHealth
      .filter((d) => d.anomaly_count > 0)
      .sort((a, b) => {
        const aTime = a.last_anomaly_at ? new Date(a.last_anomaly_at).getTime() : 0;
        const bTime = b.last_anomaly_at ? new Date(b.last_anomaly_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);

    // Calculate anomalies in last 24h
    const anomaliesLast24h = Object.values(deviceHealthMap).reduce(
      (sum, d) => sum + d.anomaly_count,
      0
    );

    const overallScore =
      devicesWithHealth > 0 ? Math.round(totalHealthScore / devicesWithHealth) : 100;

    return NextResponse.json({
      overview: {
        overallScore,
        totalDevices,
        healthyDevices,
        warningDevices,
        criticalDevices,
        offlineDevices,
        totalClients,
        anomaliesLast24h,
      },
      devicesByHealth,
      unacknowledgedAlerts: enrichedAlerts,
      recentAnomalies,
    });
  } catch (error) {
    console.error('[HealthAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
