'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiArrowDownBold, PiArrowUpBold, PiChartLineBold } from 'react-icons/pi';

// =============================================================================
// TYPES
// =============================================================================

interface TrafficDataPoint {
  timestamp: number;
  timeString: string;
  rxBytes: number;
  txBytes: number;
}

interface TrafficChartProps {
  dataPoints: TrafficDataPoint[];
  title?: string;
  showLegend?: boolean;
  height?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format bits per second to human-readable string
 */
function formatBps(bps: number): string {
  if (bps === 0) return '0 bps';

  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const k = 1000;
  const i = Math.floor(Math.log(bps) / Math.log(k));

  return `${(bps / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format timestamp to display time
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format timestamp for tooltip
 */
function formatTooltipTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || !label) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">
        {formatTooltipTime(label)}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-2">
              {entry.dataKey === 'rxBytes' ? (
                <PiArrowDownBold className="w-3 h-3 text-emerald-500" />
              ) : (
                <PiArrowUpBold className="w-3 h-3 text-blue-500" />
              )}
              <span className="text-gray-600">
                {entry.dataKey === 'rxBytes' ? 'Download' : 'Upload'}
              </span>
            </div>
            <span className="font-medium" style={{ color: entry.color }}>
              {formatBytes(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TrafficChart({
  dataPoints,
  title = 'Network Traffic',
  showLegend = true,
  height = 300,
}: TrafficChartProps) {
  // Transform data for chart
  const chartData = useMemo(() => {
    return dataPoints.map((point) => ({
      timestamp: point.timestamp,
      rxBytes: point.rxBytes,
      txBytes: point.txBytes,
    }));
  }, [dataPoints]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (dataPoints.length === 0) {
      return { totalRx: 0, totalTx: 0, avgRxRate: 0, avgTxRate: 0 };
    }

    const totalRx = dataPoints.reduce((sum, p) => sum + p.rxBytes, 0);
    const totalTx = dataPoints.reduce((sum, p) => sum + p.txBytes, 0);

    // Assuming hourly data, calculate average rate
    const hoursSpan = dataPoints.length;
    const avgRxRate = hoursSpan > 0 ? (totalRx * 8) / (hoursSpan * 3600) : 0;
    const avgTxRate = hoursSpan > 0 ? (totalTx * 8) / (hoursSpan * 3600) : 0;

    return { totalRx, totalTx, avgRxRate, avgTxRate };
  }, [dataPoints]);

  if (dataPoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PiChartLineBold className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No traffic data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiChartLineBold className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <PiArrowDownBold className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-600">Total DL:</span>
              <span className="font-medium">{formatBytes(stats.totalRx)}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Avg: {formatBps(stats.avgRxRate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <PiArrowUpBold className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Total UL:</span>
              <span className="font-medium">{formatBytes(stats.totalTx)}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Avg: {formatBps(stats.avgTxRate)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fontSize: 12 }}
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tickFormatter={(value) => formatBytes(value)}
              tick={{ fontSize: 12 }}
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) =>
                  value === 'rxBytes' ? 'Download' : 'Upload'
                }
              />
            )}
            <Area
              type="monotone"
              dataKey="rxBytes"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRx)"
              name="Download"
            />
            <Area
              type="monotone"
              dataKey="txBytes"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTx)"
              name="Upload"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// APP FLOW CHART
// =============================================================================

interface AppFlowData {
  appGroupName: string;
  appName: string;
  downFlow: number;
  upFlow: number;
  upDownFlow: number;
}

interface AppFlowChartProps {
  data: AppFlowData[];
  title?: string;
  maxItems?: number;
}

export function AppFlowChart({
  data,
  title = 'Application Usage',
  maxItems = 10,
}: AppFlowChartProps) {
  // Sort by total traffic and take top items
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.upDownFlow - a.upDownFlow)
      .slice(0, maxItems);
  }, [data, maxItems]);

  const totalTraffic = useMemo(() => {
    return data.reduce((sum, app) => sum + app.upDownFlow, 0);
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No application data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.map((app, index) => {
            const percentage = totalTraffic > 0
              ? (app.upDownFlow / totalTraffic) * 100
              : 0;

            return (
              <div key={`${app.appGroupName}-${app.appName}-${index}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">
                      {app.appName}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({app.appGroupName})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">
                      {formatBytes(app.upDownFlow)}
                    </span>
                    <span className="text-gray-400 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-circleTel-orange to-orange-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600">
          <span>Total: {formatBytes(totalTraffic)}</span>
          <span>{data.length} applications</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { formatBytes, formatBps };
