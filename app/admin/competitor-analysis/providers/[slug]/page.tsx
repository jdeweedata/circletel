'use client';

/**
 * Provider Detail Page
 *
 * Shows detailed information about a single competitor provider,
 * including products, scrape history, and configuration.
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import type { CompetitorProduct, CompetitorScrapeLog } from '@/lib/competitor-analysis/types';

interface ProviderDetailData {
  id: string;
  name: string;
  slug: string;
  website: string;
  logo_url: string | null;
  provider_type: string;
  is_active: boolean;
  scrape_frequency: string;
  last_scraped_at: string | null;
  current_products: number;
  total_products: number;
  avg_monthly_price: number | null;
  min_monthly_price: number | null;
  max_monthly_price: number | null;
  matched_products: number;
  scrape_urls: string[];
  scrape_config: Record<string, unknown>;
  recent_products: CompetitorProduct[];
  scrape_history: CompetitorScrapeLog[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProviderDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [provider, setProvider] = useState<ProviderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'history' | 'config'>('products');
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    fetchProvider();
  }, [slug]);

  async function fetchProvider() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/competitor-analysis/providers/${slug}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Provider not found');
        }
        throw new Error('Failed to fetch provider');
      }

      const data = await res.json();
      setProvider(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function triggerScrape() {
    if (!provider) return;

    try {
      setIsScraping(true);

      const res = await fetch('/api/admin/competitor-analysis/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_slug: provider.slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to trigger scrape');
      }

      alert('Scrape started successfully');
      fetchProvider(); // Refresh data
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsScraping(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || 'Provider not found'}</p>
          <Link
            href="/admin/competitor-analysis/providers"
            className="text-red-600 hover:underline mt-2 inline-block"
          >
            Back to providers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/competitor-analysis" className="hover:text-gray-700">
            Competitor Analysis
          </Link>
          <span>/</span>
          <Link href="/admin/competitor-analysis/providers" className="hover:text-gray-700">
            Providers
          </Link>
          <span>/</span>
          <span className="text-gray-900">{provider.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {provider.logo_url ? (
              <img
                src={provider.logo_url}
                alt={provider.name}
                className="w-16 h-16 rounded-lg object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {provider.name}
                {provider.is_active ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-gray-400" />
                )}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-gray-500">
                <span className="capitalize">{provider.provider_type}</span>
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-orange-600"
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  {provider.website}
                </a>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={triggerScrape}
              disabled={isScraping || !provider.is_active}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isScraping ? 'animate-spin' : ''}`} />
              {isScraping ? 'Scraping...' : 'Scrape Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{provider.current_products}</p>
              <p className="text-sm text-gray-500">Current Products</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {provider.avg_monthly_price ? `R${Math.round(provider.avg_monthly_price)}` : '-'}
              </p>
              <p className="text-sm text-gray-500">Avg Monthly Price</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {provider.min_monthly_price && provider.max_monthly_price
                  ? `R${provider.min_monthly_price} - R${provider.max_monthly_price}`
                  : '-'}
              </p>
              <p className="text-sm text-gray-500">Price Range</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 capitalize">{provider.scrape_frequency}</p>
              <p className="text-sm text-gray-500">Scrape Frequency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {(['products', 'history', 'config'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 border-b-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'config' ? 'Configuration' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <ProductsTab products={provider.recent_products} />
      )}
      {activeTab === 'history' && (
        <HistoryTab history={provider.scrape_history} />
      )}
      {activeTab === 'config' && (
        <ConfigTab
          scrapeUrls={provider.scrape_urls}
          scrapeConfig={provider.scrape_config}
        />
      )}
    </div>
  );
}

// =============================================================================
// TAB COMPONENTS
// =============================================================================

function ProductsTab({ products }: { products: CompetitorProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No products scraped yet. Trigger a scrape to populate products.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Product</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Monthly</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Once-off</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Data</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tech</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-[300px]">
                    {product.product_name}
                  </p>
                  {product.device_name && (
                    <p className="text-sm text-gray-500">{product.device_name}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                {product.product_type?.replace('_', ' ') || '-'}
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                {product.monthly_price ? `R${product.monthly_price}` : '-'}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {product.once_off_price ? `R${product.once_off_price}` : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {product.data_bundle || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {product.technology || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTab({ history }: { history: CompetitorScrapeLog[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No scrape history yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((log) => (
        <div
          key={log.id}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  log.status === 'completed'
                    ? 'bg-green-500'
                    : log.status === 'failed'
                    ? 'bg-red-500'
                    : log.status === 'running'
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-400'
                }`}
              />
              <div>
                <p className="font-medium text-gray-900 capitalize">{log.status}</p>
                <p className="text-sm text-gray-500">
                  {new Date(log.started_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-medium text-gray-900">{log.products_found}</p>
                <p className="text-gray-500">Found</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{log.products_new}</p>
                <p className="text-gray-500">New</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{log.products_updated}</p>
                <p className="text-gray-500">Updated</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{log.firecrawl_credits_used}</p>
                <p className="text-gray-500">Credits</p>
              </div>
            </div>
          </div>
          {log.error_message && (
            <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
              {log.error_message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfigTab({
  scrapeUrls,
  scrapeConfig,
}: {
  scrapeUrls: string[];
  scrapeConfig: Record<string, unknown>;
}) {
  return (
    <div className="space-y-6">
      {/* Scrape URLs */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Scrape URLs</h3>
        {scrapeUrls.length === 0 ? (
          <p className="text-gray-500 text-sm">No URLs configured</p>
        ) : (
          <ul className="space-y-2">
            {scrapeUrls.map((url, i) => (
              <li key={i} className="flex items-center gap-2">
                <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Scrape Config */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Scrape Configuration</h3>
        {Object.keys(scrapeConfig).length === 0 ? (
          <p className="text-gray-500 text-sm">Using default configuration</p>
        ) : (
          <pre className="bg-gray-50 p-3 rounded text-sm text-gray-700 overflow-auto">
            {JSON.stringify(scrapeConfig, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
