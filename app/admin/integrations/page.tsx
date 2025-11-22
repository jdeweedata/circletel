'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, XCircle, Settings, Activity, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Integration {
  id: string;
  name: string;
  slug: string;
  category: string;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  health_last_checked_at: string | null;
  description: string;
  has_oauth: boolean;
  has_webhook: boolean;
  is_enabled: boolean;
  consecutive_failures: number;
}

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
  activeAlerts: number;
}

// Category mapping for better organization
const CATEGORY_GROUPS = {
  'Messaging & Notifications': ['api_key'],
  'Identity Verification': ['webhook_only'],
  'Coverage & Mapping': ['api_key'],
  'Billing & Payments': ['oauth'],
  'Other Services': ['oauth', 'api_key', 'webhook_only'],
};

const getCategoryGroup = (slug: string): string => {
  if (slug.includes('sms') || slug.includes('email')) return 'Messaging & Notifications';
  if (slug.includes('kyc') || slug.includes('didit')) return 'Identity Verification';
  if (slug.includes('maps') || slug.includes('mtn') || slug.includes('coverage')) return 'Coverage & Mapping';
  if (slug.includes('netcash') || slug.includes('zoho')) return 'Billing & Payments';
  return 'Other Services';
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const healthResponse = await fetch('/api/admin/integrations/health', {
        credentials: 'include',
      });

      if (!healthResponse.ok) {
        throw new Error(`Failed to fetch health data: ${healthResponse.statusText}`);
      }

      const healthData = await healthResponse.json();
      setHealthSummary(healthData.summary);
      setIntegrations(healthData.integrations || []);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Filter integrations
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      searchQuery === '' ||
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || integration.category === categoryFilter;

    const matchesHealth =
      healthFilter === 'all' || integration.health_status === healthFilter;

    return matchesSearch && matchesCategory && matchesHealth;
  });

  // Group integrations by category
  const groupedIntegrations = filteredIntegrations.reduce((acc, integration) => {
    const group = getCategoryGroup(integration.slug);
    if (!acc[group]) acc[group] = [];
    acc[group].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f8fa]">
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-circleTel-orange mx-auto mb-4" />
            <p className="text-muted-foreground">Loading integrations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f8fa] p-4">
        <Card className="max-w-md shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <CardTitle>Error Loading Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] text-gray-800 p-6 md:p-10 space-y-8">
      {/* PAGE HEADER */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Integrations
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor and manage all third-party integrations connected to CircleTel
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="default"
          className="shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {/* STATUS SUMMARY BAR */}
      {healthSummary && (
        <section className="flex flex-wrap gap-4 text-sm">
          <StatusPill label="Total" value={healthSummary.total.toString()} />
          <StatusPill
            label="Healthy"
            value={healthSummary.healthy.toString()}
            color="text-green-600"
          />
          <StatusPill
            label="Degraded"
            value={healthSummary.degraded.toString()}
            color="text-yellow-600"
          />
          <StatusPill
            label="Down"
            value={healthSummary.down.toString()}
            color="text-red-600"
          />
          <StatusPill
            label="Unknown"
            value={healthSummary.unknown.toString()}
            color="text-gray-700"
          />
          <StatusPill
            label="Alerts"
            value={healthSummary.activeAlerts.toString()}
            color="text-orange-600"
          />
        </section>
      )}

      {/* SEARCH + FILTERS */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center flex-1 gap-3">
              <div className="flex items-center bg-muted border rounded-xl px-3 py-2 w-full max-w-md focus-within:ring-2 focus-within:ring-circleTel-orange transition-all">
                <span className="text-muted-foreground mr-2">🔍</span>
                <input
                  placeholder="Search integrations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent focus:outline-none w-full text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border px-3 py-2 rounded-xl text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange transition-all"
              >
                <option value="all">All Categories</option>
                <option value="api_key">API Key</option>
                <option value="oauth">OAuth</option>
                <option value="webhook_only">Webhook Only</option>
              </select>

              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="border px-3 py-2 rounded-xl text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange transition-all"
              >
                <option value="all">All Status</option>
                <option value="healthy">Healthy</option>
                <option value="degraded">Degraded</option>
                <option value="down">Down</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GROUPED INTEGRATIONS */}
      {Object.keys(groupedIntegrations).length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No integrations found matching your filters</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedIntegrations).map(([groupName, groupIntegrations]) => (
          <section key={groupName} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                {groupName}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {groupIntegrations.length} {groupIntegrations.length === 1 ? 'integration' : 'integrations'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {groupIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

// Status Pill Component
function StatusPill({
  label,
  value,
  color = 'text-gray-900',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-2 p-4">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

// Integration Card Component
function IntegrationCard({ integration }: { integration: Integration }) {
  const statusConfig = {
    healthy: {
      variant: 'default' as const,
      className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
      icon: '●'
    },
    degraded: {
      variant: 'secondary' as const,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50',
      icon: '●'
    },
    down: {
      variant: 'destructive' as const,
      className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
      icon: '●'
    },
    unknown: {
      variant: 'outline' as const,
      className: 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50',
      icon: '●'
    },
  };

  const formatLastChecked = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const status = statusConfig[integration.health_status];

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-circleTel-orange/10 to-circleTel-orange/5 border border-circleTel-orange/20 flex items-center justify-center">
              <span className="text-xl font-bold text-circleTel-orange">
                {integration.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base mb-1 truncate">{integration.name}</CardTitle>
              <CardDescription className="text-xs">
                {integration.category === 'api_key' ? 'API Integration' :
                 integration.category === 'oauth' ? 'OAuth Integration' :
                 'Webhook Integration'}
              </CardDescription>
            </div>
          </div>
          <Badge className={status.className}>
            {status.icon} {integration.health_status.charAt(0).toUpperCase() + integration.health_status.slice(1)}
          </Badge>
        </div>

        {integration.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {integration.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-3 flex-1">
        {/* Alert Banner */}
        {integration.consecutive_failures >= 3 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-xs text-destructive mb-3 flex items-center gap-2">
            <XCircle className="h-3 w-3" />
            <span className="font-medium">{integration.consecutive_failures} consecutive failures</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {integration.category === 'api_key' && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              API Key
            </Badge>
          )}
          {integration.category === 'oauth' && (
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              OAuth
            </Badge>
          )}
          {integration.has_webhook && (
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Webhook
            </Badge>
          )}
          {!integration.is_enabled && (
            <Badge variant="secondary" className="text-xs">
              Disabled
            </Badge>
          )}
        </div>

        {/* Last Checked */}
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Last checked: {formatLastChecked(integration.health_last_checked_at)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/admin/integrations/${integration.slug}`}>
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Implement health check
            console.log('Running health check for', integration.slug);
          }}
        >
          <Activity className="h-4 w-4 mr-1" />
          Test
        </Button>
      </CardFooter>
    </Card>
  );
}
