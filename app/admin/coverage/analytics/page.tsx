'use client';
import { PiArrowsClockwiseBold, PiCheckCircleBold, PiClockBold, PiDownloadSimpleBold, PiGlobeBold, PiWarningBold } from 'react-icons/pi';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  KonnecktStatCard,
  ActionRequiredPanel,
  AtRiskSection,
  TransactionsTable,
  type ActionItem,
  type AtRiskProvider,
  type ErrorCollection,
  type TransactionRecord,
} from '@/components/admin/coverage/analytics';

interface TimeSeriesData {
  timestamp: string;
  requests: number;
  successRate: number;
  responseTime: number;
  errors: number;
}

interface ProvinceData {
  province: string;
  requests: number;
  successRate: number;
  avgResponseTime: number;
}

interface ErrorDistribution {
  type: string;
  count: number;
  percentage: number;
}

export default function CoverageAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [provinceData, setProvinceData] = useState<ProvinceData[]>([]);
  const [errorData, setErrorData] = useState<ErrorDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Generate mock data for demonstration
  const generateMockData = () => {
    const now = new Date();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const interval = timeRange === '24h' ? 1 : timeRange === '7d' ? 4 : 24;

    // Time series data
    const timeSeries: TimeSeriesData[] = [];
    for (let i = hours; i >= 0; i -= interval) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      timeSeries.push({
        timestamp: timestamp.toISOString().slice(11, 16),
        requests: Math.floor(Math.random() * 100) + 50,
        successRate: Math.random() * 10 + 90,
        responseTime: Math.random() * 1000 + 500,
        errors: Math.floor(Math.random() * 5),
      });
    }

    // Province data
    const provinces = [
      'Gauteng',
      'Western Cape',
      'KwaZulu-Natal',
      'Eastern Cape',
      'Limpopo',
      'Mpumalanga',
      'North West',
      'Free State',
      'Northern Cape',
    ];
    const provinceStats: ProvinceData[] = provinces.map((province) => ({
      province,
      requests: Math.floor(Math.random() * 500) + 100,
      successRate: Math.random() * 15 + 85,
      avgResponseTime: Math.random() * 800 + 400,
    }));

    // Error distribution
    const errorTypes = [
      'TIMEOUT',
      'API_ERROR',
      'RATE_LIMITED',
      'INVALID_RESPONSE',
      'CONNECTION_FAILED',
      'AUTH_FAILED',
    ];
    const errors: ErrorDistribution[] = errorTypes.map((type) => {
      const count = Math.floor(Math.random() * 30) + 5;
      return { type, count, percentage: 0 };
    });
    const totalErrors = errors.reduce((sum, e) => sum + e.count, 0);
    errors.forEach((e) => (e.percentage = (e.count / totalErrors) * 100));

    setTimeSeriesData(timeSeries);
    setProvinceData(provinceStats);
    setErrorData(errors);
  };

  const fetchAnalyticsData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/coverage/analytics?range=${timeRange}`);
      const result = await response.json();

      if (result.success && result.data) {
        setTimeSeriesData(result.data.timeSeries || []);
        setProvinceData(result.data.provinceData || []);
        setErrorData(result.data.errorData || []);
      } else {
        generateMockData();
      }
    } catch {
      generateMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const exportAnalytics = async () => {
    const data = {
      timeRange,
      generated: new Date().toISOString(),
      summary: {
        totalRequests: timeSeriesData.reduce((sum, d) => sum + d.requests, 0),
        avgSuccessRate:
          timeSeriesData.reduce((sum, d) => sum + d.successRate, 0) /
          timeSeriesData.length,
        avgResponseTime:
          timeSeriesData.reduce((sum, d) => sum + d.responseTime, 0) /
          timeSeriesData.length,
      },
      provinces: provinceData,
      errors: errorData,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coverage-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Computed stats
  const totalRequests = timeSeriesData.reduce((sum, d) => sum + d.requests, 0);
  const avgSuccessRate =
    timeSeriesData.length > 0
      ? timeSeriesData.reduce((sum, d) => sum + d.successRate, 0) / timeSeriesData.length
      : 0;
  const avgResponseTime =
    timeSeriesData.length > 0
      ? timeSeriesData.reduce((sum, d) => sum + d.responseTime, 0) / timeSeriesData.length
      : 0;
  const totalErrors = timeSeriesData.reduce((sum, d) => sum + d.errors, 0);

  // Mock action items
  const actionItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];
    // Generate mock action items based on error rate
    const errorProviders = provinceData.filter((p) => p.successRate < 92);
    errorProviders.forEach((provider) => {
      items.push({
        id: `action-${provider.province}`,
        type: provider.successRate < 88 ? 'error' : 'warning',
        title: `${provider.province} - High Error Rate`,
        description: `Success rate dropped to ${provider.successRate.toFixed(1)}%`,
        timestamp: new Date(Date.now() - Math.random() * 3600000 * 4),
      });
    });
    if (avgResponseTime > 1000) {
      items.push({
        id: 'action-latency',
        type: 'warning',
        title: 'High API Latency Detected',
        description: `Average response time is ${avgResponseTime.toFixed(0)}ms`,
        timestamp: new Date(Date.now() - 1800000),
      });
    }
    return items;
  }, [provinceData, avgResponseTime]);

  // Mock at-risk providers
  const atRiskProviders: AtRiskProvider[] = useMemo(() => {
    return [
      { name: 'MTN WMS', errorRate: 8.2, requestCount: 1234 },
      { name: 'Tarana API', errorRate: 5.1, requestCount: 892 },
      { name: 'DFA Fiber', errorRate: 2.3, requestCount: 567 },
      { name: 'LTE Fallback', errorRate: 1.1, requestCount: 345 },
    ].filter((p) => p.errorRate > 0);
  }, []);

  // Error collections from errorData
  const errorCollections: ErrorCollection[] = useMemo(() => {
    return errorData.map((e) => ({
      type: e.type,
      count: e.count,
    }));
  }, [errorData]);

  // Mock recent transactions
  const recentTransactions: TransactionRecord[] = useMemo(() => {
    const providers = ['MTN WMS', 'Tarana API', 'DFA Fiber', 'LTE Fallback', '5G Check'];
    const statuses: TransactionRecord['status'][] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED', 'TIMEOUT'];
    return Array.from({ length: 15 }, (_, i) => ({
      id: `req_${Date.now().toString(36)}_${i}${Math.random().toString(36).slice(2, 8)}`,
      provider: providers[Math.floor(Math.random() * providers.length)],
      timestamp: new Date(Date.now() - i * 60000 * (1 + Math.random() * 5)),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      responseTime:
        statuses[Math.floor(Math.random() * statuses.length)] !== 'TIMEOUT'
          ? Math.floor(Math.random() * 800) + 150
          : undefined,
    }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl" />
              <div className="h-80 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
            <p className="text-sm text-gray-500 mt-1">
              Coverage API performance and health metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAnalyticsData}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <PiArrowsClockwiseBold className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={exportAnalytics}
              size="sm"
              className="bg-[#F5831F] hover:bg-[#D76026] text-white"
            >
              <PiDownloadSimpleBold className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KonnecktStatCard
            label="Total Requests"
            value={totalRequests}
            trend={{ value: 12.5, isPositive: true }}
            subtext={`vs. previous ${timeRange === '24h' ? '24 hours' : timeRange}`}
            icon={<PiGlobeBold className="h-5 w-5" />}
          />
          <KonnecktStatCard
            label="Avg Success Rate"
            value={`${avgSuccessRate.toFixed(1)}%`}
            trend={{ value: 2.1, isPositive: avgSuccessRate > 95 }}
            subtext="Target: 99.5%"
            icon={<PiCheckCircleBold className="h-5 w-5" />}
          />
          <KonnecktStatCard
            label="Failed Requests"
            value={totalErrors}
            trend={{ value: 8.3, isPositive: false }}
            subtext={`${((totalErrors / totalRequests) * 100).toFixed(2)}% of total`}
            icon={<PiWarningBold className="h-5 w-5" />}
          />
          <KonnecktStatCard
            label="Avg Response Time"
            value={`${avgResponseTime.toFixed(0)}ms`}
            trend={{
              value: 5.2,
              isPositive: avgResponseTime < 800,
            }}
            subtext="Target: <500ms"
            icon={<PiClockBold className="h-5 w-5" />}
          />
        </div>

        {/* Chart + Action Required */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Request Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Request Activity</h3>
              <span className="text-xs text-gray-400">
                {timeRange === '24h' ? 'Hourly' : timeRange === '7d' ? '4-hour intervals' : 'Daily'}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5831F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F5831F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#F5831F"
                  strokeWidth={2}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Action Required Panel */}
          <ActionRequiredPanel
            items={actionItems}
            onViewAll={() => console.log('View all alerts')}
          />
        </div>

        {/* At Risk + Error Collections */}
        <AtRiskSection providers={atRiskProviders} errorCollections={errorCollections} />

        {/* Recent Transactions Table */}
        <TransactionsTable
          transactions={recentTransactions}
          onViewAll={() => console.log('View all transactions')}
        />
      </div>
    </div>
  );
}
