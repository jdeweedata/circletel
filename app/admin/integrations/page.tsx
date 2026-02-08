'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, XCircle, Activity, Key, Webhook, BarChart3, Cog } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AIAssistantWidget,
  IntegrationCard,
  StatusPill,
  ZohoSyncTab,
} from '@/components/admin/integrations';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// HELPERS
// ============================================================================

const getCategoryGroup = (slug: string): string => {
  if (slug.includes('sms') || slug.includes('email')) return 'Messaging & Notifications';
  if (slug.includes('kyc') || slug.includes('didit')) return 'Identity Verification';
  if (slug.includes('maps') || slug.includes('mtn') || slug.includes('coverage')) return 'Coverage & Mapping';
  if (slug.includes('netcash') || slug.includes('zoho')) return 'Billing & Payments';
  return 'Other Services';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

  // Loading state
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

  // Error state
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
            <Button onClick={handleRefresh} variant="outline" className="w-full">
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
            All
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Health
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
            <RefreshCw className="h-4 w-4 mr-2" />
            Zoho Sync
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-circleTel-orange data-[state=active]:text-white">
            <Cog className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* ALL INTEGRATIONS TAB */}
        <TabsContent value="all" className="space-y-6">
          {/* Status Summary */}
          {healthSummary && (
            <section className="flex flex-wrap gap-4 text-sm">
              <StatusPill label="Total" value={healthSummary.total} />
              <StatusPill label="Healthy" value={healthSummary.healthy} color="text-green-600" />
              <StatusPill label="Degraded" value={healthSummary.degraded} color="text-yellow-600" />
              <StatusPill label="Down" value={healthSummary.down} color="text-red-600" />
              <StatusPill label="Unknown" value={healthSummary.unknown} color="text-gray-700" />
              <StatusPill label="Alerts" value={healthSummary.activeAlerts} color="text-orange-600" />
            </section>
          )}

          {/* Search & Filters */}
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

          {/* Grouped Integrations */}
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
                  <h2 className="text-xl font-semibold text-foreground">{groupName}</h2>
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
          <HealthDashboardContent
            healthSummary={healthSummary}
            integrations={integrations}
            groupedIntegrations={groupedIntegrations}
          />
        </TabsContent>

        {/* API KEYS TAB */}
        <TabsContent value="keys" className="space-y-6">
          <ApiKeysContent integrations={integrations} />
        </TabsContent>

        {/* WEBHOOKS TAB */}
        <TabsContent value="webhooks" className="space-y-6">
          <WebhooksContent integrations={integrations} />
        </TabsContent>

        {/* ZOHO SYNC TAB - Uses extracted component */}
        <TabsContent value="zoho-sync" className="space-y-6">
          <ZohoSyncTab isActive={activeTab === 'zoho-sync'} />
        </TabsContent>

        {/* CONFIGURATION TAB */}
        <TabsContent value="config" className="space-y-6">
          <ConfigurationContent />
        </TabsContent>
      </Tabs>

      {/* AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}

// ============================================================================
// TAB CONTENT COMPONENTS (inline for now, can be extracted later)
// ============================================================================

function HealthDashboardContent({
  healthSummary,
  integrations,
  groupedIntegrations,
}: {
  healthSummary: HealthSummary | null;
  integrations: Integration[];
  groupedIntegrations: Record<string, Integration[]>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-circleTel-orange" />
          Integration Health Dashboard
        </CardTitle>
        <CardDescription>Visual monitoring and health trends for all integrations</CardDescription>
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

        {/* Requiring Attention */}
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
                        <Link href={`/admin/integrations/${integration.slug}`}>View Details</Link>
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function ApiKeysContent({ integrations }: { integrations: Integration[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-circleTel-orange" />
          API Keys & Credentials
        </CardTitle>
        <CardDescription>Manage API keys, OAuth credentials, and authentication secrets</CardDescription>
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
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/integrations/${integration.slug}`}>Configure</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WebhooksContent({ integrations }: { integrations: Integration[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-circleTel-orange" />
          Webhook Events & Logs
        </CardTitle>
        <CardDescription>Recent webhook deliveries and event history</CardDescription>
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
                        <Link href={`/admin/integrations/${integration.slug}?tab=webhooks`}>View Logs</Link>
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
  );
}

function ConfigurationContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="h-5 w-5 text-circleTel-orange" />
          Global Configuration
        </CardTitle>
        <CardDescription>System-wide integration settings and preferences</CardDescription>
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
  );
}
