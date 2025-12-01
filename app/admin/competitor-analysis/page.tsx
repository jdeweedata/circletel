'use client';

/**
 * Competitor Analysis Dashboard
 *
 * Main dashboard for competitor price tracking and market analysis.
 * Shows stats, alerts, provider status, and recent activity.
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import type { DashboardStats, ProviderStats, CompetitorProduct } from '@/lib/competitor-analysis/types';
import { PriceHistoryChart, MarketPositionChart } from '@/components/admin/competitor-analysis';
import type { PriceSeries, CompetitorPrice } from '@/components/admin/competitor-analysis';

export default function CompetitorAnalysisDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [statsRes, providersRes, productsRes] = await Promise.all([
          fetch('/api/admin/competitor-analysis'),
          fetch('/api/admin/competitor-analysis/providers'),
          fetch('/api/admin/competitor-analysis/products?is_current=true&limit=100'),
        ]);

        if (!statsRes.ok || !providersRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsRes.json();
        const providersData = await providersRes.json();
        const productsData = productsRes.ok ? await productsRes.json() : { data: [] };

        setStats(statsData);
        setProviders(providersData.data || []);
        setProducts(productsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Prepare chart data
  const priceHistoryData = useMemo((): PriceSeries[] => {
    // Group products by provider for price comparison
    const providerMap = new Map<string, { name: string; prices: { date: string; price: number | null }[] }>();

    for (const product of products) {
      if (!product.monthly_price) continue;

      const providerName = providers.find(p => p.id === product.provider_id)?.name || 'Unknown';

      if (!providerMap.has(product.provider_id)) {
        providerMap.set(product.provider_id, {
          name: providerName,
          prices: [],
        });
      }

      const provider = providerMap.get(product.provider_id)!;
      provider.prices.push({
        date: product.scraped_at,
        price: product.monthly_price,
      });
    }

    return Array.from(providerMap.entries()).slice(0, 5).map(([id, data]) => ({
      id,
      name: data.name,
      data: data.prices.slice(-10).map(p => ({
        date: p.date,
        price: p.price,
      })),
    }));
  }, [products, providers]);

  const marketPositionData = useMemo((): CompetitorPrice[] => {
    // Get average prices by provider
    const providerPrices = new Map<string, { name: string; total: number; count: number }>();

    for (const product of products) {
      if (!product.monthly_price) continue;

      const providerName = providers.find(p => p.id === product.provider_id)?.name || 'Unknown';

      if (!providerPrices.has(product.provider_id)) {
        providerPrices.set(product.provider_id, { name: providerName, total: 0, count: 0 });
      }

      const data = providerPrices.get(product.provider_id)!;
      data.total += product.monthly_price;
      data.count++;
    }

    return Array.from(providerPrices.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      price: Math.round(data.total / data.count),
    }));
  }, [products, providers]);

  // Calculate CircleTel average price (placeholder - would come from your products)
  const yourAveragePrice = 599; // This would be fetched from your actual product data

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
          <p className="text-gray-500 mt-1">
            Track competitor pricing and market positioning
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/competitor-analysis/providers"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Manage Providers
          </Link>
          <button
            onClick={() => triggerScrapeAll()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Scrape All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Providers"
          value={stats?.active_providers || 0}
          subtitle={`of ${stats?.total_providers || 0} total`}
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Products Tracked"
          value={stats?.current_products || 0}
          subtitle={`${stats?.total_products || 0} total scraped`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="Product Matches"
          value={stats?.total_matches || 0}
          subtitle="CircleTel to competitor"
          icon={<ChartBarIcon className="w-6 h-6" />}
          color="purple"
        />
        <StatsCard
          title="Price Changes"
          value={stats?.price_changes_last_7_days || 0}
          subtitle="in last 7 days"
          icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Alerts Section */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Alerts ({stats.alerts.length})
          </h3>
          <div className="space-y-2">
            {stats.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 text-sm text-amber-700"
              >
                <span className="font-medium">{alert.title}:</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Position Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Market Position</h3>
            <button
              onClick={() => exportData('market-position')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>
          </div>
          {marketPositionData.length > 0 ? (
            <MarketPositionChart
              competitors={marketPositionData}
              yourPrice={yourAveragePrice}
              yourName="CircleTel"
              height={280}
              showAverage
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No price data available yet</p>
            </div>
          )}
        </div>

        {/* Price History Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Price Trends</h3>
            <button
              onClick={() => exportData('price-history')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>
          </div>
          {priceHistoryData.length > 0 ? (
            <PriceHistoryChart
              series={priceHistoryData}
              yourPrice={yourAveragePrice}
              height={280}
              showLegend
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No price history available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Provider Status Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.slice(0, 6).map((provider) => (
            <ProviderStatusCard key={provider.id} provider={provider} />
          ))}
        </div>
        {providers.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              href="/admin/competitor-analysis/providers"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              View all {providers.length} providers
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Scrape</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {stats?.last_scrape_at ? (
            <div className="flex items-center gap-3 text-gray-600">
              <ClockIcon className="w-5 h-5" />
              <span>
                Last scraped {formatRelativeTime(stats.last_scrape_at)}
              </span>
              <span className="text-gray-400">|</span>
              <span>{stats.scrapes_last_7_days} scrapes in last 7 days</span>
            </div>
          ) : (
            <p className="text-gray-500">No scrapes recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );

  async function triggerScrapeAll() {
    try {
      const res = await fetch('/api/admin/competitor-analysis/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to trigger scrape');
      }

      const data = await res.json();
      alert(`Started scrape for ${data.providers?.length || 0} providers`);
    } catch (err) {
      alert('Failed to trigger scrape: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  function exportData(type: 'market-position' | 'price-history') {
    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'market-position') {
      // Export market position data as CSV
      const headers = ['Provider', 'Average Price (ZAR)'];
      const rows = marketPositionData.map(p => [p.name, p.price.toString()]);
      rows.unshift(['CircleTel', yourAveragePrice.toString()]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csv, `market-position-${timestamp}.csv`);
    } else {
      // Export price history data as CSV
      const headers = ['Date', ...priceHistoryData.map(s => s.name)];
      const dateSet = new Set<string>();
      for (const series of priceHistoryData) {
        for (const point of series.data) {
          dateSet.add(point.date);
        }
      }

      const dates = Array.from(dateSet).sort();
      const rows = dates.map(date => {
        const row = [formatDateForExport(date)];
        for (const series of priceHistoryData) {
          const point = series.data.find(p => p.date === date);
          row.push(point?.price?.toString() || '');
        }
        return row;
      });

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csv, `price-history-${timestamp}.csv`);
    }
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function formatDateForExport(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorStyles[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-1">{subtitle}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
}

interface ProviderStatusCardProps {
  provider: ProviderStats;
}

function ProviderStatusCard({ provider }: ProviderStatusCardProps) {
  const isStale = provider.last_scraped_at
    ? new Date(provider.last_scraped_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
    : true;

  return (
    <Link
      href={`/admin/competitor-analysis/providers/${provider.slug}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {provider.logo_url ? (
            <img
              src={provider.logo_url}
              alt={provider.name}
              className="w-10 h-10 rounded-lg object-contain"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{provider.provider_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {provider.is_active ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">{provider.current_products}</p>
          <p className="text-xs text-gray-500">Products</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {provider.avg_monthly_price ? `R${Math.round(provider.avg_monthly_price)}` : '-'}
          </p>
          <p className="text-xs text-gray-500">Avg Price</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{provider.matched_products}</p>
          <p className="text-xs text-gray-500">Matched</p>
        </div>
      </div>
      {provider.last_scraped_at && (
        <div className={`mt-3 text-xs ${isStale ? 'text-amber-600' : 'text-gray-500'}`}>
          Last scraped {formatRelativeTime(provider.last_scraped_at)}
        </div>
      )}
    </Link>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
