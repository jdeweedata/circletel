'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiCpuBold,
  PiMemoryBold,
  PiBroadcastBold,
  PiWarningCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  MetricCard,
  DotMatrixChart,
  SegmentedBar,
  ResourceUsageList,
  BandwidthChart,
  DevicesMonitorTable,
  NetworkOverviewTiles,
  PendingAlertsCard,
  EdgeDeviceCard,
  type NetworkInventory,
  type EdgeDeviceInfo,
} from '@/components/admin/network/performance';

type HealthOverview = {
  overallScore: number;
  totalDevices: number;
  healthyDevices: number;
  warningDevices: number;
  criticalDevices: number;
  offlineDevices: number;
  onlineDevices: number;
  totalClients: number;
  anomaliesLast24h: number;
  uptimePercent: number;
  uptimeDeltaVsPrior: number | null;
  successRatePercent: number;
  failedSharePercent: number;
  responseConsistencyPercent: number;
  resources: {
    avgCpu: number | null;
    avgMemory: number | null;
    avgRadio: number | null;
    updatedAt: string | null;
  };
  bandwidth: {
    avgThroughputMbps: number | null;
    avgRxMbps: number | null;
    avgTxMbps: number | null;
    deltaPercent: number | null;
  };
};

type DeviceRow = {
  sn: string;
  device_name: string;
  model?: string | null;
  group_name: string | null;
  customer_name: string | null;
  status: string;
  online_clients: number;
  health_score: number;
  anomaly_count: number;
  last_anomaly_type: string | null;
  last_anomaly_at: string | null;
  synced_at?: string | null;
  last_seen_at?: string | null;
};

type HealthAlert = {
  id: string;
  device_sn: string;
  device_name?: string;
  customer_name?: string;
  alert_type: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
};

type HealthDashboardData = {
  overview: HealthOverview;
  inventory?: NetworkInventory;
  edgeDevice?: EdgeDeviceInfo | null;
  uptimeSeries: Array<{ date: string; uptimePercent: number; sampleCount: number }>;
  bandwidthSeries: Array<{
    captured_at: string;
    avgRxMbps: number;
    avgTxMbps: number;
    avgThroughputMbps: number;
  }>;
  devicesByHealth: DeviceRow[];
  unacknowledgedAlerts: HealthAlert[];
  recentAnomalies: DeviceRow[];
};

function formatDelta(delta: number | null, suffix = ''): string | null {
  if (delta == null) return null;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}%${suffix}`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function NetworkHealthPage() {
  const [data, setData] = useState<HealthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch('/api/admin/network/health', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch health data');
      setData(await response.json());
      setError(null);
    } catch (err) {
      setError('Failed to load health data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledging(alertId);
    try {
      const response = await fetch(`/api/admin/network/health/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      await fetchData();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <PiWarningCircleBold className="w-12 h-12 text-red-500" />
        <p className="text-slate-600">{error || 'No data available'}</p>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  const {
    overview,
    uptimeSeries,
    bandwidthSeries,
    devicesByHealth,
    unacknowledgedAlerts,
    inventory,
    edgeDevice,
  } = data;
  const uptimeDelta = formatDelta(overview.uptimeDeltaVsPrior, ' vs prior 24h');
  const throughputDelta = formatDelta(overview.bandwidth.deltaPercent, ' from last sample');
  const inventorySafe: NetworkInventory = inventory ?? {
    gateway: 0,
    ap: overview.totalDevices,
    switch: { online: 0, total: 0 },
    client: overview.totalClients,
    guest: null,
  };

  return (
    <div className="space-y-6 -mx-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Activity / Infrastructure / System Health</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">System Health</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Aggregate Ruijie Wi-Fi performance from Supabase · {overview.totalDevices} devices ·{' '}
            {overview.totalClients} clients online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/analytics">Open Analytics</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Omada-inspired overview row */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-4">
          <EdgeDeviceCard device={edgeDevice ?? null} />
          <PendingAlertsCard
            alerts={unacknowledgedAlerts}
            acknowledging={acknowledging}
            onAcknowledge={handleAcknowledge}
          />
        </div>
        <NetworkOverviewTiles inventory={inventorySafe} />
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Service Availability"
          value={`${overview.uptimePercent.toFixed(2)}%`}
          subtitle="Overall Uptime"
          delta={uptimeDelta}
          deltaPositive={
            overview.uptimeDeltaVsPrior == null ? null : overview.uptimeDeltaVsPrior >= 0
          }
        >
          <DotMatrixChart values={uptimeSeries.map((d) => d.uptimePercent)} />
        </MetricCard>

        <MetricCard
          title="Request Success Rate"
          value={`${overview.successRatePercent.toFixed(2)}%`}
          subtitle="Avg. healthy device share"
          delta={`${overview.healthyDevices} healthy · ${overview.warningDevices + overview.criticalDevices + overview.offlineDevices} degraded`}
        >
          <SegmentedBar
            successPercent={overview.successRatePercent}
            failedPercent={overview.failedSharePercent}
            successLabel="Healthy devices"
            failedLabel="Degraded / offline"
          />
        </MetricCard>

        <MetricCard
          title="Response Stability"
          value={`${overview.responseConsistencyPercent.toFixed(2)}%`}
          subtitle={
            overview.responseConsistencyPercent >= 80
              ? 'Stable within normal threshold'
              : 'Below consistency threshold'
          }
        >
          <BandwidthChart
            data={bandwidthSeries}
            bare
            variant="area"
            height={120}
          />
        </MetricCard>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResourceUsageList
          title="Resource Usage"
          subtitle={`Average resource utilization ${
            overview.resources.avgCpu == null
              ? '—'
              : (
                  ((overview.resources.avgCpu || 0) +
                    (overview.resources.avgMemory || 0) +
                    (overview.resources.avgRadio || 0)) /
                  3
                ).toFixed(1)
          }% · Updated ${formatRelative(overview.resources.updatedAt)}`}
          rows={[
            {
              key: 'cpu',
              label: 'CPU',
              value: overview.resources.avgCpu,
              icon: <PiCpuBold className="w-4 h-4" />,
            },
            {
              key: 'radio',
              label: 'Radio util',
              value: overview.resources.avgRadio,
              icon: <PiBroadcastBold className="w-4 h-4" />,
            },
            {
              key: 'memory',
              label: 'Memory',
              value: overview.resources.avgMemory,
              icon: <PiMemoryBold className="w-4 h-4" />,
            },
          ]}
        />

        <div className="space-y-3">
          <MetricCard
            title="Network Bandwidth"
            value={
              overview.bandwidth.avgThroughputMbps == null
                ? '—'
                : `${overview.bandwidth.avgThroughputMbps.toFixed(0)} Mbps`
            }
            subtitle="Average Throughput"
            delta={throughputDelta}
            deltaPositive={
              overview.bandwidth.deltaPercent == null
                ? null
                : overview.bandwidth.deltaPercent >= 0
            }
            className="h-full"
          >
            <BandwidthChart data={bandwidthSeries} bare height={160} />
          </MetricCard>
        </div>
      </div>

      <DevicesMonitorTable rows={devicesByHealth} />
    </div>
  );
}
