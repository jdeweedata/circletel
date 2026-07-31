'use client';

import { useEffect, useState } from 'react';
import { PiArrowsClockwiseBold, PiClockBold, PiCurrencyDollarBold, PiPulseBold, PiTargetBold } from 'react-icons/pi';
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
import { HealthCard, formatRand } from '@/components/admin/billing/health';
import {
  ArAgingPanel,
  DsoMetricsPanel,
  HistoryPanel,
  NotificationsPanel,
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
          {formatRand(data.ar_aging.total_outstanding_amount)} outstanding
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard
          label="Total Outstanding"
          value={formatRand(data.ar_aging.total_outstanding_amount)}
          primaryLine={`${data.ar_aging.total_outstanding_invoices} open invoices`}
          primaryClassName="text-orange-500"
          secondaryLine="Accounts receivable balance"
          icon={<PiCurrencyDollarBold className="h-5 w-5" />}
          iconClassName="bg-orange-50 text-orange-500"
        />
        <HealthCard
          label="Days Sales Outstanding"
          value={data.dso.dso_current.toFixed(1)}
          primaryLine={data.dso.dso_trend.charAt(0).toUpperCase() + data.dso.dso_trend.slice(1)}
          primaryClassName={
            data.dso.dso_trend === 'improving'
              ? 'text-teal-600'
              : data.dso.dso_trend === 'worsening'
                ? 'text-red-600'
                : undefined
          }
          secondaryLine={`30-day avg: ${data.dso.dso_30_day_avg.toFixed(1)} days`}
          icon={<PiClockBold className="h-5 w-5" />}
          iconClassName="bg-slate-100 text-slate-600"
        />
        <HealthCard
          label="Collection Rate"
          value={`${data.collection.collection_rate.toFixed(1)}%`}
          primaryLine={`${formatRand(data.collection.total_amount_collected)} collected`}
          primaryClassName="text-teal-600"
          secondaryLine={`Last ${period} days`}
          icon={<PiTargetBold className="h-5 w-5" />}
          iconClassName="bg-teal-50 text-teal-600"
        />
        <HealthCard
          label="Notifications Sent"
          value={`${data.notifications.total_sms + data.notifications.total_email}`}
          primaryLine={`${data.notifications.delivery_rate.toFixed(1)}% delivery rate`}
          primaryClassName="text-blue-600"
          secondaryLine="SMS & email reminders"
          icon={<PiPulseBold className="h-5 w-5" />}
          iconClassName="bg-blue-50 text-blue-600"
        />
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
