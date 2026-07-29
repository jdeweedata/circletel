'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type BandwidthPoint = {
  captured_at: string;
  avgRxMbps: number;
  avgTxMbps: number;
  avgThroughputMbps?: number;
};

type BandwidthChartProps = {
  data: BandwidthPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  variant?: 'dual-line' | 'area';
  bare?: boolean;
};

function formatTick(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function BandwidthChart({
  data,
  title = 'Network Bandwidth',
  subtitle,
  className,
  height = 180,
  variant = 'dual-line',
  bare = false,
}: BandwidthChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatTick(d.captured_at),
  }));

  const chart =
    chartData.length === 0 ? (
      <div
        className="flex items-center justify-center text-sm text-slate-400"
        style={{ height }}
      >
        No bandwidth rollups yet — will populate after the next Ruijie sync.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={height}>
        {variant === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
              formatter={(value: number) => [`${Number(value).toFixed(2)} Mbps`, '']}
            />
            <Area
              type="monotone"
              dataKey="avgThroughputMbps"
              stroke="#2563eb"
              fill="#93c5fd"
              fillOpacity={0.45}
              name="Throughput"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
              formatter={(value: number, name: string) => [`${Number(value).toFixed(2)} Mbps`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="avgRxMbps" stroke="#2563eb" strokeWidth={2} dot={false} name="Download" />
            <Line type="monotone" dataKey="avgTxMbps" stroke="#f59e0b" strokeWidth={2} dot={false} name="Upload" />
          </LineChart>
        )}
      </ResponsiveContainer>
    );

  if (bare) {
    return <div className={className}>{chart}</div>;
  }

  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  );
}
