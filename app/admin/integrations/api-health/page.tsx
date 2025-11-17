'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Integration {
  id: string;
  slug: string;
  name: string;
  category: string;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  health_last_checked_at: string | null;
  consecutive_failures: number;
  is_enabled: boolean;
  has_active_alert: boolean;
}

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
  activeAlerts: number;
  healthCheckEnabled: number;
  lastCheckAt: string | null;
}

export default function APIHealthMonitorPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch health data
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthData(true); // Silent refresh
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchHealthData = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const response = await fetch('/api/admin/integrations/health', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch health data: ${response.statusText}`);
      }

      const data = await response.json();
      setIntegrations(data.integrations || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching health data:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load health data');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
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

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Degraded
          </Badge>
        );
      case 'down':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Down
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Unknown
          </Badge>
        );
    }
  };

  // Filter integrations
  const filteredIntegrations = integrations.filter(integration => {
    if (filterCategory !== 'all' && integration.category !== filterCategory) {
      return false;
    }
    if (filterHealth !== 'all' && integration.health_status !== filterHealth) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return integration.name.toLowerCase().includes(query) ||
             integration.slug.toLowerCase().includes(query);
    }
    return true;
  });

  // Get unique categories
  const uniqueCategories = Array.from(new Set(integrations.map(i => i.category)));

  if (isLoading && !integrations.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral dark:text-white">
            API Health Monitor
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time health status and monitoring for all integrations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-500 text-green-600' : ''}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHealthData()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{summary.healthy}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Degraded</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.degraded}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Down</p>
                  <p className="text-2xl font-bold text-red-600">{summary.down}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.activeAlerts}</p>
                </div>
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Check Info */}
      {summary?.lastCheckAt && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Clock className="w-4 h-4" />
              <span>
                Last health check: {formatDistanceToNow(new Date(summary.lastCheckAt), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'api_key' ? 'API Key' :
                       category === 'oauth' ? 'OAuth' :
                       category === 'webhook_only' ? 'Webhook Only' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Health Status</label>
              <Select value={filterHealth} onValueChange={setFilterHealth}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="degraded">Degraded</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Health Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredIntegrations.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="pt-12 pb-12 text-center">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No integrations found matching your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIntegrations.map((integration) => (
            <Card
              key={integration.id}
              className={`hover:shadow-lg transition-shadow ${
                integration.has_active_alert
                  ? 'border-red-300 dark:border-red-800'
                  : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(integration.health_status)}
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {integration.slug}
                      </p>
                    </div>
                  </div>
                  {getHealthBadge(integration.health_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Alert Banner */}
                {integration.has_active_alert && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-800 dark:text-red-200">
                        {integration.consecutive_failures} consecutive failures
                      </span>
                    </div>
                  </div>
                )}

                {/* Last Check Time */}
                {integration.health_last_checked_at ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      Checked {formatDistanceToNow(new Date(integration.health_last_checked_at), { addSuffix: true })}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Never checked</span>
                  </div>
                )}

                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {integration.category === 'api_key' ? 'API Key' :
                     integration.category === 'oauth' ? 'OAuth' :
                     integration.category === 'webhook_only' ? 'Webhook Only' :
                     integration.category}
                  </Badge>
                  {!integration.is_enabled && (
                    <Badge variant="outline" className="text-gray-500">
                      Disabled
                    </Badge>
                  )}
                </div>

                {/* View Details Link */}
                <Link
                  href={`/admin/integrations/${integration.slug}`}
                  className="block w-full"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-circleTel-orange/10 hover:border-circleTel-orange"
                  >
                    View Detailed Metrics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-300 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
