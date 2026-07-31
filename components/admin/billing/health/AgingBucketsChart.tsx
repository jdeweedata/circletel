'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AgingBucketKey, AgingBuckets } from '@/lib/billing/health/types';
import { AGING_BUCKET_LABELS } from '@/lib/billing/health/aging';
import {
  axisProps,
  gridProps,
  tooltipStyle,
  formatRandTick,
} from '@/components/admin/dashboard/charts/chart-theme';
import { formatRand } from './format';

const BUCKET_COLORS: Record<AgingBucketKey, string> = {
  current: '#0E7C86',
  '1-7d': '#0E7C86',
  '8-30d': '#E87A1E',
  '31-60d': '#EF4444',
  '61d+': '#B91C1C',
};

interface AgingBucketsChartProps {
  aging: AgingBuckets;
}

export function AgingBucketsChart({ aging }: AgingBucketsChartProps) {
  const data = (Object.keys(AGING_BUCKET_LABELS) as AgingBucketKey[]).map((key) => ({
    key,
    name: AGING_BUCKET_LABELS[key],
    value: Math.round(aging[key] * 100) / 100,
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Past-due Aging Buckets</h2>
      <p className="mt-0.5 text-sm text-slate-500">Balance by days past due</p>
      <div className="mt-4 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={formatRandTick} />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatRand(value), 'Balance']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={BUCKET_COLORS[entry.key]} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value: number) => (value > 0 ? formatRand(value) : '')}
                className="fill-slate-600 text-xs font-medium"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
