'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiArrowsClockwiseBold,
  PiHeartbeatBold,
  PiWarningBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiCaretRightBold,
  PiClockBold,
  PiWifiHighBold,
  PiTrendUpBold,
  PiTrendDownBold,
  PiWarningCircleBold,
  PiUsersBold,
} from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface NetworkHealthOverview {
  overallScore: number;
  totalDevices: number;
  healthyDevices: number;
  warningDevices: number;
  criticalDevices: number;
  offlineDevices: number;
  totalClients: number;
  anomaliesLast24h: number;
}

interface DeviceHealthSummary {
  sn: string;
  device_name: string;
  group_name: string | null;
  customer_name: string | null;
  status: string;
  online_clients: number;
  health_score: number;
  anomaly_count: number;
  last_anomaly_type: string | null;
  last_anomaly_at: string | null;
}

interface HealthAlert {
  id: string;
  device_sn: string;
  device_name?: string;
  customer_name?: string;
  alert_type: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

interface HealthDashboardData {
  overview: NetworkHealthOverview;
  devicesByHealth: DeviceHealthSummary[];
  unacknowledgedAlerts: HealthAlert[];
  recentAnomalies: DeviceHealthSummary[];
}

// =============================================================================
// HELPERS
// =============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'Warning';
  return 'Critical';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
}

function getAnomalyIcon(type: string | null) {
  switch (type) {
    case 'client_spike':
      return <PiTrendUpBold className="w-4 h-4 text-orange-500" />;
    case 'client_drop':
      return <PiTrendDownBold className="w-4 h-4 text-red-500" />;
    case 'offline_flap':
      return <PiWarningCircleBold className="w-4 h-4 text-red-500" />;
    default:
      return <PiWarningBold className="w-4 h-4 text-yellow-500" />;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NetworkHealthPage() {
  const [data, setData] = useState<HealthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch('/api/admin/network/health', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch health data');

      const result = await response.json();
      setData(result);
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
    const interval = setInterval(() => fetchData(), 60000); // Refresh every minute
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
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <PiWarningCircleBold className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error || 'No data available'}</p>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  const { overview, devicesByHealth, unacknowledgedAlerts, recentAnomalies } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Health</h1>
          <p className="text-gray-500 mt-1">
            Proactive device monitoring and anomaly detection
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <PiArrowsClockwiseBold
            className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Health Score Banner */}
      <Card
        className={`border-2 ${
          overview.overallScore >= 80
            ? 'border-green-200 bg-green-50'
            : overview.overallScore >= 50
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-red-200 bg-red-50'
        }`}
      >
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-4 rounded-full ${
                  overview.overallScore >= 80
                    ? 'bg-green-100'
                    : overview.overallScore >= 50
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                }`}
              >
                <PiHeartbeatBold
                  className={`w-8 h-8 ${
                    overview.overallScore >= 80
                      ? 'text-green-600'
                      : overview.overallScore >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Network Health</p>
                <p
                  className={`text-4xl font-bold ${
                    overview.overallScore >= 80
                      ? 'text-green-700'
                      : overview.overallScore >= 50
                        ? 'text-yellow-700'
                        : 'text-red-700'
                  }`}
                >
                  {overview.overallScore}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {overview.anomaliesLast24h} anomalies in last 24h
              </p>
              <p className="text-sm text-gray-500">
                {overview.totalClients.toLocaleString()} connected clients
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalDevices}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <PiWifiHighBold className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Healthy</p>
                <p className="text-2xl font-bold text-green-600">
                  {overview.healthyDevices}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <PiCheckCircleBold className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {overview.warningDevices}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <PiWarningBold className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {overview.criticalDevices}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <PiXCircleBold className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Offline</p>
                <p className="text-2xl font-bold text-gray-600">
                  {overview.offlineDevices}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <PiWifiHighBold className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unacknowledged Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <PiWarningBold className="w-5 h-5 text-red-500" />
                Active Alerts
                {unacknowledgedAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unacknowledgedAlerts.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {unacknowledgedAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PiCheckCircleBold className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {unacknowledgedAlerts.slice(0, 10).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={getSeverityColor(alert.severity)}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(alert.created_at)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">
                        {alert.device_name || alert.device_sn}
                      </p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      {alert.customer_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          Customer: {alert.customer_name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledging === alert.id}
                      className="ml-2 shrink-0"
                    >
                      {acknowledging === alert.id ? 'Ack...' : 'Ack'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Anomalies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PiTrendDownBold className="w-5 h-5" />
              Recent Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnomalies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PiCheckCircleBold className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>No recent anomalies detected</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentAnomalies.map((device) => (
                  <Link
                    key={device.sn}
                    href={`/admin/network/devices/${device.sn}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getAnomalyIcon(device.last_anomaly_type)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {device.device_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {device.customer_name || device.group_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={getHealthColor(device.health_score)}
                        >
                          {device.health_score}%
                        </Badge>
                        {device.last_anomaly_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(device.last_anomaly_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Devices by Health Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <PiHeartbeatBold className="w-5 h-5" />
              Device Health Rankings
            </CardTitle>
            <Link href="/admin/network/devices">
              <Button variant="ghost" size="sm">
                View All <PiCaretRightBold className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {devicesByHealth.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <PiHeartbeatBold className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No health data available yet</p>
              <p className="text-sm mt-1">Health snapshots will appear after the next sync</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Device</th>
                    <th className="pb-3 font-medium">Customer/Group</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Clients</th>
                    <th className="pb-3 font-medium">Health</th>
                    <th className="pb-3 font-medium">Anomalies (24h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {devicesByHealth.slice(0, 20).map((device) => (
                    <tr key={device.sn} className="text-sm">
                      <td className="py-3">
                        <Link
                          href={`/admin/network/devices/${device.sn}`}
                          className="text-circleTel-orange hover:underline font-medium"
                        >
                          {device.device_name}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-600">
                        {device.customer_name || device.group_name || '--'}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            device.status === 'online'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {device.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <PiUsersBold className="w-4 h-4 text-gray-400" />
                          {device.online_clients}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={getHealthColor(device.health_score)}
                        >
                          {device.health_score}% - {getHealthLabel(device.health_score)}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {device.anomaly_count > 0 ? (
                          <span className="flex items-center gap-1">
                            {getAnomalyIcon(device.last_anomaly_type)}
                            <span className="text-gray-600">{device.anomaly_count}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
