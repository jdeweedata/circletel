'use client';

/**
 * Market Position Chart Component
 *
 * Displays your market position relative to competitors
 * using a bar chart with your price highlighted.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

// =============================================================================
// TYPES
// =============================================================================

export interface CompetitorPrice {
  id: string;
  name: string;
  price: number;
  logo?: string | null;
}

export interface MarketPositionChartProps {
  /** Competitor prices */
  competitors: CompetitorPrice[];
  /** Your price */
  yourPrice: number;
  /** Your product name */
  yourName?: string;
  /** Chart height */
  height?: number;
  /** Show average line */
  showAverage?: boolean;
  /** Orientation */
  orientation?: 'vertical' | 'horizontal';
}

// =============================================================================
// COLORS
// =============================================================================

const COLORS = {
  yourPrice: '#F5831F',      // CircleTel Orange
  belowYou: '#10B981',       // Green (good - competitor higher)
  aboveYou: '#EF4444',       // Red (bad - competitor lower)
  equal: '#6B7280',          // Gray
  average: '#8B5CF6',        // Purple
};

// =============================================================================
// COMPONENT
// =============================================================================

export function MarketPositionChart({
  competitors,
  yourPrice,
  yourName = 'Your Price',
  height = 300,
  showAverage = true,
  orientation = 'vertical',
}: MarketPositionChartProps) {
  // Prepare data with your price included
  const chartData = useMemo(() => {
    const data = [
      ...competitors.map((c) => ({
        name: c.name,
        price: c.price,
        isYours: false,
        logo: c.logo,
      })),
      {
        name: yourName,
        price: yourPrice,
        isYours: true,
        logo: null,
      },
    ];

    // Sort by price
    return data.sort((a, b) => a.price - b.price);
  }, [competitors, yourPrice, yourName]);

  // Calculate average
  const averagePrice = useMemo(() => {
    const prices = competitors.map((c) => c.price);
    if (prices.length === 0) return yourPrice;
    return prices.reduce((sum, p) => sum + p, 0) / prices.length;
  }, [competitors, yourPrice]);

  // Get color for each bar
  const getBarColor = (entry: typeof chartData[0]) => {
    if (entry.isYours) return COLORS.yourPrice;
    if (entry.price > yourPrice) return COLORS.belowYou;
    if (entry.price < yourPrice) return COLORS.aboveYou;
    return COLORS.equal;
  };

  if (competitors.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
        style={{ height }}
      >
        <p className="text-gray-500">No competitor data available</p>
      </div>
    );
  }

  if (orientation === 'horizontal') {
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => `R${value}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number) => [`R${value}`, 'Price']}
            />
            {showAverage && (
              <ReferenceLine
                x={averagePrice}
                stroke={COLORS.average}
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `Avg: R${Math.round(averagePrice)}`,
                  position: 'top',
                  fill: COLORS.average,
                  fontSize: 12,
                }}
              />
            )}
            <Bar dataKey="price" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry)}
                  stroke={entry.isYours ? '#1F2937' : 'transparent'}
                  strokeWidth={entry.isYours ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Vertical orientation (default)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `R${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [`R${value}`, 'Price']}
          />
          {showAverage && (
            <ReferenceLine
              y={averagePrice}
              stroke={COLORS.average}
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Avg: R${Math.round(averagePrice)}`,
                position: 'right',
                fill: COLORS.average,
                fontSize: 12,
              }}
            />
          )}
          <Bar dataKey="price" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry)}
                stroke={entry.isYours ? '#1F2937' : 'transparent'}
                strokeWidth={entry.isYours ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.yourPrice }} />
          <span className="text-gray-600">Your Price</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.belowYou }} />
          <span className="text-gray-600">Higher than you</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.aboveYou }} />
          <span className="text-gray-600">Lower than you</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MARKET SEGMENT CHART
// =============================================================================

export interface SegmentData {
  segment: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  productCount: number;
}

export interface MarketSegmentChartProps {
  segments: SegmentData[];
  height?: number;
}

export function MarketSegmentChart({
  segments,
  height = 300,
}: MarketSegmentChartProps) {
  if (segments.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
        style={{ height }}
      >
        <p className="text-gray-500">No segment data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={segments}
          margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="segment"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `R${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              const label =
                name === 'avgPrice'
                  ? 'Average'
                  : name === 'minPrice'
                  ? 'Minimum'
                  : 'Maximum';
              return [`R${value}`, label];
            }}
          />
          <Bar dataKey="avgPrice" name="Average" fill="#F5831F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default MarketPositionChart;
