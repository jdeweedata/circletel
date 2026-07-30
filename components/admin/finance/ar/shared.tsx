'use client';

import { PiMinusBold, PiTrendDownBold, PiTrendUpBold } from 'react-icons/pi';

/** Response shape of GET /api/admin/finance/ar-analytics — moved from the page. */
export interface ARAnalyticsData {
  ar_aging: {
    total_outstanding_invoices: number;
    total_outstanding_amount: number;
    current_count: number;
    current_amount: number;
    overdue_1_30_count: number;
    overdue_1_30_amount: number;
    overdue_31_60_count: number;
    overdue_31_60_amount: number;
    overdue_61_90_count: number;
    overdue_61_90_amount: number;
    overdue_90_plus_count: number;
    overdue_90_plus_amount: number;
    avg_days_overdue: number;
  };
  dso: {
    dso_current: number;
    dso_30_day_avg: number;
    dso_trend: 'improving' | 'stable' | 'worsening';
    best_possible_dso: number;
    collection_effectiveness_index: number;
  };
  collection: {
    total_notifications_sent: number;
    total_amount_collected: number;
    collection_rate: number;
    avg_days_to_payment: number;
    response_rate: number;
  };
  notifications: {
    total_sms: number;
    total_email: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
  };
  daily_analytics: Array<{
    date: string;
    notification_type: string;
    total_sent: number;
    delivered: number;
    failed: number;
    total_amount_notified: number;
  }>;
  recent_notifications: Array<{
    id: string;
    invoice_number: string;
    notification_type: string;
    recipient: string;
    status: string;
    amount_due: number;
    days_overdue: number;
    created_at: string;
  }>;
  historical: Array<{
    snapshot_date: string;
    total_outstanding: number;
    dso_current: number;
    sms_sent_count: number;
    email_sent_count: number;
    payments_received_amount: number;
  }> | null;
}

/**
 * Aging severity ramp — green to dark red by age. Semantic, NOT the chart palette.
 * Do not replace with --chart-* vars; the hue is the "how overdue" signal.
 */
export const AGING_COLORS = {
  current: '#22c55e',
  overdue_1_30: '#eab308',
  overdue_31_60: '#f97316',
  overdue_61_90: '#ef4444',
  overdue_90_plus: '#991b1b',
} as const;

/** Notification channel identity — used in chart, legend, and table badges. */
export const CHANNEL_COLORS = {
  sms: '#3b82f6',
  email: '#8b5cf6',
} as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
  });
}

/** Down = improving for DSO (fewer days is better), so the arrow is inverted on purpose. */
export function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') {
    return <PiTrendDownBold className="h-4 w-4 text-green-600" aria-hidden="true" />;
  }
  if (trend === 'worsening') {
    return <PiTrendUpBold className="h-4 w-4 text-red-600" aria-hidden="true" />;
  }
  return <PiMinusBold className="h-4 w-4 text-slate-400" aria-hidden="true" />;
}

export interface AgingBucket {
  name: string;
  amount: number;
  count: number;
  fill: string;
}

export function buildAgingBuckets(aging: ARAnalyticsData['ar_aging']): AgingBucket[] {
  return [
    { name: 'Current', amount: aging.current_amount, count: aging.current_count, fill: AGING_COLORS.current },
    { name: '1-30 Days', amount: aging.overdue_1_30_amount, count: aging.overdue_1_30_count, fill: AGING_COLORS.overdue_1_30 },
    { name: '31-60 Days', amount: aging.overdue_31_60_amount, count: aging.overdue_31_60_count, fill: AGING_COLORS.overdue_31_60 },
    { name: '61-90 Days', amount: aging.overdue_61_90_amount, count: aging.overdue_61_90_count, fill: AGING_COLORS.overdue_61_90 },
    { name: '90+ Days', amount: aging.overdue_90_plus_amount, count: aging.overdue_90_plus_count, fill: AGING_COLORS.overdue_90_plus },
  ];
}
