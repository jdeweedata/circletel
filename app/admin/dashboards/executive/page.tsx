'use client';

import { useState, useEffect } from 'react';
import { PiArrowDownBold, PiArrowUpBold, PiChartBarBold, PiTrendDownBold, PiTrendUpBold, PiUsersBold, PiCurrencyDollarBold, PiWarningCircleBold } from 'react-icons/pi';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { PageHeader, StatCard, SectionCard } from '@/components/backend';
import { cn } from '@/lib/utils';
import { CHART_COLORS, STATUS_PALETTE, axisProps, gridProps, tooltipStyle, formatRand, formatRandTick } from '@/components/admin/dashboard/charts/chart-theme';

interface MRRTrendDatum {
  month: string;
  mrr: number;
  growth: number;
}

interface CustomerGrowthDatum {
  month: string;
  new_customers: number;
  churned_customers: number;
  net_growth: number;
}

interface RevenueSegmentDatum {
  name: string;
  value: number;
}

interface GeographicDatum {
  region: string;
  revenue: number;
}

interface ExecutiveMetrics {
  mrr: number;
  customer_count: number;
  churn_rate: number;
  gross_profit_percent: number;
  arpu: number;
  nps_score: number;
  mrr_trend: MRRTrendDatum[];
  customer_growth: CustomerGrowthDatum[];
  revenue_by_segment: RevenueSegmentDatum[];
  geographic_distribution: GeographicDatum[];
  executive_summary: {
    current: {
      mrr: number;
      customers: number;
      churn_rate: number;
      cac: number;
      ltv: number;
      payback_period: number;
    };
    previous_quarter: {
      mrr: number;
      customers: number;
      churn_rate: number;
      cac: number;
      ltv: number;
      payback_period: number;
    };
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    value?: string;
    threshold?: string;
  }>;
}

interface ExecutiveDashboardState {
  data: ExecutiveMetrics | null;
  isLoading: boolean;
  error: string | null;
}

export default function ExecutiveDashboard() {
  const [dashboardState, setDashboardState] = useState<ExecutiveDashboardState>({
    data: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchExecutiveMetrics = async () => {
      try {
        setDashboardState(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch('/api/admin/dashboards/executive');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch executive metrics');
        }

        setDashboardState(prev => ({
          ...prev,
          data: result.data,
          isLoading: false
        }));
      } catch (err) {
        console.error('Error fetching executive metrics:', err);
        setDashboardState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load dashboard',
          isLoading: false
        }));
      }
    };

    fetchExecutiveMetrics();
  }, []);

  if (dashboardState.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Executive Dashboard" subtitle="Strategic business metrics and KPIs" />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading executive metrics...</p>
        </div>
      </div>
    );
  }

  if (dashboardState.error) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Executive Dashboard" subtitle="Strategic business metrics and KPIs" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {dashboardState.error}</p>
        </div>
      </div>
    );
  }

  const data = dashboardState.data;
  if (!data) return null;

  // Calculate QoQ changes
  const mrrChange = ((data.executive_summary.current.mrr - data.executive_summary.previous_quarter.mrr) / data.executive_summary.previous_quarter.mrr * 100) || 0;
  const customerChange = ((data.executive_summary.current.customers - data.executive_summary.previous_quarter.customers) / data.executive_summary.previous_quarter.customers * 100) || 0;
  const churnChange = data.executive_summary.current.churn_rate - data.executive_summary.previous_quarter.churn_rate;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Executive Dashboard"
        subtitle="Strategic overview of business performance, growth metrics, and key indicators"
      />

      {/* Alerts / Red Flags */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex gap-3 p-4 rounded-lg border',
                alert.type === 'error' && 'bg-red-50 border-red-200',
                alert.type === 'warning' && 'bg-amber-50 border-amber-200',
                alert.type === 'info' && 'bg-blue-50 border-blue-200'
              )}
            >
              <div className={cn(
                'mt-0.5',
                alert.type === 'error' && 'text-red-600',
                alert.type === 'warning' && 'text-amber-600',
                alert.type === 'info' && 'text-blue-600'
              )}>
                <PiWarningCircleBold className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  'font-semibold text-sm',
                  alert.type === 'error' && 'text-red-900',
                  alert.type === 'warning' && 'text-amber-900',
                  alert.type === 'info' && 'text-blue-900'
                )}>
                  {alert.title}
                </p>
                <p className={cn(
                  'text-xs mt-1',
                  alert.type === 'error' && 'text-red-700',
                  alert.type === 'warning' && 'text-amber-700',
                  alert.type === 'info' && 'text-blue-700'
                )}>
                  {alert.description}
                  {alert.value && alert.threshold && (
                    <span className="block mt-1">Current: <strong>{alert.value}</strong> | Threshold: <strong>{alert.threshold}</strong></span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={`R${data.mrr.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
          icon={<PiCurrencyDollarBold className="h-5 w-5" />}
          trend={{ value: mrrChange, isPositive: mrrChange >= 0 }}
          subtitle={mrrChange > 0 ? `+${mrrChange.toFixed(1)}% QoQ` : `${mrrChange.toFixed(1)}% QoQ`}
        />
        <StatCard
          label="Total Customers"
          value={data.customer_count.toString()}
          icon={<PiUsersBold className="h-5 w-5" />}
          trend={{ value: customerChange, isPositive: customerChange >= 0 }}
          subtitle={customerChange > 0 ? `+${customerChange.toFixed(1)}% QoQ` : `${customerChange.toFixed(1)}% QoQ`}
        />
        <StatCard
          label="Churn Rate"
          value={`${data.churn_rate.toFixed(1)}%`}
          icon={<PiTrendDownBold className="h-5 w-5" />}
          trend={{ value: -churnChange, isPositive: churnChange <= 0 }}
          subtitle={churnChange <= 0 ? `Improved ${Math.abs(churnChange).toFixed(1)}%` : `Increased ${churnChange.toFixed(1)}%`}
        />
        <StatCard
          label="Gross Profit Margin"
          value={`${data.gross_profit_percent.toFixed(1)}%`}
          icon={<PiChartBarBold className="h-5 w-5" />}
          subtitle="Revenue minus COGS"
        />
        <StatCard
          label="Average Revenue Per User"
          value={`R${data.arpu.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
          icon={<PiCurrencyDollarBold className="h-5 w-5" />}
          subtitle="MRR per customer"
        />
        <StatCard
          label="NPS Score"
          value={data.nps_score.toString()}
          icon={<PiTrendUpBold className="h-5 w-5" />}
          subtitle="Net Promoter Score"
        />
      </div>

      {/* MRR Trend Chart */}
      <SectionCard title="MRR Trend (12 Months)" icon={PiCurrencyDollarBold}>
        {data.mrr_trend.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            No MRR trend data available
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.mrr_trend}>
                <defs>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={formatRandTick} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: string) => {
                    if (name === 'mrr') return [formatRand(value), 'MRR'];
                    if (name === 'growth') return [`${value.toFixed(1)}%`, 'Growth'];
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => `Month: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMRR)"
                  name="MRR"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      {/* Customer Growth Chart */}
      <SectionCard title="Customer Growth (12 Months)" icon={PiUsersBold}>
        {data.customer_growth.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            No customer growth data available
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.customer_growth}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: string) => {
                    if (name === 'new_customers') return [value, 'New Customers'];
                    if (name === 'churned_customers') return [value, 'Churned Customers'];
                    if (name === 'net_growth') return [value, 'Net Growth'];
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="new_customers"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="New Customers"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="churned_customers"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Churned Customers"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="net_growth"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  name="Net Growth"
                  dot={{ r: 4 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      {/* Revenue by Segment & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Segment - Pie Chart */}
        <SectionCard title="Revenue by Segment">
          {data.revenue_by_segment.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              No segment revenue data available
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.revenue_by_segment}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.revenue_by_segment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_PALETTE[index % STATUS_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatRand(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Geographic Distribution - Bar Chart */}
        <SectionCard title="Geographic Distribution">
          {data.geographic_distribution.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              No geographic distribution data available
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.geographic_distribution}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="region" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={formatRandTick} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [formatRand(value), 'Revenue']}
                  />
                  <Bar
                    dataKey="revenue"
                    fill={CHART_COLORS.revenue}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Executive Summary Table - QoQ Comparison */}
      <SectionCard title="Executive Summary - Quarter over Quarter Comparison">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Current Quarter</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Previous Quarter</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-medium">Monthly Recurring Revenue</td>
                <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                  R{data.executive_summary.current.mrr.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  R{data.executive_summary.previous_quarter.mrr.toLocaleString()}
                </td>
                <td className={cn(
                  'text-right py-3 px-4 font-semibold flex items-center justify-end gap-1',
                  mrrChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {mrrChange >= 0 ? <PiArrowUpBold className="h-4 w-4" /> : <PiArrowDownBold className="h-4 w-4" />}
                  {mrrChange > 0 ? '+' : ''}{mrrChange.toFixed(1)}%
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-medium">Total Customers</td>
                <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                  {data.executive_summary.current.customers}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {data.executive_summary.previous_quarter.customers}
                </td>
                <td className={cn(
                  'text-right py-3 px-4 font-semibold flex items-center justify-end gap-1',
                  customerChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {customerChange >= 0 ? <PiArrowUpBold className="h-4 w-4" /> : <PiArrowDownBold className="h-4 w-4" />}
                  {customerChange > 0 ? '+' : ''}{customerChange.toFixed(1)}%
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-medium">Churn Rate</td>
                <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                  {data.executive_summary.current.churn_rate.toFixed(2)}%
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {data.executive_summary.previous_quarter.churn_rate.toFixed(2)}%
                </td>
                <td className={cn(
                  'text-right py-3 px-4 font-semibold flex items-center justify-end gap-1',
                  churnChange <= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {churnChange <= 0 ? <PiArrowDownBold className="h-4 w-4" /> : <PiArrowUpBold className="h-4 w-4" />}
                  {churnChange > 0 ? '+' : ''}{churnChange.toFixed(2)}pp
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-medium">Customer Acquisition Cost</td>
                <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                  R{data.executive_summary.current.cac.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  R{data.executive_summary.previous_quarter.cac.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 font-semibold text-gray-600">
                  —
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-medium">Lifetime Value</td>
                <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                  R{data.executive_summary.current.ltv.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  R{data.executive_summary.previous_quarter.ltv.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 font-semibold text-gray-600">
                  —
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-medium">Payback Period</td>
                <td className="text-right py-3 px-4 text-gray-900 font-semibold">
                  {data.executive_summary.current.payback_period.toFixed(1)} months
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {data.executive_summary.previous_quarter.payback_period.toFixed(1)} months
                </td>
                <td className="text-right py-3 px-4 font-semibold text-gray-600">
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
