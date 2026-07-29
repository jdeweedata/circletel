'use client';

/**
 * Stacked area chart for hourly traffic volume (download + upload bytes).
 * Pattern: shadcn/ui Area Chart — Stacked
 * @see https://ui.shadcn.com/charts/area
 */

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatBytes } from '@/components/admin/network/TrafficChart';
import { cn } from '@/lib/utils';

export type TrafficVolumePoint = {
  timestamp: number;
  timeString?: string;
  rxBytes: number;
  txBytes: number;
};

type TrafficVolumeAreaChartProps = {
  dataPoints: TrafficVolumePoint[];
  title?: string;
  description?: string;
  className?: string;
  /** Chart height class — default matches aspect-auto h-[320px] */
  heightClassName?: string;
};

const chartConfig = {
  download: {
    label: 'Download',
    color: 'var(--chart-1)',
  },
  upload: {
    label: 'Upload',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

function formatAxisTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTooltipLabel(value: unknown): string {
  const ts = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(ts)) return String(value ?? '');
  return new Date(ts).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function TrafficVolumeAreaChart({
  dataPoints,
  title = 'Traffic volume',
  description = 'Hourly download and upload volume (stacked)',
  className,
  heightClassName = 'aspect-auto h-[320px] w-full',
}: TrafficVolumeAreaChartProps) {
  const chartData = useMemo(
    () =>
      dataPoints.map((p) => ({
        timestamp: p.timestamp,
        download: p.rxBytes,
        upload: p.txBytes,
      })),
    [dataPoints]
  );

  const totals = useMemo(() => {
    const download = chartData.reduce((s, p) => s + p.download, 0);
    const upload = chartData.reduce((s, p) => s + p.upload, 0);
    return { download, upload, total: download + upload };
  }, [chartData]);

  return (
    <Card className={cn('rounded-xl border-slate-200/80 shadow-sm bg-white', className)}>
      <CardHeader className="flex flex-col gap-1 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
        </div>
        {chartData.length > 0 ? (
          <div className="text-right text-xs text-slate-500">
            <p>
              Total{' '}
              <span className="font-medium tabular-nums text-slate-800">
                {formatBytes(totals.total)}
              </span>
            </p>
            <p className="text-slate-400">
              ↓ {formatBytes(totals.download)} · ↑ {formatBytes(totals.upload)}
            </p>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400',
              heightClassName
            )}
          >
            No traffic samples for this window
          </div>
        ) : (
          <ChartContainer config={chartConfig} className={heightClassName}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={formatAxisTime}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={52}
                tickFormatter={(v) => formatBytes(Number(v))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_value, payload) => {
                      const ts = (
                        payload?.[0] as { payload?: { timestamp?: number } } | undefined
                      )?.payload?.timestamp
                      return formatTooltipLabel(ts)
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatBytes(Number(value))}
                        </span>
                      </div>
                    )}
                    indicator="dot"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillDownload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-download)" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="var(--color-download)" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="fillUpload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-upload)" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="var(--color-upload)" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <Area
                dataKey="upload"
                type="natural"
                fill="url(#fillUpload)"
                stroke="var(--color-upload)"
                strokeWidth={1.5}
                stackId="traffic"
              />
              <Area
                dataKey="download"
                type="natural"
                fill="url(#fillDownload)"
                stroke="var(--color-download)"
                strokeWidth={1.5}
                stackId="traffic"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
