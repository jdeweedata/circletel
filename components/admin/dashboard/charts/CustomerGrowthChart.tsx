'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PiUsersBold } from 'react-icons/pi';
import { SectionCard, EmptyState } from '@/components/backend';
import { CHART_COLORS, axisProps, gridProps, tooltipStyle } from './chart-theme';

export interface CustomerGrowthDatum {
  name: string;
  customers: number;
  orders: number;
}

interface CustomerGrowthChartProps {
  data: CustomerGrowthDatum[];
  className?: string;
}

export function CustomerGrowthChart({ data, className }: CustomerGrowthChartProps) {
  return (
    <SectionCard title="Customer & Order Growth" className={className}>
      {data.length === 0 ? (
        <EmptyState
          icon={<PiUsersBold />}
          title="No growth data yet"
          description="New customers and orders will appear here over time."
        />
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="customers" name="New Customers" fill={CHART_COLORS.customers} radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" name="New Orders" fill={CHART_COLORS.orders} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
