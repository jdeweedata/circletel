'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  AlertCircle,
  Clock,
  Users,
  RefreshCw,
  Plus,
  ChevronRight,
  Zap,
  Server,
  ArrowDownCircle
} from 'lucide-react';
import Link from 'next/link';

interface ProviderHealth {
  provider_name: string;
  status: 'up' | 'degraded' | 'down' | 'maintenance' | 'unknown';
  latency_ms: number | null;
  checked_at: string | null;
}

interface ConnectionEvent {
  id: string;
  customer_id: string;
  customer_name?: string;
  event_type: string;
  terminate_cause: string | null;
  created_at: string;
}

interface Outage {
  id: string;
  incident_number: string;
  title: string;
  severity: string;
  status: string;
  started_at: string;
  affected_customer_count: number;
}

interface NetworkOverview {
  providers: ProviderHealth[];
  activeSessionsCount: number;
  totalSubscribers: number;
  recentEvents: ConnectionEvent[];
  openOutages: Outage[];
  stats: {
    eventsToday: number;
    disconnectsToday: number;
    avgLatency: number | null;
  };
}

const statusConfig = {
  up: { color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', label: 'Operational' },
  degraded: { color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', label: 'Degraded' },
  down: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Down' },
  maintenance: { color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', label: 'Maintenance' },
  unknown: { color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50', label: 'Unknown' }
};

const severityConfig = {
  minor: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  major: { color: 'bg-orange-100 text-orange-800 border-orange-300' },
  critical: { color: 'bg-red-100 text-red-800 border-red-300' }
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatProviderName(name: string): string {
  const names: Record<string, string> = {
    interstellio: 'Interstellio',
    mtn: 'MTN',
    openserve: 'Openserve',
    telkom: 'Telkom'
  };
  return names[name.toLowerCase()] || name;
}

export default function NetworkDashboardPage() {
  const [data, setData] = useState<NetworkOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch('/api/admin/network/overview');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load network data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error || 'No data available'}</p>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  const allProvidersUp = data.providers.every(p => p.status === 'up' || p.status === 'unknown');
  const hasOpenOutages = data.openOutages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Operations</h1>
          <p className="text-gray-500 mt-1">Monitor provider health, connections, and incidents</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/network/outages/new">
            <Button size="sm" className="bg-circleTel-orange hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Declare Outage
            </Button>
          </Link>
        </div>
      </div>

      {/* System Status Banner */}
      <Card className={`border-2 ${allProvidersUp && !hasOpenOutages ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {allProvidersUp && !hasOpenOutages ? (
              <>
                <div className="p-2 bg-green-100 rounded-full">
                  <Wifi className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">All Systems Operational</p>
                  <p className="text-sm text-green-600">No active incidents</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">
                    {hasOpenOutages ? `${data.openOutages.length} Active Incident${data.openOutages.length > 1 ? 's' : ''}` : 'System Issues Detected'}
                  </p>
                  <p className="text-sm text-yellow-600">
                    {data.providers.filter(p => p.status !== 'up' && p.status !== 'unknown').length} provider(s) affected
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalSubscribers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Events Today</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.eventsToday}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Disconnects Today</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.disconnectsToday}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ArrowDownCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Latency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.avgLatency ? `${data.stats.avgLatency}ms` : '--'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5" />
              Provider Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.providers.map((provider) => {
                const config = statusConfig[provider.status];
                return (
                  <div
                    key={provider.provider_name}
                    className={`flex items-center justify-between p-3 rounded-lg ${config.bg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <span className="font-medium text-gray-900">
                        {formatProviderName(provider.provider_name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {provider.latency_ms && (
                        <span className="text-sm text-gray-500">{provider.latency_ms}ms</span>
                      )}
                      <Badge variant="outline" className={config.text}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Open Outages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Incidents
              </CardTitle>
              <Link href="/admin/network/outages">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.openOutages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active incidents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.openOutages.map((outage) => (
                  <Link
                    key={outage.id}
                    href={`/admin/network/outages/${outage.id}`}
                    className="block"
                  >
                    <div className="flex items-start justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={severityConfig[outage.severity as keyof typeof severityConfig]?.color}
                          >
                            {outage.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">{outage.incident_number}</span>
                        </div>
                        <p className="font-medium text-gray-900 mt-1">{outage.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(outage.started_at)}
                          </span>
                          {outage.affected_customer_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {outage.affected_customer_count} affected
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Connection Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent events</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Event</th>
                    <th className="pb-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentEvents.slice(0, 10).map((event) => (
                    <tr key={event.id} className="text-sm">
                      <td className="py-3 text-gray-500">
                        {formatRelativeTime(event.created_at)}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/admin/customers/${event.customer_id}`}
                          className="text-circleTel-orange hover:underline"
                        >
                          {event.customer_name || 'Unknown'}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            event.event_type === 'connected'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : event.event_type === 'disconnected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {event.event_type}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-500">
                        {event.terminate_cause || '--'}
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
