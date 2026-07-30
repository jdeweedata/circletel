'use client';

import { useEffect, useState } from 'react';
import { PiArrowsClockwiseBold, PiClockBold, PiCurrencyDollarBold, PiPulseBold, PiTargetBold } from 'react-icons/pi';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AdminPage,
  LoadingState,
  ErrorState,
  Tabs,
  ConsoleTabsList,
  ConsoleTabsContent,
} from '@/components/backend';
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Finance / Receivables / AR Analytics</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            AR Analytics &amp; Collections
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Accounts Receivable, DSO tracking, and notification effectiveness
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] rounded-lg border-slate-200" aria-label="Reporting period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
          Supabase AR snapshot
        </Badge>
        <span className="text-xs text-slate-400">Last {period} days</span>
        <span className="text-xs text-slate-500">
          {data.ar_aging.total_outstanding_invoices} open invoices ·{' '}
          {formatCurrency(data.ar_aging.total_outstanding_amount)} outstanding
        </span>
      </div>

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

      <Tabs defaultValue="aging" className="space-y-4">
        <ConsoleTabsList
          items={[
            { value: 'aging', label: 'AR Aging' },
            { value: 'dso', label: 'DSO & Metrics' },
            { value: 'notifications', label: 'Notifications' },
            { value: 'history', label: 'History' },
          ]}
        />
        <ConsoleTabsContent value="aging">
          <ArAgingPanel data={data} />
        </ConsoleTabsContent>
        <ConsoleTabsContent value="dso">
          <DsoMetricsPanel data={data} />
        </ConsoleTabsContent>
        <ConsoleTabsContent value="notifications">
          <NotificationsPanel data={data} />
        </ConsoleTabsContent>
        <ConsoleTabsContent value="history">
          <HistoryPanel data={data} />
        </ConsoleTabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <PiClockBold className="w-4 h-4" aria-hidden="true" />
          {refreshing ? 'Refreshing…' : `AR snapshot · last ${period} days`}
        </span>
      </div>
    </AdminPage>
  );
}
