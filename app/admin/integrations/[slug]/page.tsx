'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  Settings,
  BarChart3,
  FileText,
  Shield,
  ExternalLink,
  Play,
  Eye,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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

interface ActivityLog {
  id: string;
  actionType: string;
  description: string;
  result: string;
  timestamp: string;
}

type TabType = 'dashboard' | 'insights' | 'configuration' | 'activity' | 'health';

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [integration, setIntegration] = useState<IntegrationDetail | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f7f8fa]">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !integration) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f7f8fa]">
        <div className="max-w-md bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold">Error Loading Integration</h3>
          </div>
          <p className="text-gray-600 mb-4">{error || 'Integration not found'}</p>
          <Button onClick={() => router.push('/admin/integrations')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Integrations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f7f8fa]">
      {/* Left Sidebar */}
      <aside className={`bg-white border-r transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden flex flex-col h-screen sticky top-0`}>
        {/* Integration Header */}
        <div className="p-6 border-b bg-white flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-circleTel-orange/10 flex items-center justify-center">
              <span className="text-lg font-bold text-circleTel-orange">
                {integration.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{integration.name}</h2>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {integration.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation - fills remaining space */}
        <nav className="flex-1 bg-white overflow-y-auto py-4 px-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'dashboard'
                ? 'bg-circleTel-orange/10 text-circleTel-orange font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'insights'
                ? 'bg-circleTel-orange/10 text-circleTel-orange font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Insights
          </button>

          <button
            onClick={() => setActiveTab('configuration')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'configuration'
                ? 'bg-circleTel-orange/10 text-circleTel-orange font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuration
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'activity'
                ? 'bg-circleTel-orange/10 text-circleTel-orange font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Activity Log
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'health'
                ? 'bg-circleTel-orange/10 text-circleTel-orange font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Health Monitoring
          </button>
        </nav>

        {/* Back Button Footer */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <Link href="/admin/integrations">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Integrations
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'insights' && 'Insights'}
                {activeTab === 'configuration' && 'Configuration'}
                {activeTab === 'activity' && 'Activity Log'}
                {activeTab === 'health' && 'Health Monitoring'}
              </h1>
              <p className="text-sm text-gray-500">
                {integration.description}
              </p>
            </div>
            <Button onClick={fetchIntegrationDetails} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Alert Banner */}
          {integration.consecutiveFailures >= 3 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Active Alert</p>
                  <p className="text-sm text-red-700">
                    {integration.consecutiveFailures} consecutive failures detected
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <DashboardView integration={integration} metrics={metrics} />
          )}
          {activeTab === 'insights' && (
            <InsightsView integration={integration} metrics={metrics} />
          )}
          {activeTab === 'configuration' && (
            <ConfigurationView integration={integration} />
          )}
          {activeTab === 'activity' && (
            <ActivityView activityLogs={activityLogs} />
          )}
          {activeTab === 'health' && (
            <HealthView integration={integration} metrics={metrics} />
          )}
        </div>
      </main>
    </div>
  );
}

// Dashboard View Component
function DashboardView({ integration, metrics }: { integration: IntegrationDetail; metrics: Metrics | null }) {
  return (
    <div className="space-y-8">
      {/* Actions Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Run Health Check Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl mb-4 flex items-center justify-center">
              <Play className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Run Health Check</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manually trigger a health check to verify integration status.
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Run Check
            </Button>
          </div>

          {/* View Logs Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mb-4 flex items-center justify-center">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">View Activity Logs</h3>
            <p className="text-sm text-gray-600 mb-4">
              Review recent integration activity and events.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Eye className="w-4 h-4 mr-2" />
              View Logs
            </Button>
          </div>

          {/* Documentation Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl mb-4 flex items-center justify-center">
              <ExternalLink className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">View Documentation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Access official API documentation and guides.
            </p>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => integration.documentationUrl && window.open(integration.documentationUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Docs
            </Button>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-700">Health Score</h3>
            </div>
            <div className="flex items-center justify-center py-8">
              {integration.healthStatus === 'healthy' ? (
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              ) : integration.healthStatus === 'degraded' ? (
                <AlertTriangle className="w-16 h-16 text-yellow-600" />
              ) : integration.healthStatus === 'down' ? (
                <XCircle className="w-16 h-16 text-red-600" />
              ) : (
                <HelpCircle className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold capitalize">{integration.healthStatus}</p>
              <p className="text-sm text-gray-500 mt-2">
                {integration.healthLastCheckedAt
                  ? `Checked ${formatDistanceToNow(new Date(integration.healthLastCheckedAt), { addSuffix: true })}`
                  : 'Never checked'}
              </p>
            </div>
          </div>

          {/* Uptime Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-700">24h Uptime</h3>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {metrics?.uptime24h !== null && metrics?.uptime24h !== undefined
                    ? `${metrics.uptime24h.toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {metrics?.totalChecks24h || 0} health checks in last 24 hours
              </p>
            </div>
          </div>

          {/* Response Time Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-700">Avg Response Time</h3>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {integration.avgResponseTimeMs !== null ? `${integration.avgResponseTimeMs}` : 'N/A'}
                </p>
                {integration.avgResponseTimeMs !== null && (
                  <p className="text-sm text-gray-500 mt-1">milliseconds</p>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Average API response time</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Insights View Component
function InsightsView({ integration, metrics }: { integration: IntegrationDetail; metrics: Metrics | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">30-Day Requests</p>
          <p className="text-3xl font-bold">{integration.totalRequests30d?.toLocaleString() || 'N/A'}</p>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Failed Requests</p>
          <p className="text-3xl font-bold text-red-600">{integration.failedRequests30d?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">7-Day Uptime</p>
          <p className="text-3xl font-bold">
            {metrics?.uptime7d !== null && metrics?.uptime7d !== undefined ? `${metrics.uptime7d.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Overall Uptime</p>
          <p className="text-3xl font-bold">
            {integration.uptimePercentage !== null ? `${integration.uptimePercentage.toFixed(2)}%` : 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Usage Trends</h3>
        <p className="text-sm text-gray-500">Historical usage data will be displayed here.</p>
      </div>
    </div>
  );
}

// Configuration View Component
function ConfigurationView({ integration }: { integration: IntegrationDetail }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Integration Details</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Slug:</dt>
            <dd className="font-mono text-gray-900">{integration.slug}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Type:</dt>
            <dd className="text-gray-900 capitalize">{integration.category.replace('_', ' ')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Status:</dt>
            <dd className="text-gray-900">{integration.isActive ? 'Active' : 'Inactive'}</dd>
          </div>
          {integration.baseUrl && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Base URL:</dt>
              <dd className="font-mono text-gray-900 truncate max-w-xs">{integration.baseUrl}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-600">Created:</dt>
            <dd className="text-gray-900">{format(new Date(integration.createdAt), 'PP')}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Features</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">OAuth Support:</span>
            <span className="font-medium">{integration.requiresOauth ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Webhook Support:</span>
            <span className="font-medium">{integration.supportsWebhooks ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Health Monitoring:</span>
            <span className="font-medium">{integration.healthCheckEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Production Ready:</span>
            <span className="font-medium">{integration.isProductionReady ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Activity View Component
function ActivityView({ activityLogs }: { activityLogs: ActivityLog[] }) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      {activityLogs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No activity logs found</p>
      ) : (
        <div className="space-y-3">
          {activityLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
              {log.result === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{log.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">{log.actionType}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Health View Component
function HealthView({ integration, metrics }: { integration: IntegrationDetail; metrics: Metrics | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Health Check Status</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Current Status:</dt>
              <dd className="font-medium capitalize">{integration.healthStatus}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Consecutive Failures:</dt>
              <dd className={integration.consecutiveFailures >= 3 ? 'font-bold text-red-600' : 'font-medium'}>
                {integration.consecutiveFailures}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Last Checked:</dt>
              <dd className="font-medium">
                {integration.healthLastCheckedAt
                  ? formatDistanceToNow(new Date(integration.healthLastCheckedAt), { addSuffix: true })
                  : 'Never'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">24h Checks:</dt>
              <dd className="font-medium">{metrics?.totalChecks24h || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">7d Checks:</dt>
              <dd className="font-medium">{metrics?.totalChecks7d || 0}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Uptime Metrics</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">24-Hour Uptime:</dt>
              <dd className="font-medium">
                {metrics?.uptime24h !== null && metrics?.uptime24h !== undefined
                  ? `${metrics.uptime24h.toFixed(1)}%`
                  : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">7-Day Uptime:</dt>
              <dd className="font-medium">
                {metrics?.uptime7d !== null && metrics?.uptime7d !== undefined
                  ? `${metrics.uptime7d.toFixed(1)}%`
                  : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Overall Uptime:</dt>
              <dd className="font-medium">
                {integration.uptimePercentage !== null ? `${integration.uptimePercentage.toFixed(2)}%` : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Avg Response Time:</dt>
              <dd className="font-medium">
                {integration.avgResponseTimeMs !== null ? `${integration.avgResponseTimeMs}ms` : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
