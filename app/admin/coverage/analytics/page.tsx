'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Database,
  Signal,
  Globe,
  Users,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

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

interface PerformanceTrend {
  period: string;
  p50: number;
  p95: number;
  p99: number;
}

export default function CoverageAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [provinceData, setProvinceData] = useState<ProvinceData[]>([]);
  const [errorData, setErrorData] = useState<ErrorDistribution[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data generation for demonstration
  const generateMockData = () => {
    const now = new Date();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 24h, 7d, 30d
    const interval = timeRange === '24h' ? 1 : timeRange === '7d' ? 4 : 24; // hourly, 4-hourly, daily

    // Time series data
    const timeSeries: TimeSeriesData[] = [];
    for (let i = hours; i >= 0; i -= interval) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      timeSeries.push({
        timestamp: timestamp.toISOString().slice(11, 16), // HH:MM format
        requests: Math.floor(Math.random() * 100) + 50,
        successRate: Math.random() * 10 + 90, // 90-100%
        responseTime: Math.random() * 1000 + 500, // 500-1500ms
        errors: Math.floor(Math.random() * 5)
      });
    }

    // Province data
    const provinces = [
      'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
      'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
    ];
    const provinceStats: ProvinceData[] = provinces.map(province => ({
      province,
      requests: Math.floor(Math.random() * 500) + 100,
      successRate: Math.random() * 15 + 85, // 85-100%
      avgResponseTime: Math.random() * 800 + 400 // 400-1200ms
    }));

    // Error distribution
    const errorTypes = [
      'WMS_REQUEST_FAILED', 'LAYER_NOT_AVAILABLE', 'COORDINATE_OUT_OF_BOUNDS',
      'SERVICE_UNAVAILABLE', 'CONFIG_NOT_FOUND', 'FEATURE_INFO_EMPTY'
    ];
    const totalErrors = errorTypes.reduce((sum, _, i) => sum + Math.floor(Math.random() * 20), 0);
    const errors: ErrorDistribution[] = errorTypes.map(type => {
      const count = Math.floor(Math.random() * 20);
      return {
        type,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
      };
    });

    // Performance trends
    const periods = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'];
    const trends: PerformanceTrend[] = periods.map(period => ({
      period,
      p50: Math.random() * 200 + 400, // 400-600ms
      p95: Math.random() * 500 + 800, // 800-1300ms
      p99: Math.random() * 800 + 1200 // 1200-2000ms
    }));

    setTimeSeriesData(timeSeries);
    setProvinceData(provinceStats);
    setErrorData(errors);
    setPerformanceTrends(trends);
  };

  const fetchAnalyticsData = async () => {
    setRefreshing(true);
    try {
      // In production, these would be real API calls
      // const response = await fetch(`/api/coverage/analytics?range=${timeRange}`);
      // const data = await response.json();

      // For now, use mock data
      generateMockData();
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const exportAnalytics = async (format: 'csv' | 'pdf') => {
    // Mock export functionality
    const data = {
      timeRange,
      generated: new Date().toISOString(),
      summary: {
        totalRequests: timeSeriesData.reduce((sum, d) => sum + d.requests, 0),
        avgSuccessRate: timeSeriesData.reduce((sum, d) => sum + d.successRate, 0) / timeSeriesData.length,
        avgResponseTime: timeSeriesData.reduce((sum, d) => sum + d.responseTime, 0) / timeSeriesData.length
      },
      provinces: provinceData,
      errors: errorData,
      performance: performanceTrends
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coverage-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'json' : format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const colors = ['#F5831F', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalRequests = timeSeriesData.reduce((sum, d) => sum + d.requests, 0);
  const avgSuccessRate = timeSeriesData.reduce((sum, d) => sum + d.successRate, 0) / timeSeriesData.length;
  const avgResponseTime = timeSeriesData.reduce((sum, d) => sum + d.responseTime, 0) / timeSeriesData.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              Coverage Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Detailed performance metrics and usage analytics for MTN coverage API
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAnalyticsData}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => exportAnalytics('csv')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {timeRange === '24h' ? 'in last 24 hours' : `in last ${timeRange}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Mean response time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Request Volume */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Volume</CardTitle>
                  <CardDescription>Coverage check requests over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="requests"
                        stroke="#F5831F"
                        fill="#F5831F"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Success Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                  <CardDescription>API success rate percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="successRate"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Response Time Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time</CardTitle>
                  <CardDescription>API response time over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="responseTime"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Percentiles */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Percentiles</CardTitle>
                  <CardDescription>Response time distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="p50" fill="#10B981" name="P50" />
                      <Bar dataKey="p95" fill="#F59E0B" name="P95" />
                      <Bar dataKey="p99" fill="#EF4444" name="P99" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Province Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Requests by Province</CardTitle>
                  <CardDescription>Geographic distribution of coverage checks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={provinceData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="province" width={100} />
                      <Tooltip />
                      <Bar dataKey="requests" fill="#F5831F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Province Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Provincial Performance</CardTitle>
                  <CardDescription>Success rate and response time by province</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {provinceData
                      .sort((a, b) => b.requests - a.requests)
                      .slice(0, 6)
                      .map((province, index) => (
                        <div key={province.province} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="font-medium">{province.province}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>{province.requests} requests</span>
                            <Badge
                              variant={province.successRate > 95 ? "default" :
                                      province.successRate > 90 ? "secondary" : "destructive"}
                            >
                              {province.successRate.toFixed(1)}%
                            </Badge>
                            <span className="text-gray-500">
                              {province.avgResponseTime.toFixed(0)}ms
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Error Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Error Distribution</CardTitle>
                  <CardDescription>Types of errors encountered</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={errorData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ type, percentage }) =>
                          percentage > 5 ? `${type}: ${percentage.toFixed(1)}%` : ''
                        }
                      >
                        {errorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Error Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Error Breakdown</CardTitle>
                  <CardDescription>Detailed error statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {errorData
                      .sort((a, b) => b.count - a.count)
                      .map((error, index) => (
                        <div key={error.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="font-medium">
                              {error.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm">{error.count} occurrences</span>
                            <Badge variant="outline">
                              {error.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historical Trends</CardTitle>
                <CardDescription>
                  Long-term performance and usage trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Historical trend analysis will be available once sufficient data is collected
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Check back in a few weeks for detailed trend insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}