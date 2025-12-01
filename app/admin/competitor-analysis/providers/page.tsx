'use client';

/**
 * Provider Management Page
 *
 * Lists all competitor providers with filtering, search, and management actions.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import type { ProviderStats, ProviderType } from '@/lib/competitor-analysis/types';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ProviderType | ''>('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [scrapingProvider, setScrapingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/competitor-analysis/providers');

      if (!res.ok) {
        throw new Error('Failed to fetch providers');
      }

      const data = await res.json();
      setProviders(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function triggerScrape(providerId: string, providerSlug: string) {
    try {
      setScrapingProvider(providerId);

      const res = await fetch('/api/admin/competitor-analysis/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_slug: providerSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to trigger scrape');
      }

      alert(`Scrape started for ${providerSlug}`);
      fetchProviders(); // Refresh data
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setScrapingProvider(null);
    }
  }

  // Filter providers
  const filteredProviders = providers.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterType && p.provider_type !== filterType) {
      return false;
    }
    if (filterActive !== null && p.is_active !== filterActive) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
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
          <div className="flex items-center gap-2">
            <Link
              href="/admin/competitor-analysis"
              className="text-gray-500 hover:text-gray-700"
            >
              Competitor Analysis
            </Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Manage competitor providers and scraping configuration
          </p>
        </div>
        <button
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Provider
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ProviderType | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All Types</option>
          <option value="mobile">Mobile</option>
          <option value="fibre">Fibre</option>
          <option value="both">Both</option>
        </select>

        {/* Active Filter */}
        <select
          value={filterActive === null ? '' : filterActive.toString()}
          onChange={(e) => {
            const val = e.target.value;
            setFilterActive(val === '' ? null : val === 'true');
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Provider List */}
      <div className="space-y-4">
        {filteredProviders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No providers found matching your filters
          </div>
        ) : (
          filteredProviders.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              onScrape={() => triggerScrape(provider.id, provider.slug)}
              isScraping={scrapingProvider === provider.id}
            />
          ))
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
        <span>
          Showing {filteredProviders.length} of {providers.length} providers
        </span>
        <span>
          {providers.filter((p) => p.is_active).length} active
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface ProviderRowProps {
  provider: ProviderStats;
  onScrape: () => void;
  isScraping: boolean;
}

function ProviderRow({ provider, onScrape, isScraping }: ProviderRowProps) {
  const isStale = provider.last_scraped_at
    ? new Date(provider.last_scraped_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
    : true;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          {provider.logo_url ? (
            <img
              src={provider.logo_url}
              alt={provider.name}
              className="w-12 h-12 rounded-lg object-contain"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/competitor-analysis/providers/${provider.slug}`}
              className="font-semibold text-gray-900 hover:text-orange-600"
            >
              {provider.name}
            </Link>
            {provider.is_active ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                <CheckCircleIcon className="w-3 h-3" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <XCircleIcon className="w-3 h-3" />
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="capitalize">{provider.provider_type}</span>
            <span>|</span>
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-orange-600"
            >
              <GlobeAltIcon className="w-4 h-4" />
              Website
            </a>
            <span>|</span>
            <span className="capitalize">{provider.scrape_frequency} scrape</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-xl font-semibold text-gray-900">{provider.current_products}</p>
            <p className="text-xs text-gray-500">Products</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {provider.avg_monthly_price ? `R${Math.round(provider.avg_monthly_price)}` : '-'}
            </p>
            <p className="text-xs text-gray-500">Avg Price</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900">{provider.matched_products}</p>
            <p className="text-xs text-gray-500">Matched</p>
          </div>
        </div>

        {/* Last Scraped */}
        <div className="text-right min-w-[120px]">
          {provider.last_scraped_at ? (
            <div className={isStale ? 'text-amber-600' : 'text-gray-500'}>
              <p className="text-sm font-medium">
                {formatRelativeTime(provider.last_scraped_at)}
              </p>
              <p className="text-xs">Last scraped</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Never scraped</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onScrape}
            disabled={isScraping || !provider.is_active}
            className="p-2 text-gray-400 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trigger scrape"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isScraping ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href={`/admin/competitor-analysis/providers/${provider.slug}`}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
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

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
