'use client';

/**
 * Price Comparison Table Component
 *
 * Displays price comparison data between CircleTel products and competitors.
 * Supports sorting, filtering, and visual indicators for price positioning.
 */

import { useState, useMemo } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import type { PriceComparisonResult } from '@/lib/competitor-analysis/types';

interface PriceComparisonTableProps {
  comparisons: PriceComparisonResult[];
  yourPrice?: number;
  loading?: boolean;
}

type SortField = 'competitor_name' | 'competitor_price' | 'competitor_data_gb' | 'scraped_at';
type SortDirection = 'asc' | 'desc';

export function PriceComparisonTable({
  comparisons,
  yourPrice,
  loading = false,
}: PriceComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('competitor_price');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort comparisons
  const sortedComparisons = useMemo(() => {
    return [...comparisons].sort((a, b) => {
      let aVal: number | string | null = null;
      let bVal: number | string | null = null;

      switch (sortField) {
        case 'competitor_name':
          aVal = a.competitor_name;
          bVal = b.competitor_name;
          break;
        case 'competitor_price':
          aVal = a.competitor_price;
          bVal = b.competitor_price;
          break;
        case 'competitor_data_gb':
          aVal = a.competitor_data_gb;
          bVal = b.competitor_data_gb;
          break;
        case 'scraped_at':
          aVal = a.scraped_at;
          bVal = b.scraped_at;
          break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [comparisons, sortField, sortDirection]);

  // Calculate stats
  const stats = useMemo(() => {
    const prices = comparisons
      .map((c) => c.competitor_price)
      .filter((p): p is number => p !== null);

    if (prices.length === 0) {
      return { min: null, max: null, avg: null };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
    };
  }, [comparisons]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
        No price comparisons available. Match products to see comparisons.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Your Price</p>
          <p className="text-xl font-bold text-gray-900">
            {yourPrice ? `R${yourPrice}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Market Low</p>
          <p className="text-xl font-bold text-green-600">
            {stats.min ? `R${stats.min}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Market Avg</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.avg ? `R${stats.avg}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Market High</p>
          <p className="text-xl font-bold text-red-600">
            {stats.max ? `R${stats.max}` : '-'}
          </p>
        </div>
      </div>

      {/* Your Position Indicator */}
      {yourPrice && stats.min && stats.max && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">Your Market Position</p>
          <div className="relative h-4 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow"
              style={{
                left: `${Math.min(
                  100,
                  Math.max(0, ((yourPrice - stats.min) / (stats.max - stats.min)) * 100)
                )}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>R{stats.min}</span>
            <span>R{stats.max}</span>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                label="Competitor"
                field="competitor_name"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Product
              </th>
              <SortableHeader
                label="Price"
                field="competitor_price"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="right"
              />
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                vs You
              </th>
              <SortableHeader
                label="Data"
                field="competitor_data_gb"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Tech
              </th>
              <SortableHeader
                label="Updated"
                field="scraped_at"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedComparisons.map((comparison) => (
              <ComparisonRow
                key={comparison.match_id}
                comparison={comparison}
                yourPrice={yourPrice}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  align?: 'left' | 'right';
}

function SortableHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
  align = 'left',
}: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <th
      className={`px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {isActive && (
          direction === 'asc' ? (
            <ArrowUpIcon className="w-4 h-4" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )
        )}
      </div>
    </th>
  );
}

interface ComparisonRowProps {
  comparison: PriceComparisonResult;
  yourPrice?: number;
}

function ComparisonRow({ comparison, yourPrice }: ComparisonRowProps) {
  // Calculate price difference
  let priceDiff: number | null = null;
  let priceDiffPercent: number | null = null;

  if (yourPrice && comparison.competitor_price) {
    priceDiff = comparison.competitor_price - yourPrice;
    priceDiffPercent = Math.round((priceDiff / yourPrice) * 100);
  }

  return (
    <tr className="hover:bg-gray-50">
      {/* Competitor */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {comparison.competitor_logo ? (
            <img
              src={comparison.competitor_logo}
              alt={comparison.competitor_name}
              className="w-8 h-8 rounded object-contain"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <span className="font-medium text-gray-900">{comparison.competitor_name}</span>
        </div>
      </td>

      {/* Product */}
      <td className="px-4 py-3">
        <div>
          <p className="text-gray-900 truncate max-w-[200px]">{comparison.competitor_product}</p>
          {comparison.competitor_device && (
            <p className="text-sm text-gray-500">{comparison.competitor_device}</p>
          )}
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-right">
        <span className="font-semibold text-gray-900">
          {comparison.competitor_price ? `R${comparison.competitor_price}` : '-'}
        </span>
        {comparison.competitor_once_off && (
          <span className="text-xs text-gray-500 block">
            +R{comparison.competitor_once_off} once-off
          </span>
        )}
      </td>

      {/* vs You */}
      <td className="px-4 py-3 text-right">
        {priceDiff !== null && priceDiffPercent !== null ? (
          <div className="flex items-center justify-end gap-1">
            {priceDiff > 0 ? (
              <>
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  +R{priceDiff} ({priceDiffPercent}%)
                </span>
              </>
            ) : priceDiff < 0 ? (
              <>
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
                <span className="text-red-600 font-medium">
                  R{priceDiff} ({priceDiffPercent}%)
                </span>
              </>
            ) : (
              <>
                <MinusIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Same</span>
              </>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Data */}
      <td className="px-4 py-3 text-gray-600">
        {comparison.competitor_data || '-'}
      </td>

      {/* Tech */}
      <td className="px-4 py-3 text-gray-600">
        {comparison.competitor_technology || '-'}
      </td>

      {/* Updated */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatRelativeTime(comparison.scraped_at)}
      </td>
    </tr>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default PriceComparisonTable;
