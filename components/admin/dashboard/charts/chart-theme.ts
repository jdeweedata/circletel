/**
 * Shared theme for the admin dashboard charts.
 *
 * Single source of truth for brand-aligned colours, axis/grid/tooltip styling,
 * and currency formatters so the Revenue, Customer-growth and Order-status
 * charts stay visually consistent with the unified backend UI kit.
 *
 * Brand hexes mirror tailwind.config.ts `colors.circleTel`
 * (orange #E87A1E, navy #1B2A4A).
 */

/** Semantic colours for the two-series bar/area charts. */
export const CHART_COLORS = {
  revenue: '#E87A1E', // circleTel-orange — primary accent
  orders: '#E87A1E', // orange
  customers: '#1B2A4A', // circleTel-navy
} as const;

/**
 * Ordered palette for the order-status donut. Anchored on brand orange/navy
 * with harmonizing accents; cycled by index. Red is last so it tends to land
 * on error/failure-type statuses.
 */
export const STATUS_PALETTE = [
  '#E87A1E', // orange
  '#1B2A4A', // navy
  '#F59E0B', // amber
  '#0E7C86', // teal
  '#64748B', // slate
  '#EF4444', // red
] as const;

/** Shared XAxis/YAxis styling. Spread onto <XAxis {...axisProps} />. */
export const axisProps = {
  stroke: '#6B7280',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

/** Shared CartesianGrid styling. */
export const gridProps = {
  strokeDasharray: '3 3',
  vertical: false,
  stroke: '#E5E7EB',
} as const;

/** Shared Recharts <Tooltip contentStyle={tooltipStyle} />. */
export const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

/** Full Rand value with thousands separators — for tooltips. e.g. R12,345 */
export function formatRand(value: number): string {
  return `R${value.toLocaleString()}`;
}

/** Compact Rand value for axis ticks. e.g. R45k, R1.2m */
export function formatRandTick(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `R${value}`;
}
