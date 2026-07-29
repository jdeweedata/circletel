'use client';

/**
 * Dual gradient area chart for throughput (Mbps download / upload).
 * Pattern: shadcn/ui Area Chart — Legend + gradient fills
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
import { cn } from '@/lib/utils';

export type ThroughputPoint = {
  /** ISO timestamp or parseable date string */
  captured_at: string;
  avgRxMbps: number;
  avgTxMbps: number;
  avgThroughputMbps?: number;
};

type ThroughputAreaChartProps = {
  data: ThroughputPoint[];
  title?: string;
  description?: string;
  className?: string;
  heightClassName?: string;
  /** Stack download+upload (default) or overlay separate areas */
  stacked?: boolean;
};

const chartConfig = {
  download: {
    label: 'Download',
    color: 'var(--chart-1)',
  },
  upload: {
    label: 'Upload',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

function formatAxisTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatMbps(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 100) return `${Math.round(value)} Mbps`;
  if (value >= 10) return `${value.toFixed(1)} Mbps`;
  return `${value.toFixed(2)} Mbps`;
}

export function ThroughputAreaChart({
  data,
  title = 'Throughput',
  description = 'Average rates from traffic rollups',
  className,
  heightClassName = 'aspect-auto h-[280px] w-full',
  stacked = true,
}: ThroughputAreaChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        captured_at: d.captured_at,
        download: Number(d.avgRxMbps) || 0,
        upload: Number(d.avgTxMbps) || 0,
      })),
    [data]
  );

  const peak = useMemo(() => {
    if (!chartData.length) return null;
    let max = 0;
    for (const p of chartData) {
      max = Math.max(max, stacked ? p.download + p.upload : Math.max(p.download, p.upload));
    }
    return max;
  }, [chartData, stacked]);

  return (
    <Card className={cn('rounded-xl border-slate-200/80 shadow-sm bg-white', className)}>
      <CardHeader className="flex flex-col gap-1 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
        </div>
        {peak != null ? (
          <p className="text-xs text-slate-500">
            Peak{' '}
            <span className="font-medium tabular-nums text-slate-800">{formatMbps(peak)}</span>
          </p>
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
            No bandwidth rollups yet — will populate after the next Ruijie sync.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className={heightClassName}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="captured_at"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={formatAxisTime}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v) => `${Number(v).toFixed(0)}`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_value, payload) => {
                      const raw = (
                        payload?.[0] as { payload?: { captured_at?: string } } | undefined
                      )?.payload?.captured_at
                      const d = new Date(String(raw ?? ""))
                      if (Number.isNaN(d.getTime())) return String(raw ?? "")
                      return d.toLocaleString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatMbps(Number(value))}
                        </span>
                      </div>
                    )}
                    indicator="line"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillThroughputDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-download)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-download)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillThroughputUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-upload)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--color-upload)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                dataKey="upload"
                type="natural"
                fill="url(#fillThroughputUp)"
                stroke="var(--color-upload)"
                strokeWidth={1.5}
                stackId={stacked ? 'tput' : undefined}
              />
              <Area
                dataKey="download"
                type="natural"
                fill="url(#fillThroughputDown)"
                stroke="var(--color-download)"
                strokeWidth={1.5}
                stackId={stacked ? 'tput' : undefined}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
