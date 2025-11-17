'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

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
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f8fa]">
        <div className="max-w-md bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading Integrations</h3>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full border rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] text-gray-800 p-10 space-y-12">
      {/* PAGE HEADER */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Integrations</h1>
          <p className="text-gray-500 text-sm">
            Monitor and manage all third-party integrations connected to CircleTel.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm bg-white shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
      <section className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border rounded-2xl shadow-sm">
        <div className="flex items-center flex-1 gap-3">
          <div className="flex items-center bg-gray-100 border rounded-xl px-3 py-2 w-full max-w-md">
            <span className="text-gray-500 mr-2">🔍</span>
            <input
              placeholder="Search integrations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none w-full text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border px-3 py-2 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
          >
            <option value="all">All Categories</option>
            <option value="api_key">API Key</option>
            <option value="oauth">OAuth</option>
            <option value="webhook_only">Webhook Only</option>
          </select>

          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="border px-3 py-2 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </section>

      {/* GROUPED INTEGRATIONS */}
      {Object.keys(groupedIntegrations).length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-500">No integrations found matching your filters.</p>
        </div>
      ) : (
        Object.entries(groupedIntegrations).map(([groupName, groupIntegrations]) => (
          <section key={groupName} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>{groupName}</span>
              <span className="text-[11px] uppercase tracking-wide text-gray-400">
                {groupIntegrations.length} {groupIntegrations.length === 1 ? 'integration' : 'integrations'}
              </span>
            </h2>
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
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
      <span className={`font-semibold ${color}`}>{value}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

// Integration Card Component
function IntegrationCard({ integration }: { integration: Integration }) {
  const statusColorMap = {
    healthy: 'text-green-600',
    degraded: 'text-yellow-600',
    down: 'text-red-600',
    unknown: 'text-gray-500',
  };

  const badges = [];
  if (integration.category === 'api_key') badges.push('API Key');
  if (integration.category === 'oauth') badges.push('OAuth');
  if (integration.has_webhook) badges.push('Webhook');

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

  // Get logo path based on integration slug
  const getLogoPath = (slug: string) => {
    // Map of integration slugs to logo file names
    const logoMap: Record<string, string> = {
      'clickatell-sms': 'clickatell.svg',
      'resend-email': 'resend.svg',
      'didit-kyc': 'didit-kyc.svg',
      'google-maps-platform': 'google-maps.svg',
      'mtn-coverage-api': 'mtn.svg',
      'netcash-pay-now': 'netcash.svg',
      'zoho-crm': 'zoho.svg',
      'zoho-billing': 'zoho.svg',
      'zoho-sign': 'zoho.svg',
    };

    return `/integrations/${logoMap[slug] || 'default.svg'}`;
  };

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            {/* Fallback to first letter if logo doesn't exist */}
            <div className="h-7 w-7 flex items-center justify-center text-lg font-bold text-circleTel-orange">
              {integration.name.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-gray-900 leading-snug">{integration.name}</h3>
            </div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              {integration.category === 'api_key' ? 'API Integration' :
               integration.category === 'oauth' ? 'OAuth Integration' :
               'Webhook Integration'}
            </p>
            <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
          </div>
        </div>
        <span className={`text-xs font-medium whitespace-nowrap ${statusColorMap[integration.health_status]}`}>
          ● {integration.health_status.charAt(0).toUpperCase() + integration.health_status.slice(1)}
        </span>
      </div>

      {/* Alert Banner */}
      {integration.consecutive_failures >= 3 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-800">
          ⚠️ {integration.consecutive_failures} consecutive failures
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {badges.map((badge) => (
          <span
            key={badge}
            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
          >
            {badge}
          </span>
        ))}
        {!integration.is_enabled && (
          <span className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
            Disabled
          </span>
        )}
      </div>

      <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
        <span>Last checked: {formatLastChecked(integration.health_last_checked_at)}</span>
        <button className="text-[11px] text-gray-500 hover:text-gray-700 underline underline-offset-2">
          Run health check
        </button>
      </div>

      <Link href={`/admin/integrations/${integration.slug}`} className="mt-3 w-full">
        <button className="w-full text-center border rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition">
          View Integration →
        </button>
      </Link>
    </div>
  );
}
