'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  Key,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IntegrationDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  healthStatus: string;
  healthLastCheckedAt: string | null;
  consecutiveFailures: number;
  lastAlertSentAt: string | null;
  healthCheckEnabled: boolean;
  isActive: boolean;
  baseUrl: string | null;
  documentationUrl: string | null;
  iconUrl: string | null;
  uptimePercentage: number | null;
  avgResponseTimeMs: number | null;
  totalRequests30d: number | null;
  failedRequests30d: number | null;
  isProductionReady: boolean;
  requiresOauth: boolean;
  supportsWebhooks: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Metrics {
  uptime24h: number | null;
  uptime7d: number | null;
  totalChecks24h: number;
  totalChecks7d: number;
}

interface HealthCheck {
  timestamp: string;
  status: string;
  duration: number | null;
  issues: string[];
}

interface TrendData {
  date: string;
  healthy: number;
  degraded: number;
  down: number;
  total: number;
}

interface ActivityLog {
  id: string;
  actionType: string;
  description: string;
  result: string;
  timestamp: string;
}

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [integration, setIntegration] = useState<IntegrationDetail | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [healthHistory24h, setHealthHistory24h] = useState<HealthCheck[]>([]);
  const [trend7d, setTrend7d] = useState<TrendData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchIntegrationDetails();
    }
  }, [slug]);

  const fetchIntegrationDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/integrations/health/${slug}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch integration details: ${response.statusText}`);
      }

      const data = await response.json();
      setIntegration(data.integration);
      setMetrics(data.metrics);
      setHealthHistory24h(data.healthHistory24h || []);
      setTrend7d(data.trend7d || []);
      setActivityLogs(data.recentActivity || []);
    } catch (err) {
      console.error('Error fetching integration details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load integration details');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'down':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800">Down</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !integration) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/integrations')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Integrations
        </Button>
        <Card className="border-red-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error || 'Integration not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/integrations')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchIntegrationDetails}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Integration Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              {getHealthIcon(integration.healthStatus)}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-circleTel-darkNeutral dark:text-white mb-2">
                  {integration.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {integration.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {getHealthBadge(integration.healthStatus)}
                  <Badge variant="outline">
                    {integration.category === 'api_key' ? 'API Key' :
                     integration.category === 'oauth' ? 'OAuth' :
                     integration.category === 'webhook_only' ? 'Webhook Only' :
                     integration.category}
                  </Badge>
                  {!integration.isActive && (
                    <Badge variant="outline" className="text-gray-500">Disabled</Badge>
                  )}
                  {integration.isProductionReady && (
                    <Badge className="bg-blue-100 text-blue-800">Production Ready</Badge>
                  )}
                </div>
              </div>
            </div>

            {integration.documentationUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(integration.documentationUrl!, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Banner */}
      {integration.consecutiveFailures >= 3 && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <Zap className="w-5 h-5" />
              <div>
                <p className="font-semibold">Active Alert</p>
                <p className="text-sm">{integration.consecutiveFailures} consecutive failures detected</p>
                {integration.lastAlertSentAt && (
                  <p className="text-xs mt-1">
                    Last alert sent {formatDistanceToNow(new Date(integration.lastAlertSentAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">24h Uptime</p>
                <p className="text-2xl font-bold">
                  {metrics?.uptime24h !== null && metrics?.uptime24h !== undefined ? `${metrics.uptime24h.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">7d Uptime</p>
                <p className="text-2xl font-bold">
                  {metrics?.uptime7d !== null && metrics?.uptime7d !== undefined ? `${metrics.uptime7d.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold">
                  {integration.avgResponseTimeMs !== null ? `${integration.avgResponseTimeMs}ms` : 'N/A'}
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">30d Requests</p>
                <p className="text-2xl font-bold">
                  {integration.totalRequests30d !== null ? integration.totalRequests30d.toLocaleString() : 'N/A'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health History</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* 7-Day Trend Chart */}
          {trend7d.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>7-Day Health Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trend7d}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="healthy" stroke="#10b981" name="Healthy" />
                    <Line type="monotone" dataKey="degraded" stroke="#f59e0b" name="Degraded" />
                    <Line type="monotone" dataKey="down" stroke="#ef4444" name="Down" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Slug:</span>
                  <span className="font-mono">{integration.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span>{integration.category}</span>
                </div>
                {integration.baseUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base URL:</span>
                    <span className="font-mono text-xs truncate max-w-xs">{integration.baseUrl}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span>{format(new Date(integration.createdAt), 'PP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                  <span>{formatDistanceToNow(new Date(integration.updatedAt), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Health Check Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Health Checks:</span>
                  <span>{integration.healthCheckEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                {integration.healthLastCheckedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Checked:</span>
                    <span>{formatDistanceToNow(new Date(integration.healthLastCheckedAt), { addSuffix: true })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Consecutive Failures:</span>
                  <span className={integration.consecutiveFailures >= 3 ? 'text-red-600 font-bold' : ''}>
                    {integration.consecutiveFailures}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">24h Health Checks:</span>
                  <span>{metrics?.totalChecks24h || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">7d Health Checks:</span>
                  <span>{metrics?.totalChecks7d || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health History Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Health Check History</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {healthHistory24h.length} health checks from the last 24 hours
              </p>
            </CardHeader>
            <CardContent>
              {healthHistory24h.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No health checks in the last 24 hours</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {healthHistory24h.map((check, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded"
                    >
                      <div className="flex items-center gap-3">
                        {check.status === 'healthy' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : check.status === 'degraded' ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium capitalize">{check.status}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {format(new Date(check.timestamp), 'PPpp')}
                          </p>
                        </div>
                      </div>
                      {check.duration && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {check.duration}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last 50 activity events
              </p>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No activity logs found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {log.actionType}
                            </Badge>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {log.result === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Features</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">OAuth Support:</span>
                      <span>{integration.requiresOauth ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Webhook Support:</span>
                      <span>{integration.supportsWebhooks ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Health Monitoring:</span>
                      <span>{integration.healthCheckEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span>{integration.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Performance</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">30d Total Requests:</span>
                      <span>{integration.totalRequests30d?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">30d Failed Requests:</span>
                      <span className={integration.failedRequests30d && integration.failedRequests30d > 0 ? 'text-red-600' : ''}>
                        {integration.failedRequests30d?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Overall Uptime:</span>
                      <span>{integration.uptimePercentage !== null ? `${integration.uptimePercentage.toFixed(2)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Response Time:</span>
                      <span>{integration.avgResponseTimeMs !== null ? `${integration.avgResponseTimeMs}ms` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
