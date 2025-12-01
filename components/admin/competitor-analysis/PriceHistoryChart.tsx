'use client';

/**
 * Price History Chart Component
 *
 * Displays price history over time for competitor products
 * using a line chart with multiple series support.
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// =============================================================================
// TYPES
// =============================================================================

export interface PriceDataPoint {
  date: string;
  price: number | null;
  label?: string;
}

export interface PriceSeries {
  id: string;
  name: string;
  data: PriceDataPoint[];
  color?: string;
}

export interface PriceHistoryChartProps {
  /** Price series to display */
  series: PriceSeries[];
  /** Your reference price (horizontal line) */
  yourPrice?: number;
  /** Chart height */
  height?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Date format for X axis */
  dateFormat?: 'short' | 'medium' | 'long';
}

// =============================================================================
// COLORS
// =============================================================================

const CHART_COLORS = [
  '#F5831F', // CircleTel Orange
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

// =============================================================================
// COMPONENT
// =============================================================================

export function PriceHistoryChart({
  series,
  yourPrice,
  height = 300,
  showLegend = true,
  dateFormat = 'short',
}: PriceHistoryChartProps) {
  // Transform data for recharts (needs unified date keys)
  const chartData = useMemo(() => {
    // Collect all unique dates
    const dateSet = new Set<string>();
    for (const s of series) {
      for (const point of s.data) {
        dateSet.add(point.date);
      }
    }

    // Sort dates
    const dates = Array.from(dateSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Build data points with all series
    return dates.map((date) => {
      const point: Record<string, number | string | null> = {
        date,
        formattedDate: formatDate(date, dateFormat),
      };

      for (const s of series) {
        const dataPoint = s.data.find((d) => d.date === date);
        point[s.id] = dataPoint?.price ?? null;
      }

      // Add reference line
      if (yourPrice !== undefined) {
        point.yourPrice = yourPrice;
      }

      return point;
    });
  }, [series, yourPrice, dateFormat]);

  if (series.length === 0 || chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
        style={{ height }}
      >
        <p className="text-gray-500">No price history data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => `R${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [`R${value}`, '']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />
          )}

          {/* Your price reference line */}
          {yourPrice !== undefined && (
            <Line
              type="monotone"
              dataKey="yourPrice"
              name="Your Price"
              stroke="#1F2937"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          )}

          {/* Series lines */}
          {series.map((s, index) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={s.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateString: string, format: 'short' | 'medium' | 'long'): string {
  const date = new Date(dateString);

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
    case 'medium':
      return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      });
    case 'long':
      return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    default:
      return dateString;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PriceHistoryChart;
