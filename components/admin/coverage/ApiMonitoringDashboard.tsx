'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Database,
  RefreshCw,
  Download,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface MonitoringData {
  timestamp: string;
  timeWindow: number;
  mtn: {
    health: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: {
        successRate: number;
        averageResponseTime: number;
        consecutiveFailures: number;
        lastRequestTime: number;
      };
    };
    performance: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      successRate: number;
      averageResponseTime: number;
      medianResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      cacheHitRate: number;
      errorBreakdown: Record<string, number>;
      hourlyStats: Record<string, any>;
      layerStats: Record<string, any>;
    };
    rateLimiting: {
      averageDelay: number;
      rateLimitHits: number;
      requestsPerMinute: number;
    };
  };
  cache: {
    stats: {
      hits: number;
      misses: number;
      entries: number;
      oldestEntry: number;
      newestEntry: number;
    };
    hitRatio: number;
  };
  aggregation: {
    cacheStats: {
      size: number;
      keys: string[];
    };
  };
  summary: {
    overallStatus: string;
    metrics: {
      successRate: number;
      avgResponseTime: number;
      cacheHitRate: number;
      totalRequests: number;
    };
    alerts: Array<{
      level: 'critical' | 'warning' | 'info';
      message: string;
      details?: any;
    }>;
  };
}

export function ApiMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<number>(3600000); // 1 hour
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch(`/api/admin/coverage/monitoring?window=${timeWindow}`);
      if (!response.ok) throw new Error('Failed to fetch monitoring data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [timeWindow, autoRefresh]);

  const handleResetMetrics = async () => {
    try {
      const response = await fetch('/api/admin/coverage/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_metrics' }),
      });
      if (!response.ok) throw new Error('Failed to reset metrics');
      toast.success('Metrics reset successfully');
      fetchMonitoringData();
    } catch (error) {
      toast.error('Failed to reset metrics');
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/admin/coverage/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      if (!response.ok) throw new Error('Failed to clear cache');
      toast.success('Cache cleared successfully');
      fetchMonitoringData();
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await fetch(`/api/admin/coverage/monitoring?window=${timeWindow}&format=csv`);
      if (!response.ok) throw new Error('Failed to export data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coverage-metrics-${Date.now()}.csv`;
      a.click();
      toast.success('Metrics exported successfully');
    } catch (error) {
      toast.error('Failed to export metrics');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'degraded': return <AlertCircle className="h-5 w-5" />;
      case 'unhealthy': return <AlertCircle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">API Monitoring</h2>
          <p className="text-gray-600 mt-1">Real-time coverage API performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value={300000}>Last 5 minutes</option>
            <option value={900000}>Last 15 minutes</option>
            <option value={3600000}>Last hour</option>
            <option value={21600000}>Last 6 hours</option>
            <option value={86400000}>Last 24 hours</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMonitoringData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {data.summary.alerts.length > 0 && (
        <div className="space-y-2">
          {data.summary.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.level === 'critical' ? 'bg-red-50 border-red-500' :
                alert.level === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${
                  alert.level === 'critical' ? 'text-red-600' :
                  alert.level === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <span className="font-semibold">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(data.mtn.health.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(data.mtn.health.status)}
                  {data.mtn.health.status.toUpperCase()}
                </span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {data.summary.metrics.successRate.toFixed(1)}%
              </span>
              {data.summary.metrics.successRate >= 95 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.mtn.performance.successfulRequests} / {data.mtn.performance.totalRequests} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {data.summary.metrics.avgResponseTime.toFixed(0)}ms
              </span>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              P95: {data.mtn.performance.p95ResponseTime.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {data.summary.metrics.cacheHitRate.toFixed(1)}%
              </span>
              <Database className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.cache.stats.hits} hits / {data.cache.stats.hits + data.cache.stats.misses} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
              <CardDescription>Percentile breakdown of API response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average</span>
                  <span className="font-semibold">{data.mtn.performance.averageResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Median (P50)</span>
                  <span className="font-semibold">{data.mtn.performance.medianResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">P95</span>
                  <span className="font-semibold">{data.mtn.performance.p95ResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">P99</span>
                  <span className="font-semibold">{data.mtn.performance.p99ResponseTime.toFixed(0)}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Breakdown</CardTitle>
              <CardDescription>Distribution of error types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.mtn.performance.errorBreakdown).map(([error, count]) => (
                  count > 0 && (
                    <div key={error} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{error}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  )
                ))}
                {Object.values(data.mtn.performance.errorBreakdown).every(v => v === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No errors recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting</CardTitle>
              <CardDescription>API rate limiting statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Requests/Minute</span>
                  <span className="font-semibold">{data.mtn.rateLimiting.requestsPerMinute}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Delay</span>
                  <span className="font-semibold">{data.mtn.rateLimiting.averageDelay}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rate Limit Hits</span>
                  <Badge variant={data.mtn.rateLimiting.rateLimitHits > 0 ? 'destructive' : 'secondary'}>
                    {data.mtn.rateLimiting.rateLimitHits}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MTN Coverage Cache</CardTitle>
              <CardDescription>30-minute TTL coordinate-based cache</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hit Ratio</span>
                  <span className="font-semibold">{(data.cache.hitRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cache Hits</span>
                  <span className="font-semibold">{data.cache.stats.hits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cache Misses</span>
                  <span className="font-semibold">{data.cache.stats.misses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cached Entries</span>
                  <span className="font-semibold">{data.cache.stats.entries}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aggregation Cache</CardTitle>
              <CardDescription>5-minute TTL multi-provider cache</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cached Entries</span>
                  <span className="font-semibold">{data.aggregation.cacheStats.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unique Coordinates</span>
                  <span className="font-semibold">{data.aggregation.cacheStats.keys.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MTN WMS Layer Performance</CardTitle>
              <CardDescription>Per-layer success rates and response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.mtn.performance.layerStats).map(([layer, stats]: [string, any]) => (
                  <div key={layer} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{layer}</span>
                      <Badge variant={stats.successRate >= 90 ? 'default' : 'destructive'}>
                        {stats.successRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Requests: {stats.requests}</div>
                      <div>Avg Time: {stats.avgResponseTime.toFixed(0)}ms</div>
                    </div>
                  </div>
                ))}
                {Object.keys(data.mtn.performance.layerStats).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No layer data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Management Actions</CardTitle>
              <CardDescription>Reset metrics and clear caches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetMetrics}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Metrics
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearCache}
              >
                <Database className="h-4 w-4 mr-2" />
                Clear All Caches
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExportCsv}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Metrics (CSV)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimization Status</CardTitle>
              <CardDescription>Performance enhancements applied</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm">Request Deduplication</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm">8s Timeout Controls</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm">Adaptive Cache Keys</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm">Parallel Layer Queries</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
