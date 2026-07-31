'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BillingHealthTrendPoint } from '@/lib/billing/health/types';
import {
  axisProps,
  gridProps,
  tooltipStyle,
  formatRandTick,
} from '@/components/admin/dashboard/charts/chart-theme';
import { formatRand } from './format';

const COLORS = {
  collected: '#0E7C86', // teal
  invoiced: '#94A3B8', // slate-400
  mrr: '#EF4444', // red
} as const;

interface MrrCollectionsChartProps {
  data: BillingHealthTrendPoint[];
}

export function MrrCollectionsChart({ data }: MrrCollectionsChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">MRR &amp; Collections Trend</h2>
      <div className="mt-4 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={formatRandTick} />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [formatRand(value), name]}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} />
            <Bar dataKey="collected" name="Collected" fill={COLORS.collected} radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="invoiced" name="Invoiced" fill={COLORS.invoiced} radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Line
              type="monotone"
              dataKey="mrr"
              name="MRR"
              stroke={COLORS.mrr}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS.mrr, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
