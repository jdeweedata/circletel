'use client';

/**
 * Competitor Analytics Page
 *
 * Visual analytics for competitor pricing including charts,
 * trends, and market analysis visualizations.
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { PriceHistoryChart, type PriceSeries } from '@/components/admin/competitor-analysis/PriceHistoryChart';
import {
  MarketPositionChart,
  MarketSegmentChart,
  type CompetitorPrice,
  type SegmentData,
} from '@/components/admin/competitor-analysis/MarketPositionChart';
import type { CompetitorProduct, ProviderStats } from '@/lib/competitor-analysis/types';

export default function AnalyticsPage() {
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [productsRes, providersRes] = await Promise.all([
        fetch('/api/admin/competitor-analysis/products?limit=500'),
        fetch('/api/admin/competitor-analysis/providers'),
      ]);

      if (!productsRes.ok || !providersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const productsData = await productsRes.json();
      const providersData = await providersRes.json();

      setProducts(productsData.data || []);
      setProviders(providersData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedProvider && p.provider_id !== selectedProvider) return false;
      if (selectedProductType && p.product_type !== selectedProductType) return false;
      return true;
    });
  }, [products, selectedProvider, selectedProductType]);

  // Market position data
  const marketPositionData = useMemo((): CompetitorPrice[] => {
    // Group by provider and get average price
    const providerPrices = new Map<string, { total: number; count: number; name: string }>();

    for (const product of filteredProducts) {
      if (product.monthly_price === null) continue;

      const provider = providers.find((p) => p.id === product.provider_id);
      if (!provider) continue;

      if (!providerPrices.has(product.provider_id)) {
        providerPrices.set(product.provider_id, {
          total: 0,
          count: 0,
          name: provider.name,
        });
      }

      const entry = providerPrices.get(product.provider_id)!;
      entry.total += product.monthly_price;
      entry.count++;
    }

    return Array.from(providerPrices.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      price: Math.round(data.total / data.count),
    }));
  }, [filteredProducts, providers]);

  // Segment data by product type
  const segmentData = useMemo((): SegmentData[] => {
    const segments = new Map<string, number[]>();

    for (const product of filteredProducts) {
      if (product.monthly_price === null || !product.product_type) continue;

      if (!segments.has(product.product_type)) {
        segments.set(product.product_type, []);
      }
      segments.get(product.product_type)!.push(product.monthly_price);
    }

    return Array.from(segments.entries()).map(([segment, prices]) => ({
      segment: formatProductType(segment),
      avgPrice: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      productCount: prices.length,
    }));
  }, [filteredProducts]);

  // Technology segment data
  const techSegmentData = useMemo((): SegmentData[] => {
    const segments = new Map<string, number[]>();

    for (const product of filteredProducts) {
      if (product.monthly_price === null) continue;
      const tech = product.technology || 'Unknown';

      if (!segments.has(tech)) {
        segments.set(tech, []);
      }
      segments.get(tech)!.push(product.monthly_price);
    }

    return Array.from(segments.entries()).map(([segment, prices]) => ({
      segment,
      avgPrice: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      productCount: prices.length,
    }));
  }, [filteredProducts]);

  // Price distribution for histogram-like view
  const priceDistribution = useMemo(() => {
    const buckets: Record<string, number> = {};
    const bucketSize = 100;

    for (const product of filteredProducts) {
      if (product.monthly_price === null) continue;

      const bucket = Math.floor(product.monthly_price / bucketSize) * bucketSize;
      const label = `R${bucket}-${bucket + bucketSize}`;

      buckets[label] = (buckets[label] || 0) + 1;
    }

    return Object.entries(buckets)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aVal = parseInt(a.range.replace('R', ''));
        const bVal = parseInt(b.range.replace('R', ''));
        return aVal - bVal;
      });
  }, [filteredProducts]);

  // Export function
  function exportData(format: 'csv' | 'json') {
    const data = filteredProducts.map((p) => ({
      provider: providers.find((pr) => pr.id === p.provider_id)?.name || p.provider_id,
      product_name: p.product_name,
      product_type: p.product_type,
      monthly_price: p.monthly_price,
      data_bundle: p.data_bundle,
      technology: p.technology,
      scraped_at: p.scraped_at,
    }));

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row) =>
        Object.values(row)
          .map((v) => (typeof v === 'string' ? `"${v}"` : v))
          .join(',')
      );
      content = [headers, ...rows].join('\n');
      filename = 'competitor-analysis.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(data, null, 2);
      filename = 'competitor-analysis.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
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

  // Calculate average market price for demo
  const avgMarketPrice = marketPositionData.length > 0
    ? Math.round(
        marketPositionData.reduce((sum, p) => sum + p.price, 0) / marketPositionData.length
      )
    : 500;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/competitor-analysis" className="hover:text-gray-700">
              Competitor Analysis
            </Link>
            <span>/</span>
            <span className="text-gray-900">Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Market Analytics</h1>
          <p className="text-gray-500 mt-1">
            Visual analysis of competitor pricing and market trends
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportData('csv')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => exportData('json')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <FunnelIcon className="w-5 h-5 text-gray-400" />
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All Providers</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={selectedProductType}
          onChange={(e) => setSelectedProductType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All Product Types</option>
          <option value="mobile_contract">Mobile Contract</option>
          <option value="fibre">Fibre</option>
          <option value="lte">LTE</option>
          <option value="data_only">Data Only</option>
          <option value="device">Device</option>
        </select>
        <span className="text-sm text-gray-500">
          {filteredProducts.length} products
        </span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Position by Provider */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-orange-500" />
            Average Price by Provider
          </h3>
          <MarketPositionChart
            competitors={marketPositionData}
            yourPrice={avgMarketPrice}
            yourName="Market Avg"
            height={300}
            showAverage={false}
          />
        </div>

        {/* Price by Product Type */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-500" />
            Average Price by Product Type
          </h3>
          <MarketSegmentChart segments={segmentData} height={300} />
        </div>

        {/* Price by Technology */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-green-500" />
            Average Price by Technology
          </h3>
          <MarketSegmentChart segments={techSegmentData} height={300} />
        </div>

        {/* Price Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-purple-500" />
            Price Distribution
          </h3>
          <PriceDistributionChart data={priceDistribution} height={300} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Market Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">{filteredProducts.length}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">
              {new Set(filteredProducts.map((p) => p.provider_id)).size}
            </p>
            <p className="text-sm text-gray-500">Providers</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              R{Math.min(...filteredProducts.filter((p) => p.monthly_price).map((p) => p.monthly_price!)) || 0}
            </p>
            <p className="text-sm text-gray-500">Lowest Price</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">
              R{Math.max(...filteredProducts.filter((p) => p.monthly_price).map((p) => p.monthly_price!)) || 0}
            </p>
            <p className="text-sm text-gray-500">Highest Price</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function PriceDistributionChart({
  data,
  height,
}: {
  data: Array<{ range: string; count: number }>;
  height: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            label={{
              value: 'Products',
              angle: -90,
              position: 'insideLeft',
              fill: '#6B7280',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [value, 'Products']}
          />
          <Bar dataKey="count" fill="#F5831F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatProductType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
