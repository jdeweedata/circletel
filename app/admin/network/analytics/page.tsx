'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiArrowsClockwiseBold,
  PiChartLineBold,
  PiArrowDownBold,
  PiArrowUpBold,
  PiClockBold,
  PiWifiHighBold,
  PiLightningBold,
  PiDatabaseBold,
} from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrafficChart, AppFlowChart, formatBytes, formatBps } from '@/components/admin/network/TrafficChart';

// =============================================================================
// TYPES
// =============================================================================

interface TrafficDataPoint {
  timestamp: number;
  timeString: string;
  rxBytes: number;
  txBytes: number;
  rxPkts: number;
  txPkts: number;
  buildingId: number;
}

interface TrafficSummary {
  totalRxBytes: number;
  totalTxBytes: number;
  totalBytes: number;
  avgRxRate: number;
  avgTxRate: number;
  peakRxBytes: number;
  peakTxBytes: number;
  dataPoints: TrafficDataPoint[];
}

interface AppFlowData {
  appGroupName: string;
  appName: string;
  downFlow: number;
  upFlow: number;
  upDownFlow: number;
}

interface TrafficApiResponse {
  groupId: string;
  hours: number;
  traffic: TrafficSummary;
  appFlow?: AppFlowData[];
  fetchedAt: string;
}

interface NetworkGroup {
  id: number;
  name: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NetworkAnalyticsPage() {
  const [data, setData] = useState<TrafficApiResponse | null>(null);
  const [groups, setGroups] = useState<NetworkGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedHours, setSelectedHours] = useState<string>('24');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available groups
  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/ruijie/devices', {
        credentials: 'include',
      });
      if (!response.ok) return;

      const result = await response.json();
      const devices = result.devices || [];

      // Extract unique groups from devices
      const groupMap = new Map<number, string>();
      for (const device of devices) {
        if (device.group_id && device.group_name) {
          groupMap.set(parseInt(device.group_id, 10), device.group_name);
        }
      }

      const groupList = Array.from(groupMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));

      setGroups(groupList);

      // Select first group if none selected
      if (groupList.length > 0 && !selectedGroupId) {
        setSelectedGroupId(String(groupList[0].id));
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, [selectedGroupId]);

  // Fetch traffic data
  const fetchTrafficData = useCallback(async (isRefresh = false) => {
    if (!selectedGroupId) {
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        groupId: selectedGroupId,
        hours: selectedHours,
        includeApps: 'true',
      });

      const response = await fetch(`/api/ruijie/traffic?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch traffic data');
      }

      const result: TrafficApiResponse = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load traffic data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGroupId, selectedHours]);

  // Initial load
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch data when group or time range changes
  useEffect(() => {
    if (selectedGroupId) {
      fetchTrafficData();
    }
  }, [selectedGroupId, selectedHours, fetchTrafficData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!selectedGroupId) return;
    const interval = setInterval(() => fetchTrafficData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedGroupId, fetchTrafficData]);

  const selectedGroup = groups.find(g => String(g.id) === selectedGroupId);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandwidth Analytics</h1>
          <p className="text-gray-500 mt-1">
            Network traffic monitoring and application usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Group Selector */}
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select network group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={String(group.id)}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Range Selector */}
          <Select value={selectedHours} onValueChange={setSelectedHours}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 hours</SelectItem>
              <SelectItem value="12">Last 12 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="48">Last 2 days</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTrafficData(true)}
            disabled={refreshing || !selectedGroupId}
          >
            <PiArrowsClockwiseBold
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* No Group Selected */}
      {!selectedGroupId && groups.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <PiWifiHighBold className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No network groups found</p>
            <p className="text-sm text-gray-500 mt-1">
              Sync devices first to view traffic analytics
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Download</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatBytes(data.traffic.totalRxBytes)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Avg: {formatBps(data.traffic.avgRxRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <PiArrowDownBold className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Upload</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatBytes(data.traffic.totalTxBytes)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Avg: {formatBps(data.traffic.avgTxRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <PiArrowUpBold className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Peak Download/hr</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatBytes(data.traffic.peakRxBytes)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      In {formatDuration(parseInt(selectedHours))}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <PiLightningBold className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Traffic</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatBytes(data.traffic.totalBytes)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.traffic.dataPoints.length} data points
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <PiDatabaseBold className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Chart */}
          <TrafficChart
            dataPoints={data.traffic.dataPoints}
            title={`Traffic - ${selectedGroup?.name || 'Network'} (${formatDuration(parseInt(selectedHours))})`}
            height={350}
          />

          {/* App Flow Chart */}
          {data.appFlow && data.appFlow.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppFlowChart
                data={data.appFlow}
                title="Top Applications by Traffic"
                maxItems={10}
              />

              {/* App Categories Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Traffic by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryBreakdown data={data.appFlow} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
            <PiClockBold className="w-4 h-4" />
            Last updated: {new Date(data.fetchedAt).toLocaleString('en-ZA')}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// CATEGORY BREAKDOWN COMPONENT
// =============================================================================

interface CategoryBreakdownProps {
  data: AppFlowData[];
}

function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // Group by category
  const categories = data.reduce((acc, app) => {
    const cat = app.appGroupName || 'Other';
    if (!acc[cat]) {
      acc[cat] = { total: 0, apps: 0 };
    }
    acc[cat].total += app.upDownFlow;
    acc[cat].apps += 1;
    return acc;
  }, {} as Record<string, { total: number; apps: number }>);

  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b.total - a.total);

  const totalTraffic = data.reduce((sum, app) => sum + app.upDownFlow, 0);

  const categoryColors: Record<string, string> = {
    Streaming: 'bg-purple-500',
    Social: 'bg-blue-500',
    Work: 'bg-green-500',
    Gaming: 'bg-red-500',
    Other: 'bg-gray-500',
  };

  return (
    <div className="space-y-4">
      {sortedCategories.map(([category, stats]) => {
        const percentage = totalTraffic > 0
          ? (stats.total / totalTraffic) * 100
          : 0;

        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${categoryColors[category] || 'bg-gray-400'}`}
                />
                <span className="font-medium text-sm text-gray-900">
                  {category}
                </span>
                <span className="text-xs text-gray-500">
                  ({stats.apps} app{stats.apps > 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{formatBytes(stats.total)}</span>
                <span className="text-gray-400 w-12 text-right">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${categoryColors[category] || 'bg-gray-400'} rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
