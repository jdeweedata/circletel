'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import {
  Activity,
  Map,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Signal,
  Database,
  Zap,
  Users,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';

interface CoverageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorBreakdown: Record<string, number>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    successRate: number;
    averageResponseTime: number;
    consecutiveFailures: number;
    lastRequestTime: number;
  };
}

interface RecentActivity {
  timestamp: number;
  coordinates: { lat: number; lng: number };
  province?: string;
  success: boolean;
  responseTime: number;
  cacheHit: boolean;
}

export default function AdminCoveragePage() {
  const [stats, setStats] = useState<CoverageStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCoverageData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch performance stats (last hour)
      const statsResponse = await fetch('/api/coverage/mtn/monitoring?action=stats&window=3600000');
      const statsData = await statsResponse.json();

      // Fetch health status
      const healthResponse = await fetch('/api/coverage/mtn/monitoring?action=health');
      const healthData = await healthResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (healthData.success) {
        setHealth(healthData.data);
      }

      // Mock recent activity for now - in production this would come from monitoring API
      const mockActivity: RecentActivity[] = [
        {
          timestamp: Date.now() - 300000, // 5 minutes ago
          coordinates: { lat: -26.2041, lng: 28.0473 },
          province: 'Gauteng',
          success: true,
          responseTime: 850,
          cacheHit: false
        },
        {
          timestamp: Date.now() - 450000, // 7.5 minutes ago
          coordinates: { lat: -33.9249, lng: 18.4241 },
          province: 'Western Cape',
          success: true,
          responseTime: 1200,
          cacheHit: true
        },
        {
          timestamp: Date.now() - 600000, // 10 minutes ago
          coordinates: { lat: -29.8587, lng: 31.0218 },
          province: 'KwaZulu-Natal',
          success: false,
          responseTime: 15000,
          cacheHit: false
        }
      ];
      setRecentActivity(mockActivity);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coverage data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoverageData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchCoverageData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" /> Degraded</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" /> Unhealthy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportMetrics = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/coverage/mtn/monitoring?action=export&format=${format}`);

      if (format === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coverage-metrics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coverage-metrics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export metrics:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Map className="h-8 w-8 text-orange-600" />
              Coverage Management
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage MTN coverage API performance and geographic validation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchCoverageData()}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => exportMetrics('csv')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {health ? getHealthBadge(health.status) : <Badge variant="secondary">Loading...</Badge>}
                {health && (
                  <div className="text-xs text-muted-foreground">
                    {health.details.consecutiveFailures > 0 && (
                      <div className="text-red-600">
                        {health.details.consecutiveFailures} consecutive failures
                      </div>
                    )}
                    Last request: {health.details.lastRequestTime ?
                      formatTimestamp(health.details.lastRequestTime) : 'Never'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? `${stats.successRate.toFixed(1)}%` : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats ? `${stats.successfulRequests}/${stats.totalRequests} requests` : 'Loading...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? formatDuration(stats.averageResponseTime) : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? `${stats.cacheHitRate.toFixed(1)}%` : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                Cache effectiveness
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Testing Tools
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Error Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Error Breakdown
                  </CardTitle>
                  <CardDescription>
                    Distribution of error types in the last hour
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats && stats.errorBreakdown ? (
                    <div className="space-y-2">
                      {Object.entries(stats.errorBreakdown).map(([error, count]) => (
                        <div key={error} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{error.replace(/_/g, ' ')}</span>
                          <Badge variant={count > 0 ? "destructive" : "secondary"}>
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No error data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => window.open('/coverage', '_blank')}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Test Coverage Checker
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => exportMetrics('json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Metrics (JSON)
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => window.open('/api/coverage/mtn/monitoring?action=health', '_blank')}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    View API Health
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Coverage Requests
                </CardTitle>
                <CardDescription>
                  Latest coverage check activity across South Africa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${activity.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {activity.coordinates.lat.toFixed(4)}, {activity.coordinates.lng.toFixed(4)}
                            {activity.province && (
                              <Badge variant="outline">{activity.province}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatDuration(activity.responseTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.cacheHit ? 'Cache Hit' : 'API Call'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Test Tool</CardTitle>
                  <CardDescription>
                    Test coverage checking for specific coordinates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Use the main coverage checker to test API functionality:
                  </p>
                  <Button
                    onClick={() => window.open('/coverage', '_blank')}
                    className="w-full"
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Open Coverage Checker
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Validation</CardTitle>
                  <CardDescription>
                    Test geographic validation API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Validate coordinates and get location information:
                  </p>
                  <Button
                    onClick={() => window.open('/api/coverage/geo-validate?lat=-26.2041&lng=28.0473&includeLocationInfo=true', '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Test Geo Validation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Current MTN API configuration and endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Business API Endpoint</label>
                      <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                        https://mtnsi.mtn.co.za/coverage/dev/v3
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Consumer API Endpoint</label>
                      <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                        https://mtnsi.mtn.co.za/cache/geoserver/wms
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Rate Limiting</label>
                      <div className="text-sm text-gray-600">
                        250ms delay between requests
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Timeout</label>
                      <div className="text-sm text-gray-600">
                        15 seconds per request
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Cache TTL</label>
                      <div className="text-sm text-gray-600">
                        5 minutes for coverage data
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Geographic Bounds</label>
                      <div className="text-sm text-gray-600">
                        South Africa: -35° to -22° lat, 16° to 33° lng
                      </div>
                    </div>
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