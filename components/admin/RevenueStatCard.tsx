import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueStatCardProps {
  title: string;
  value: string | number;
  trend: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  chartData: Array<{ value: number }>;
  prefix?: string;
}

export function RevenueStatCard({
  title,
  value,
  trend,
  chartData,
  prefix = '$',
}: RevenueStatCardProps) {
  const formattedValue = typeof value === 'number'
    ? `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value;

  const trendColor = trend.isPositive ? 'text-green-600' : 'text-red-600';
  const chartColor = trend.isPositive ? '#F5831F' : '#ef4444';

  return (
    <Card className="relative overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>

        {/* Value */}
        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {formattedValue}
          </p>
        </div>

        {/* Trend Indicator */}
        <div className={`flex items-center gap-1 text-sm ${trendColor} mb-4`}>
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span className="font-medium">
            {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
          </span>
        </div>

        {/* Mini Chart */}
        <div className="h-20 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={{ fill: chartColor, r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
