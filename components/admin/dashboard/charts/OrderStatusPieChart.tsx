'use client';

import { PieChart, Pie, Cell, Label, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PiShoppingCartBold } from 'react-icons/pi';
import { SectionCard, EmptyState } from '@/components/backend';
import { STATUS_PALETTE, tooltipStyle } from './chart-theme';

export interface OrderStatusDatum {
  name: string;
  value: number;
}

interface OrderStatusPieChartProps {
  data: OrderStatusDatum[];
  className?: string;
}

export function OrderStatusPieChart({ data, className }: OrderStatusPieChartProps) {
  const total = data.reduce((sum, entry) => sum + (entry.value || 0), 0);

  return (
    <SectionCard title="Order Status" className={className}>
      {data.length === 0 ? (
        <EmptyState
          icon={<PiShoppingCartBold />}
          title="No orders yet"
          description="Order status distribution will appear here once orders come in."
        />
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_PALETTE[index % STATUS_PALETTE.length]} />
                ))}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox)) return null;
                    const { cx, cy } = viewBox;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} dy="-0.4em" className="fill-gray-900 text-2xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={cx} dy="1.6em" className="fill-gray-500 text-xs">
                          Total Orders
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
