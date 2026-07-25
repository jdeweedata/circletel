'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiArrowDownBold,
  PiArrowUpBold,
  PiClockBold,
  PiWifiHighBold,
  PiLightningBold,
  PiDatabaseBold,
  PiBroadcastBold,
} from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrafficChart, formatBytes, formatBps } from '@/components/admin/network/TrafficChart';
import {
  MetricCard,
  BandwidthChart,
  TopApplicationsCard,
  AppCategoryBreakdown,
  GroupTrafficCards,
  SsidActivityCards,
  RadioUtilSummaryCard,
} from '@/components/admin/network/performance';
import type { GroupTrafficCard, RadioUtilSummary, SsidActivityCard } from '@/lib/network/analytics-aggregates';

interface TrafficDataPoint {
  timestamp: number;
  timeString: string;
  rxBytes: number;
  txBytes: number;
  rxPkts: number;
  txPkts: number;
  buildingId: number;
  avgRxMbps?: number;
  avgTxMbps?: number;
}

interface TrafficSummary {
  totalRxBytes: number;
  totalTxBytes: number;
  totalBytes: number;
  avgRxRate: number;
  avgTxRate: number;
  peakRxBytes: number;
  peakTxBytes: number;
  avgRxMbps?: number;
  avgTxMbps?: number;
  dataPoints: TrafficDataPoint[];
}

interface AppFlowData {
  appGroupName: string;
  appName: string;
  downFlow: number;
  upFlow: number;
  upDownFlow: number;
}

interface AnalyticsApiResponse {
  groups: Array<{ id: string; name: string }>;
  groupId: string | null;
  hours: number;
  source: 'supabase' | 'live';
  traffic: TrafficSummary;
  appFlow?: AppFlowData[];
  groupTraffic?: GroupTrafficCard[];
  ssidActivity?: SsidActivityCard[];
  radio?: RadioUtilSummary;
  fetchedAt: string;
}

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}

const emptyRadio: RadioUtilSummary = {
  avg2g: null,
  avg5g: null,
  avgBlended: null,
  devicesWithRadio: 0,
  totalDevices: 0,
  channels2g: [],
  channels5g: [],
  byDevice: [],
};

export default function NetworkAnalyticsPage() {
  const [data, setData] = useState<AnalyticsApiResponse | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedHours, setSelectedHours] = useState<string>('24');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferLive, setPreferLive] = useState(false);

  const fetchTrafficData = useCallback(
    async (isRefresh = false, live = preferLive) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          hours: selectedHours,
          includeApps: 'true',
        });
        if (selectedGroupId) params.set('groupId', selectedGroupId);
        if (live) params.set('live', 'true');

        const response = await fetch(`/api/admin/network/analytics?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const result: AnalyticsApiResponse = await response.json();
        setData(result);
        if (result.groups?.length) {
          setGroups(result.groups);
          if (!selectedGroupId && result.groupId) {
            setSelectedGroupId(result.groupId);
          }
        }
        setError(null);
      } catch (err) {
        setError('Failed to load traffic analytics');
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedGroupId, selectedHours, preferLive]
  );

  useEffect(() => {
    fetchTrafficData();
  }, [fetchTrafficData]);

  useEffect(() => {
    const interval = setInterval(() => fetchTrafficData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrafficData]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const bandwidthSeries =
    data?.traffic.dataPoints.map((p) => ({
      captured_at: p.timeString,
      avgRxMbps: p.avgRxMbps ?? 0,
      avgTxMbps: p.avgTxMbps ?? 0,
      avgThroughputMbps: (p.avgRxMbps ?? 0) + (p.avgTxMbps ?? 0),
    })) ?? [];

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-[350px] bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const appFlow = data?.appFlow ?? [];
  const groupTraffic = data?.groupTraffic ?? [];
  const ssidActivity = data?.ssidActivity ?? [];
  const radio = data?.radio ?? emptyRadio;

  return (
    <div className="space-y-6 -mx-1">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Activity / Infrastructure / Analytics</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Network Analytics
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Group-scoped Ruijie throughput · app-flow · radio util from cache
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/health">System Health</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/devices">Devices</Link>
          </Button>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-[200px] rounded-lg border-slate-200">
              <SelectValue placeholder="Select network group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedHours} onValueChange={setSelectedHours}>
            <SelectTrigger className="w-[140px] rounded-lg border-slate-200">
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
          <Button
            variant={preferLive ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const next = !preferLive;
              setPreferLive(next);
              fetchTrafficData(true, next);
            }}
          >
            <PiBroadcastBold className="w-4 h-4 mr-2" />
            {preferLive ? 'Live' : 'Cached'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTrafficData(true)}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 rounded-xl">
          <CardContent className="py-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {!selectedGroupId && groups.length === 0 ? (
        <Card className="rounded-xl border-slate-200">
          <CardContent className="py-12 text-center">
            <PiWifiHighBold className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">No network groups found</p>
            <p className="text-sm text-slate-500 mt-1">
              Sync Ruijie devices first to view traffic analytics
            </p>
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                data.source === 'live'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }
            >
              Source: {data.source === 'live' ? 'Ruijie live' : 'Supabase rollups'}
            </Badge>
            <span className="text-xs text-slate-400">
              {selectedGroup?.name || 'Network'} · {formatDuration(parseInt(selectedHours, 10))}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Download"
              value={formatBytes(data.traffic.totalRxBytes)}
              subtitle={`Avg ${formatBps(data.traffic.avgRxRate)}`}
            >
              <PiArrowDownBold className="w-5 h-5 text-emerald-600" />
            </MetricCard>
            <MetricCard
              title="Total Upload"
              value={formatBytes(data.traffic.totalTxBytes)}
              subtitle={`Avg ${formatBps(data.traffic.avgTxRate)}`}
            >
              <PiArrowUpBold className="w-5 h-5 text-blue-600" />
            </MetricCard>
            <MetricCard
              title="Peak Download / window"
              value={formatBytes(data.traffic.peakRxBytes)}
              subtitle={formatDuration(parseInt(selectedHours, 10))}
            >
              <PiLightningBold className="w-5 h-5 text-amber-600" />
            </MetricCard>
            <MetricCard
              title="Total Traffic"
              value={formatBytes(data.traffic.totalBytes)}
              subtitle={`${data.traffic.dataPoints.length} data points`}
            >
              <PiDatabaseBold className="w-5 h-5 text-slate-500" />
            </MetricCard>
          </div>

          <GroupTrafficCards
            groups={groupTraffic}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TrafficChart
                dataPoints={data.traffic.dataPoints}
                title={`Traffic — ${selectedGroup?.name || 'Network'}`}
                height={350}
              />
            </div>
            <BandwidthChart
              data={bandwidthSeries}
              title="Throughput (Mbps)"
              subtitle="From rollup avg rates"
              height={300}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopApplicationsCard data={appFlow} maxItems={10} />
            <Card className="rounded-xl border-slate-200/80 shadow-sm border bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Traffic by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppCategoryBreakdown data={appFlow} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SsidActivityCards ssids={ssidActivity} />
            <RadioUtilSummaryCard radio={radio} />
          </div>

          <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
            <PiClockBold className="w-4 h-4" />
            Last updated: {new Date(data.fetchedAt).toLocaleString('en-ZA')}
          </div>
        </>
      ) : null}
    </div>
  );
}
