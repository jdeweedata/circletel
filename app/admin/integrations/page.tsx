'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, XCircle, Settings, Activity, FileText, ExternalLink, Key, Webhook, BarChart3, Cog, RotateCcw, CheckCircle, AlertTriangle, Clock, User, FileSpreadsheet, CreditCard, Package } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAssistantWidget } from '@/components/admin/integrations/AIAssistantWidget';

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

interface ZohoSyncLog {
  id: string;
  entity_type: 'customer' | 'subscription' | 'invoice' | 'payment';
  entity_id: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  zoho_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  entity_details: {
    name?: string;
    email?: string;
    invoice_number?: string;
    amount?: number;
    customer_name?: string;
    package_name?: string;
    reference?: string;
  } | null;
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
  const [activeTab, setActiveTab] = useState('all');
  const [syncLogs, setSyncLogs] = useState<ZohoSyncLog[]>([]);
  const [syncLogsLoading, setSyncLogsLoading] = useState(false);
  const [syncLogFilter, setSyncLogFilter] = useState<string>('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState<string>('all');
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

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

  const fetchSyncLogs = async () => {
    try {
      setSyncLogsLoading(true);
      const params = new URLSearchParams();
      if (syncLogFilter !== 'all') params.set('entity_type', syncLogFilter);
      if (syncStatusFilter !== 'all') params.set('status', syncStatusFilter);
      params.set('limit', '50');

      const response = await fetch(`/api/admin/zoho-sync/logs?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Sync logs API error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch sync logs (${response.status})`);
      }

      const data = await response.json();
      setSyncLogs(data.data?.logs || []);
    } catch (err) {
      console.error('Error fetching sync logs:', err);
    } finally {
      setSyncLogsLoading(false);
    }
  };

  const handleRetrySync = async (entityType: string, entityId: string) => {
    const key = `${entityType}-${entityId}`;
    setRetryingIds(prev => new Set(prev).add(key));

    try {
      const response = await fetch('/api/admin/zoho-sync/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh logs after successful retry
        await fetchSyncLogs();
      } else {
        console.error('Retry failed:', result.error);
        alert(`Retry failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error retrying sync:', err);
      alert('Failed to retry sync. Please try again.');
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Fetch sync logs when tab changes to zoho-sync or filters change
  useEffect(() => {
    if (activeTab === 'zoho-sync') {
      fetchSyncLogs();
    }
  }, [activeTab, syncLogFilter, syncStatusFilter]);

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

      {/* TABBED NAVIGATION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-6 bg-white shadow-sm p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <Activity className="h-4 w-4 mr-2" />
            All Integrations
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Health Dashboard
          </TabsTrigger>
          <TabsTrigger value="keys" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="zoho-sync" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <RotateCcw className="h-4 w-4 mr-2" />
            Zoho Sync
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <Cog className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* ALL INTEGRATIONS TAB */}
        <TabsContent value="all" className="space-y-6">
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
        </TabsContent>

        {/* HEALTH DASHBOARD TAB */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-circleTel-orange" />
                Integration Health Dashboard
              </CardTitle>
              <CardDescription>
                Visual monitoring and health trends for all integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Health Summary Grid */}
              {healthSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">{healthSummary.healthy}</div>
                      <div className="text-sm text-muted-foreground">Healthy</div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-600">{healthSummary.degraded}</div>
                      <div className="text-sm text-muted-foreground">Degraded</div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-red-600">{healthSummary.down}</div>
                      <div className="text-sm text-muted-foreground">Down</div>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-gray-600">{healthSummary.unknown}</div>
                      <div className="text-sm text-muted-foreground">Unknown</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Health by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Health by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(groupedIntegrations).map(([groupName, groupIntegrations]) => {
                      const healthCount = {
                        healthy: groupIntegrations.filter(i => i.health_status === 'healthy').length,
                        total: groupIntegrations.length
                      };
                      const percentage = (healthCount.healthy / healthCount.total) * 100;

                      return (
                        <div key={groupName} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{groupName}</span>
                            <span className="text-muted-foreground">{healthCount.healthy}/{healthCount.total}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Failures */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integrations Requiring Attention</CardTitle>
                </CardHeader>
                <CardContent>
                  {integrations.filter(i => i.consecutive_failures >= 3 || i.health_status === 'down').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>All integrations are healthy!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {integrations
                        .filter(i => i.consecutive_failures >= 3 || i.health_status === 'down')
                        .map(integration => (
                          <div key={integration.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <div>
                                <p className="font-medium text-sm">{integration.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {integration.consecutive_failures} consecutive failures
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/integrations/${integration.slug}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API KEYS & SECRETS TAB */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-circleTel-orange" />
                API Keys & Credentials
              </CardTitle>
              <CardDescription>
                Manage API keys, OAuth credentials, and authentication secrets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations
                  .filter(i => i.category === 'api_key' || i.category === 'oauth')
                  .map(integration => (
                    <Card key={integration.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-circleTel-orange/10 to-circleTel-orange/5 border border-circleTel-orange/20 flex items-center justify-center">
                              <span className="text-lg font-bold text-circleTel-orange">
                                {integration.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{integration.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {integration.category === 'api_key' ? 'API Key' : 'OAuth'}
                                </Badge>
                                {integration.is_enabled ? (
                                  <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 text-xs">
                                    ● Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Disabled</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBHOOK LOGS TAB */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-circleTel-orange" />
                Webhook Events & Logs
              </CardTitle>
              <CardDescription>
                Recent webhook deliveries and event history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.filter(i => i.has_webhook).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Webhook className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium mb-1">No webhook integrations configured</p>
                    <p className="text-sm">Configure webhooks in the integration settings to see events here</p>
                  </div>
                ) : (
                  integrations
                    .filter(i => i.has_webhook)
                    .map(integration => (
                      <Card key={integration.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-circleTel-orange/10 to-circleTel-orange/5 border border-circleTel-orange/20 flex items-center justify-center">
                                <Webhook className="h-5 w-5 text-circleTel-orange" />
                              </div>
                              <div>
                                <p className="font-medium">{integration.name}</p>
                                <p className="text-xs text-muted-foreground">Webhook endpoint active</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/integrations/${integration.slug}?tab=webhooks`}>
                                View Logs
                              </Link>
                            </Button>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono">
                            <p className="text-muted-foreground mb-1">Last event received:</p>
                            <p className="text-foreground">Coming soon - webhook event tracking</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZOHO SYNC TAB */}
        <TabsContent value="zoho-sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-circleTel-orange" />
                Zoho Billing Sync Management
              </CardTitle>
              <CardDescription>
                Monitor and manage synchronization between CircleTel and Zoho Billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {syncLogs.filter(l => l.status === 'success').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {syncLogs.filter(l => l.status === 'failed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {syncLogs.filter(l => l.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <RefreshCw className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {syncLogs.filter(l => l.status === 'retrying').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Retrying</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Entity Type:</span>
                      <select
                        value={syncLogFilter}
                        onChange={(e) => setSyncLogFilter(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                      >
                        <option value="all">All Types</option>
                        <option value="customer">Customers</option>
                        <option value="subscription">Subscriptions</option>
                        <option value="invoice">Invoices</option>
                        <option value="payment">Payments</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <select
                        value={syncStatusFilter}
                        onChange={(e) => setSyncStatusFilter(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                      >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                        <option value="retrying">Retrying</option>
                      </select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSyncLogs}
                      disabled={syncLogsLoading}
                      className="ml-auto"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncLogsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sync Logs Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Sync Activity</CardTitle>
                  <CardDescription>Last 50 sync operations</CardDescription>
                </CardHeader>
                <CardContent>
                  {syncLogsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
                    </div>
                  ) : syncLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <RotateCcw className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium mb-1">No sync logs found</p>
                      <p className="text-sm">Sync activity will appear here when data is synchronized with Zoho</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {syncLogs.map((log) => {
                        const isRetrying = retryingIds.has(`${log.entity_type}-${log.entity_id}`);
                        const entityIcon = {
                          customer: <User className="h-4 w-4" />,
                          subscription: <Package className="h-4 w-4" />,
                          invoice: <FileSpreadsheet className="h-4 w-4" />,
                          payment: <CreditCard className="h-4 w-4" />,
                        }[log.entity_type];

                        const statusConfig = {
                          success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
                          failed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: <XCircle className="h-4 w-4" /> },
                          pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: <Clock className="h-4 w-4" /> },
                          retrying: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: <RefreshCw className="h-4 w-4 animate-spin" /> },
                        }[log.status];

                        const formatDate = (dateStr: string) => {
                          const date = new Date(dateStr);
                          return date.toLocaleString('en-ZA', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        };

                        const getEntityLabel = () => {
                          if (!log.entity_details) return log.entity_id.slice(0, 8) + '...';
                          
                          switch (log.entity_type) {
                            case 'customer':
                              return log.entity_details.name || log.entity_details.email || log.entity_id.slice(0, 8);
                            case 'subscription':
                              return log.entity_details.package_name || log.entity_id.slice(0, 8);
                            case 'invoice':
                              return log.entity_details.invoice_number || log.entity_id.slice(0, 8);
                            case 'payment':
                              return log.entity_details.reference || log.entity_id.slice(0, 8);
                            default:
                              return log.entity_id.slice(0, 8);
                          }
                        };

                        return (
                          <div
                            key={log.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${statusConfig.bg} ${statusConfig.border}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${statusConfig.bg} ${statusConfig.text}`}>
                                {entityIcon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm capitalize">{log.entity_type}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getEntityLabel()}
                                  </Badge>
                                  <Badge className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} text-xs`}>
                                    {statusConfig.icon}
                                    <span className="ml-1 capitalize">{log.status}</span>
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatDate(log.created_at)}
                                  {log.zoho_id && (
                                    <span className="ml-2">
                                      Zoho ID: <code className="bg-muted px-1 rounded">{log.zoho_id}</code>
                                    </span>
                                  )}
                                </div>
                                {log.error_message && (
                                  <div className="text-xs text-red-600 mt-1 max-w-md truncate">
                                    Error: {log.error_message}
                                  </div>
                                )}
                              </div>
                            </div>
                            {log.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetrySync(log.entity_type, log.entity_id)}
                                disabled={isRetrying}
                                className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white"
                              >
                                {isRetrying ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Retry
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Sync Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Manual Sync</CardTitle>
                  <CardDescription>Manually trigger a sync for a specific entity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ManualSyncForm onSync={handleRetrySync} isRetrying={retryingIds.size > 0} />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFIGURATION TAB */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-circleTel-orange" />
                Global Configuration
              </CardTitle>
              <CardDescription>
                System-wide integration settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Health Check Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Health Check Settings</CardTitle>
                  <CardDescription>Configure automatic health monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Automatic Health Checks</p>
                      <p className="text-xs text-muted-foreground">Run health checks every 5 minutes</p>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Alert Threshold</p>
                      <p className="text-xs text-muted-foreground">Alert after 3 consecutive failures</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notification Settings</CardTitle>
                  <CardDescription>Configure alerts for integration failures</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Send alerts to admin@circletel.co.za</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Slack Integration</p>
                      <p className="text-xs text-muted-foreground">Not configured</p>
                    </div>
                    <Button variant="outline" size="sm">Setup</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rate Limiting</CardTitle>
                  <CardDescription>Manage API rate limits and quotas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Cog className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Rate limiting configuration coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Assistant Widget */}
      <AIAssistantWidget />
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
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/integrations/${integration.slug}/logs`}>
            <FileText className="h-4 w-4 mr-1" />
            Logs
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

// Manual Sync Form Component
function ManualSyncForm({
  onSync,
  isRetrying,
}: {
  onSync: (entityType: string, entityId: string) => Promise<void>;
  isRetrying: boolean;
}) {
  const [entityType, setEntityType] = useState<string>('invoice');
  const [entityId, setEntityId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId.trim()) {
      alert('Please enter an Entity ID');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSync(entityType, entityId.trim());
      setEntityId(''); // Clear on success
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
          >
            <option value="customer">Customer</option>
            <option value="subscription">Subscription</option>
            <option value="invoice">Invoice</option>
            <option value="payment">Payment</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Entity ID (UUID)
          </label>
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="e.g., 9af1d593-ce38-4b34-8d2b-446a7f7f57ad"
            className="w-full border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange font-mono"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || isRetrying || !entityId.trim()}
          className="bg-circleTel-orange hover:bg-circleTel-orange/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Trigger Sync
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
