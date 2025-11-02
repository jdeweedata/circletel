import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricStatCardProps {
  title: string;
  value: string | number;
  trend: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  chartData: Array<{ value: number }>;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export function MetricStatCard({
  title,
  value,
  trend,
  chartData,
  prefix = '',
  suffix = '',
  icon,
}: MetricStatCardProps) {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('en-US')
    : value;

  const trendColor = trend.isPositive ? 'text-green-600' : 'text-red-600';
  const chartColor = trend.isPositive ? '#F5831F' : '#ef4444';

  return (
    <Card className="relative overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Title with optional icon */}
        <div className="flex items-center gap-2 mb-4">
          {icon && <div className="text-gray-400">{icon}</div>}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {prefix}{formattedValue}{suffix}
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
