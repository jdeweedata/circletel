'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/backend';
import { TrendIcon, formatCurrency, type ARAnalyticsData } from './shared';

export function DsoMetricsPanel({ data }: { data: ARAnalyticsData }) {
  const gap = data.dso.dso_current - data.dso.best_possible_dso;

  const performance = [
    { label: 'Notifications sent', value: `${data.collection.total_notifications_sent}` },
    { label: 'Amount collected', value: formatCurrency(data.collection.total_amount_collected) },
    { label: 'Avg days to payment', value: data.collection.avg_days_to_payment.toFixed(1) },
    { label: 'Response rate', value: `${data.collection.response_rate.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Current DSO"
          value={data.dso.dso_current.toFixed(1)}
          subtitle="days"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <TrendIcon trend={data.dso.dso_trend} />
            <span className="capitalize">{data.dso.dso_trend}</span>
          </span>
        </MetricCard>

        <MetricCard
          title="Best Possible DSO"
          value={data.dso.best_possible_dso.toFixed(1)}
          subtitle="days"
          delta={`Gap: ${gap.toFixed(1)} days`}
          deltaPositive={gap <= 0}
        />

        <MetricCard
          title="Collection Effectiveness"
          value={`${data.dso.collection_effectiveness_index.toFixed(1)}%`}
          subtitle="CEI"
          delta="Target: 80%+"
          deltaPositive={data.dso.collection_effectiveness_index >= 80}
        />
      </div>

      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Collection Performance
          </CardTitle>
          <p className="text-xs text-slate-500">Notification volume and payment response</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {performance.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-semibold tabular-nums text-slate-900 mt-1">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
