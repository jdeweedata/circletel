'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatBytes, formatBps } from '@/components/admin/network/TrafficChart';
import {
  MetricCard,
  TopApplicationsCard,
  AppCategoryBreakdown,
  GroupTrafficCards,
  SsidActivityCards,
  RadioUtilSummaryCard,
  TrafficVolumeAreaChart,
  ThroughputAreaChart,
} from '@/components/admin/network/performance';
import type { GroupTrafficCard, RadioUtilSummary, SsidActivityCard } from '@/lib/network/analytics-aggregates';
import { formatRelative } from '@/lib/dates';

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

interface AnalyticsDevice {
  sn: string;
  device_name: string;
  status: string;
}

type AnalyticsPeriod =
  | { mode: 'hours'; hours: number }
  | {
      mode: 'custom';
      startDate: string;
      endDate: string;
      inclusiveDayCount?: number;
    };

interface AnalyticsApiResponse {
  groups: Array<{ id: string; name: string }>;
  groupId: string | null;
  deviceSn?: string | null;
  devices?: AnalyticsDevice[];
  hours: number;
  period?: AnalyticsPeriod;
  source: 'supabase' | 'live';
  traffic: TrafficSummary;
  appFlow?: AppFlowData[];
  groupTraffic?: GroupTrafficCard[];
  ssidActivity?: SsidActivityCard[];
  radio?: RadioUtilSummary;
  lastRollupAt?: string | null;
  lastSyncedAt?: string | null;
  fetchedAt: string;
}

const ALL_DEVICES = 'all';

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}

/** Yesterday and 6 days before that in SAST (7 inclusive calendar days). */
function defaultCustomDates(now = new Date()): { startDate: string; endDate: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const end = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { startDate: fmt.format(start), endDate: fmt.format(end) };
}

function periodLabel(
  periodMode: string,
  selectedHours: string,
  customStart: string,
  customEnd: string,
  period?: AnalyticsPeriod
): string {
  if (period?.mode === 'custom') {
    return `${period.startDate} → ${period.endDate}`;
  }
  if (periodMode === 'custom') {
    return `${customStart} → ${customEnd}`;
  }
  const hours = period?.mode === 'hours' ? period.hours : parseInt(selectedHours, 10);
  return formatDuration(Number.isFinite(hours) ? hours : 24);
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
  const defaults = useMemo(() => defaultCustomDates(), []);
  const [data, setData] = useState<AnalyticsApiResponse | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [devices, setDevices] = useState<AnalyticsDevice[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedDeviceSn, setSelectedDeviceSn] = useState<string>(ALL_DEVICES);
  const [periodMode, setPeriodMode] = useState<string>('24');
  const [customStart, setCustomStart] = useState(defaults.startDate);
  const [customEnd, setCustomEnd] = useState(defaults.endDate);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferLive, setPreferLive] = useState(false);
  const hasLoadedRef = useRef(false);

  const fetchTrafficData = useCallback(
    async (options?: {
      isRefresh?: boolean;
      live?: boolean;
      groupId?: string;
      deviceSn?: string;
      periodMode?: string;
      customStart?: string;
      customEnd?: string;
    }) => {
      const isRefresh = options?.isRefresh ?? false;
      const live = options?.live ?? preferLive;
      const groupId = options?.groupId ?? selectedGroupId;
      const deviceSn = options?.deviceSn ?? selectedDeviceSn;
      const mode = options?.periodMode ?? periodMode;
      const startDate = options?.customStart ?? customStart;
      const endDate = options?.customEnd ?? customEnd;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          includeApps: 'true',
        });
        if (groupId) params.set('groupId', groupId);
        if (deviceSn && deviceSn !== ALL_DEVICES) params.set('deviceSn', deviceSn);
        if (live) params.set('live', 'true');

        // Custom range is Cached-only; Live always uses hour presets.
        if (!live && mode === 'custom') {
          params.set('startDate', startDate);
          params.set('endDate', endDate);
          params.set('hours', '24'); // fallback if custom parse fails server-side
        } else {
          const hours = mode === 'custom' ? '24' : mode;
          params.set('hours', hours);
        }

        const response = await fetch(`/api/admin/network/analytics?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const result: AnalyticsApiResponse = await response.json();
        setData(result);
        if (result.groups?.length) {
          // Normalize ids to strings — Radix Select rejects empty/non-string values.
          const normalized = result.groups
            .map((g) => ({ id: String(g.id), name: g.name || String(g.id) }))
            .filter((g) => g.id.length > 0);
          setGroups(normalized);
          if (!groupId && result.groupId) {
            setSelectedGroupId(String(result.groupId));
          }
        }
        if (result.devices) {
          setDevices(
            result.devices
              .map((d) => ({
                sn: String(d.sn),
                device_name: d.device_name || String(d.sn),
                status: d.status || 'unknown',
              }))
              .filter((d) => d.sn.length > 0)
          );
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
    [
      selectedGroupId,
      selectedDeviceSn,
      periodMode,
      customStart,
      customEnd,
      preferLive,
    ]
  );

  useEffect(() => {
    void fetchTrafficData({ isRefresh: hasLoadedRef.current }).finally(() => {
      hasLoadedRef.current = true;
    });
  }, [fetchTrafficData]);

  // Auto-refresh only in Cached mode — Live must stay opt-in / manual.
  useEffect(() => {
    if (preferLive) return;
    const interval = setInterval(
      () => fetchTrafficData({ isRefresh: true, live: false }),
      5 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [fetchTrafficData, preferLive]);

  const handleGroupChange = (groupId: string) => {
    if (!groupId || groupId === selectedGroupId) return;
    setSelectedGroupId(groupId);
    setSelectedDeviceSn(ALL_DEVICES);
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'custom' && preferLive) {
      // Custom is Cached-only — leave Live and switch to custom.
      setPreferLive(false);
    }
    setPeriodMode(value);
  };

  const handleLiveToggle = () => {
    const next = !preferLive;
    setPreferLive(next);
    if (next && periodMode === 'custom') {
      setPeriodMode('24');
      void fetchTrafficData({ isRefresh: true, live: true, periodMode: '24' });
      return;
    }
    void fetchTrafficData({ isRefresh: true, live: next });
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const selectedDevice =
    selectedDeviceSn !== ALL_DEVICES
      ? devices.find((d) => d.sn === selectedDeviceSn)
      : null;
  const scopeLabel = selectedDevice?.device_name || 'All devices';
  const chartScopeLabel = selectedDevice?.device_name || selectedGroup?.name || 'Network';
  const activePeriodLabel = periodLabel(
    periodMode,
    periodMode === 'custom' ? '24' : periodMode,
    customStart,
    customEnd,
    data?.period
  );

  const bandwidthSeries =
    data?.traffic.dataPoints.map((p) => {
      // Prefer API Mbps; fall back to hourly bytes → avg Mbps
      const rxMbps =
        p.avgRxMbps ??
        (Number.isFinite(p.rxBytes) ? (p.rxBytes * 8) / 3600 / 1_000_000 : 0);
      const txMbps =
        p.avgTxMbps ??
        (Number.isFinite(p.txBytes) ? (p.txBytes * 8) / 3600 / 1_000_000 : 0);
      return {
        captured_at: new Date(p.timestamp).toISOString(),
        avgRxMbps: rxMbps,
        avgTxMbps: txMbps,
        avgThroughputMbps: rxMbps + txMbps,
      };
    }) ?? [];

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
            Traffic and utilization by network group
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/health">System Health</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/devices">Devices</Link>
          </Button>
          <Select
            value={selectedGroupId || undefined}
            onValueChange={handleGroupChange}
          >
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
          <Select value={selectedDeviceSn} onValueChange={setSelectedDeviceSn}>
            <SelectTrigger className="w-[220px] rounded-lg border-slate-200">
              <SelectValue placeholder="All devices in group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DEVICES}>All devices in group</SelectItem>
              {devices.map((device) => (
                <SelectItem key={device.sn} value={device.sn}>
                  {device.device_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodMode} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[150px] rounded-lg border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 hours</SelectItem>
              <SelectItem value="12">Last 12 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="48">Last 2 days</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
              <SelectItem value="720">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {periodMode === 'custom' && !preferLive ? (
            <>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-[150px] rounded-lg border-slate-200"
                aria-label="Custom start date"
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-[150px] rounded-lg border-slate-200"
                aria-label="Custom end date"
              />
            </>
          ) : null}
          <Button
            variant={preferLive ? 'default' : 'outline'}
            size="sm"
            onClick={handleLiveToggle}
          >
            <PiBroadcastBold className="w-4 h-4 mr-2" />
            {preferLive ? 'Live' : 'Cached'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchTrafficData({ isRefresh: true })}
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                data.source === 'live'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }
            >
              {data.source === 'live' ? 'Ruijie live' : 'Supabase rollups'}
            </Badge>
            <span className="text-xs text-slate-400">
              {selectedGroup?.name || 'Network'} · {scopeLabel} · {activePeriodLabel}
            </span>
            {data.lastRollupAt ? (
              <span className="text-xs text-slate-500">
                Last rollup {formatRelative(data.lastRollupAt)}
              </span>
            ) : (
              <span className="text-xs text-amber-600">No rollup samples yet</span>
            )}
            {data.lastSyncedAt ? (
              <span className="text-xs text-slate-400">
                · Device sync {formatRelative(data.lastSyncedAt)}
              </span>
            ) : null}
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
              subtitle={activePeriodLabel}
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
            onSelectGroup={handleGroupChange}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TrafficVolumeAreaChart
                dataPoints={data.traffic.dataPoints}
                title={`Traffic volume — ${chartScopeLabel}`}
                description="Stacked download + upload by hour (shadcn area chart)"
              />
            </div>
            <ThroughputAreaChart
              data={bandwidthSeries}
              title="Throughput"
              description="Average rates from rollups (Mbps)"
              stacked
            />
          </div>

          <ThroughputAreaChart
            data={bandwidthSeries}
            title="Download vs upload throughput"
            description="Overlay view — compare directions without stacking"
            stacked={false}
            heightClassName="aspect-auto h-[260px] w-full"
          />

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

          <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <PiClockBold className="w-4 h-4" />
              {data.source === 'live'
                ? `Live fetch ${formatRelative(data.fetchedAt)}`
                : data.lastRollupAt
                  ? `Rollup data ${formatRelative(data.lastRollupAt)}`
                  : 'Waiting for first traffic rollup'}
            </span>
            {preferLive ? (
              <span className="text-xs text-slate-400">Auto-refresh paused in Live mode</span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
