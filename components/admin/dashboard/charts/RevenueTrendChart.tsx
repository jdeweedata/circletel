'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { PiCurrencyDollarBold } from 'react-icons/pi';
import { SectionCard, EmptyState } from '@/components/backend';
import { CHART_COLORS, axisProps, gridProps, tooltipStyle, formatRand, formatRandTick } from './chart-theme';

export interface RevenueTrendDatum {
  name: string;
  revenue: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrendDatum[];
  className?: string;
}

export function RevenueTrendChart({ data, className }: RevenueTrendChartProps) {
  return (
    <SectionCard title="Revenue Trend (Last 12 Months)" className={className}>
      {data.length === 0 ? (
        <EmptyState
          icon={<PiCurrencyDollarBold />}
          title="No revenue data yet"
          description="Revenue will appear here once orders and quotes are recorded."
        />
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={formatRandTick} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatRand(value), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLORS.revenue}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
