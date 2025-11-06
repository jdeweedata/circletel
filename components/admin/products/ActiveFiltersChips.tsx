'use client';

import { ProductFilters } from '@/lib/types/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ActiveFiltersChipsProps {
  filters: ProductFilters;
  searchQuery: string;
  onRemoveFilter: (key: keyof ProductFilters) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

function formatFilterLabel(key: string, value: any): string {
  const keyMap: Record<string, string> = {
    category: 'Category',
    status: 'Status',
    contract_term: 'Contract',
    device_type: 'Device',
    technology: 'Tech',
    data_package: 'Data',
    sort_by: 'Sort',
    service_type: 'Service',
  };

  const valueMap: Record<string, Record<string, string>> = {
    category: {
      connectivity: 'Connectivity',
      hardware: 'Hardware',
      software: 'Software',
      services: 'Services',
      bundles: 'Bundles',
    },
    status: {
      active: 'Active',
      draft: 'Draft',
      inactive: 'Inactive',
      archived: 'Archived',
    },
    device_type: {
      sim_only: 'SIM-Only',
      cpe: 'CPE/Router',
      handset: 'Handset',
      other: 'Other',
    },
    technology: {
      '5g': '5G',
      lte: 'LTE',
      fibre: 'Fibre',
      wireless: 'Wireless',
    },
    contract_term: {
      '0': 'Month-to-Month',
      '12': '12 Months',
      '24': '24 Months',
      '36': '36 Months',
    },
    data_package: {
      '0-10': '0-10 GB',
      '10-50': '10-50 GB',
      '50-100': '50-100 GB',
      '100-500': '100-500 GB',
      '500+': '500+ GB',
      uncapped: 'Uncapped',
    },
    sort_by: {
      created_desc: 'Newest',
      updated_desc: 'Recently Updated',
      name_asc: 'Name A-Z',
      price_asc: 'Price Low-High',
      price_desc: 'Price High-Low',
    },
  };

  const keyLabel = keyMap[key] || key;
  const valueLabel = valueMap[key]?.[String(value)] || String(value);

  return `${keyLabel}: ${valueLabel}`;
}

export function ActiveFiltersChips({
  filters,
  searchQuery,
  onRemoveFilter,
  onClearSearch,
  onClearAll,
}: ActiveFiltersChipsProps) {
  const activeFilters = Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null && value !== '');
  const hasActive = activeFilters.length > 0 || searchQuery;

  if (!hasActive) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
      <span className="text-sm font-medium text-gray-700">Active Filters:</span>

      {searchQuery && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 cursor-pointer hover:bg-gray-300 transition-colors pl-3 pr-2 py-1"
          onClick={onClearSearch}
        >
          <span className="text-sm">Search: "{searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}"</span>
          <X className="h-3 w-3" />
        </Badge>
      )}

      {activeFilters.map(([key, value]) => (
        <Badge
          key={key}
          variant="secondary"
          className="flex items-center gap-1 cursor-pointer hover:bg-gray-300 transition-colors pl-3 pr-2 py-1"
          onClick={() => onRemoveFilter(key as keyof ProductFilters)}
        >
          <span className="text-sm">{formatFilterLabel(key, value)}</span>
          <X className="h-3 w-3" />
        </Badge>
      ))}

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-circleTel-orange hover:bg-circleTel-orange/10 h-7 px-2"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}
