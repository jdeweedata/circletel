'use client';

import React, { useEffect, useState } from 'react';
import { PiTrendUpBold, PiBriefcaseBold, PiTargetBold, PiCheckCircleBold } from 'react-icons/pi';
import {
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
  ResponsiveContainer,
  FunnelChart,
  Funnel,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricStatCard } from '@/components/admin/MetricStatCard';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PiArrowsClockwiseBold } from 'react-icons/pi';

interface SalesKPIs {
  activeDeals: number;
  pipelineValue: number;
  winRate: number;
  avgDealSize: number;
  monthlyTrend?: Array<{ month: string; value: number }>;
}

interface QuoteData {
  id: string;
  quote_number: string;
  company_name: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  sales_rep?: string;
}

interface TopPerformer {
  name: string;
  dealsClosed: number;
  totalValue: number;
  conversionRate: number;
}

export default function SalesDashboard() {
  const { user } = useAdminAuth();
  const [kpis, setKpis] = useState<SalesKPIs>({
    activeDeals: 0,
    pipelineValue: 0,
    winRate: 0,
    avgDealSize: 0,
  });

  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dealPipelineData, setDealPipelineData] = useState<Array<{ name: string; value: number }>>([]);
  const [quoteStatusData, setQuoteStatusData] = useState<Array<{ name: string; value: number; color?: string }>>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<Array<{ month: string; sales: number }>>([]);
  const [salesByTerritoryData, setSalesByTerritoryData] = useState<Array<{ territory: string; value: number }>>([]);

  const COLORS = ['#E87A1E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard data from API
      const response = await fetch('/api/admin/dashboards/sales');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();

      setKpis({
        activeDeals: data.activeDeals || 0,
        pipelineValue: data.pipelineValue || 0,
        winRate: data.winRate || 0,
        avgDealSize: data.avgDealSize || 0,
      });

      setQuotes(data.quotes || []);
      setTopPerformers(data.topPerformers || []);
      setDealPipelineData(data.dealPipelineData || []);
      setQuoteStatusData(data.quoteStatusData || []);
      setMonthlySalesData(data.monthlySalesData || []);
      setSalesByTerritoryData(data.salesByTerritoryData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'default';
      case 'pending_approval':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusDisplay = (status: string): string => {
    return status
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Please log in to access the sales dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-gray-600 mt-1">Pipeline visibility, conversion metrics, deal tracking</p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <PiArrowsClockwiseBold className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricStatCard
            title="Active Deals"
            value={kpis.activeDeals}
            trend={{ value: 12, label: 'from last month', isPositive: true }}
            chartData={[
              { value: 8 },
              { value: 12 },
              { value: 15 },
              { value: 18 },
              { value: kpis.activeDeals },
            ]}
            icon={<PiBriefcaseBold className="h-5 w-5" />}
          />
          <MetricStatCard
            title="Pipeline Value"
            value={formatCurrency(kpis.pipelineValue)}
            trend={{ value: 8, label: 'from last month', isPositive: true }}
            chartData={[
              { value: Math.floor(kpis.pipelineValue * 0.7) },
              { value: Math.floor(kpis.pipelineValue * 0.8) },
              { value: Math.floor(kpis.pipelineValue * 0.9) },
              { value: kpis.pipelineValue },
            ]}
            icon={<PiTargetBold className="h-5 w-5" />}
          />
          <MetricStatCard
            title="Win Rate"
            value={`${kpis.winRate.toFixed(1)}%`}
            trend={{ value: 3, label: 'from last quarter', isPositive: true }}
            chartData={[
              { value: kpis.winRate * 0.8 },
              { value: kpis.winRate * 0.9 },
              { value: kpis.winRate },
            ]}
            suffix="%"
            icon={<PiCheckCircleBold className="h-5 w-5" />}
          />
          <MetricStatCard
            title="Avg Deal Size"
            value={formatCurrency(kpis.avgDealSize)}
            trend={{ value: 5, label: 'from last quarter', isPositive: true }}
            chartData={[
              { value: Math.floor(kpis.avgDealSize * 0.85) },
              { value: Math.floor(kpis.avgDealSize * 0.92) },
              { value: kpis.avgDealSize },
            ]}
            icon={<PiTrendUpBold className="h-5 w-5" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Deal Pipeline Funnel */}
          <Card className="p-6 border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Pipeline</h3>
            {dealPipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Funnel
                    data={dealPipelineData}
                    dataKey="value"
                    stroke="none"
                    fill="#E87A1E"
                  >
                    {dealPipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-400">
                No data available
              </div>
            )}
          </Card>

          {/* Quote Status Breakdown */}
          <Card className="p-6 border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Status</h3>
            {quoteStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={quoteStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#E87A1E"
                    dataKey="value"
                  >
                    {quoteStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-400">
                No data available
              </div>
            )}
          </Card>

          {/* Monthly Sales Trend */}
          <Card className="p-6 border border-gray-200 bg-white shadow-sm lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Trend</h3>
            {monthlySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#E87A1E"
                    strokeWidth={2}
                    dot={{ fill: '#E87A1E', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-400">
                No data available
              </div>
            )}
          </Card>

          {/* Sales by Territory */}
          <Card className="p-6 border border-gray-200 bg-white shadow-sm lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Territory</h3>
            {salesByTerritoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByTerritoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="territory" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#E87A1E" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-400">
                No data available
              </div>
            )}
          </Card>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Quotes Table */}
          <Card className="p-6 border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Quotes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-700 font-medium">
                    <th className="pb-3 px-4">Company</th>
                    <th className="pb-3 px-4 text-right">Amount</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4 text-right">Days in Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.length > 0 ? (
                    quotes.slice(0, 10).map((quote) => {
                      const daysInStage = Math.floor(
                        (new Date().getTime() - new Date(quote.updated_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr
                          key={quote.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            {quote.company_name}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">
                            {formatCurrency(quote.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadgeVariant(quote.status)}>
                              {getStatusDisplay(quote.status)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {daysInStage} days
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-gray-400">
                        No quotes available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top Performers Table */}
          <Card className="p-6 border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-700 font-medium">
                    <th className="pb-3 px-4">Sales Rep</th>
                    <th className="pb-3 px-4 text-right">Deals Closed</th>
                    <th className="pb-3 px-4 text-right">Total Value</th>
                    <th className="pb-3 px-4 text-right">Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.length > 0 ? (
                    topPerformers.map((performer, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          {performer.name}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {performer.dealsClosed}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {formatCurrency(performer.totalValue)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {performer.conversionRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-gray-400">
                        No performer data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
