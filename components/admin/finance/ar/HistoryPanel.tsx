'use client';

import { Area, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { PiCalendarBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { CHANNEL_COLORS, formatCurrency, formatShortDate, type ARAnalyticsData } from './shared';

const trendConfig = {
  total_outstanding: { label: 'Outstanding', color: 'var(--chart-1)' },
  dso_current: { label: 'DSO', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const activityConfig = {
  sms_sent_count: { label: 'SMS', color: CHANNEL_COLORS.sms },
  email_sent_count: { label: 'Email', color: CHANNEL_COLORS.email },
  payments_received_amount: { label: 'Payments', color: '#22c55e' },
} satisfies ChartConfig;

export function HistoryPanel({ data }: { data: ARAnalyticsData }) {
  const history = data.historical;

  if (!history || history.length === 0) {
    return (
      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardContent className="py-12 text-center">
          <PiCalendarBold className="mx-auto mb-4 h-12 w-12 text-slate-300" aria-hidden="true" />
          <p className="text-slate-600">No historical data available yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Historical snapshots are created daily by the system
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">AR &amp; DSO Trend</CardTitle>
          <p className="text-xs text-slate-500">Historical outstanding amount and DSO</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="aspect-auto h-[300px] w-full">
            <ComposedChart accessibilityLayer data={history} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="snapshot_date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={formatShortDate}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(v) => `R${(Number(v) / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatShortDate(String(value))}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {trendConfig[name as keyof typeof trendConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {name === 'total_outstanding'
                            ? formatCurrency(Number(value))
                            : Number(value).toFixed(1)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillOutstanding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total_outstanding)" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="var(--color-total_outstanding)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <Area
                yAxisId="left"
                dataKey="total_outstanding"
                type="natural"
                fill="url(#fillOutstanding)"
                stroke="var(--color-total_outstanding)"
                strokeWidth={1.5}
              />
              <Line
                yAxisId="right"
                dataKey="dso_current"
                type="natural"
                stroke="var(--color-dso_current)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Notifications &amp; Collections
          </CardTitle>
          <p className="text-xs text-slate-500">
            Daily notification activity and payments received
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityConfig} className="aspect-auto h-[300px] w-full">
            <ComposedChart accessibilityLayer data={history} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="snapshot_date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={formatShortDate}
              />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} width={40} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(v) => `R${(Number(v) / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatShortDate(String(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="left" dataKey="sms_sent_count" fill="var(--color-sms_sent_count)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="email_sent_count" fill="var(--color-email_sent_count)" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                dataKey="payments_received_amount"
                type="natural"
                stroke="var(--color-payments_received_amount)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
