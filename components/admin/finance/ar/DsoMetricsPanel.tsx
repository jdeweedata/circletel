'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, TrendIcon, type ARAnalyticsData } from './shared';

export function DsoMetricsPanel({ data }: { data: ARAnalyticsData }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current DSO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.dso.dso_current.toFixed(1)}</div>
            <p className="text-muted-foreground">days</p>
            <div className="mt-4 flex items-center gap-2">
              <TrendIcon trend={data.dso.dso_trend} />
              <span className="text-sm capitalize">{data.dso.dso_trend}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Possible DSO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{data.dso.best_possible_dso.toFixed(1)}</div>
            <p className="text-muted-foreground">days</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Gap: {(data.dso.dso_current - data.dso.best_possible_dso).toFixed(1)} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collection Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{data.dso.collection_effectiveness_index.toFixed(1)}%</div>
            <p className="text-muted-foreground">CEI</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Target: 80%+
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{data.collection.total_notifications_sent}</div>
              <p className="text-sm text-muted-foreground">Notifications Sent</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{formatCurrency(data.collection.total_amount_collected)}</div>
              <p className="text-sm text-muted-foreground">Amount Collected</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{data.collection.avg_days_to_payment.toFixed(1)}</div>
              <p className="text-sm text-muted-foreground">Avg Days to Payment</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{data.collection.response_rate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
