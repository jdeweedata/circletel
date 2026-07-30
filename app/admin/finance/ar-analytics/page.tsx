'use client';

import { useEffect, useState } from 'react';
import { PiArrowsClockwiseBold, PiClockBold, PiCurrencyDollarBold, PiPulseBold, PiTargetBold } from 'react-icons/pi';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPage, PageHeader, LoadingState, ErrorState } from '@/components/backend';
import {
  ArAgingPanel,
  DsoMetricsPanel,
  HistoryPanel,
  NotificationsPanel,
  TrendIcon,
  formatCurrency,
  type ARAnalyticsData,
} from '@/components/admin/finance/ar';

/**
 * AR Analytics Dashboard
 * /admin/finance/ar-analytics
 *
 * Comprehensive Accounts Receivable analytics including:
 * - AR Aging breakdown
 * - DSO (Days Sales Outstanding) metrics
 * - Notification tracking and effectiveness
 * - Collection performance
 */

export default function ARAnalyticsPage() {
  const [data, setData] = useState<ARAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/finance/ar-analytics?days=${period}&history=true`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch AR analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading AR analytics..." />
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage>
        <ErrorState title="Failed to load AR analytics" onRetry={handleRefresh} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="AR Analytics & Collections"
        subtitle="Accounts Receivable, DSO tracking, and notification effectiveness"
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
              <PiArrowsClockwiseBold className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PiCurrencyDollarBold className="h-4 w-4" />
              Total Outstanding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(data.ar_aging.total_outstanding_amount)}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.ar_aging.total_outstanding_invoices} invoices
            </p>
          </CardContent>
        </Card>

        {/* DSO */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PiClockBold className="h-4 w-4" />
              Days Sales Outstanding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.dso.dso_current.toFixed(1)}</span>
              <TrendIcon trend={data.dso.dso_trend} />
            </div>
            <p className="text-sm text-muted-foreground">
              30-day avg: {data.dso.dso_30_day_avg.toFixed(1)} days
            </p>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PiTargetBold className="h-4 w-4" />
              Collection Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.collection.collection_rate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(data.collection.total_amount_collected)} collected
            </p>
          </CardContent>
        </Card>

        {/* Notifications Sent */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PiPulseBold className="h-4 w-4" />
              Notifications Sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.notifications.total_sms + data.notifications.total_email}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.notifications.delivery_rate.toFixed(1)}% delivery rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="aging" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aging">AR Aging</TabsTrigger>
          <TabsTrigger value="dso">DSO &amp; Metrics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="aging" className="space-y-4">
          <ArAgingPanel data={data} />
        </TabsContent>
        <TabsContent value="dso" className="space-y-4">
          <DsoMetricsPanel data={data} />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <NotificationsPanel data={data} />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <HistoryPanel data={data} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
