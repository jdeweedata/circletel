'use client';

import { useState, useEffect } from 'react';
import {
  PiMagnifyingGlassBold,
  PiSlidersHorizontalBold,
  PiCaretDownBold,
  PiXBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductFilters } from '@/lib/types/products';
import { FilterPresets } from '@/components/admin/products/FilterPresets';

interface ProductsFiltersProps {
  filters: ProductFilters;
  searchQuery: string;
  onFilterChange: (key: keyof ProductFilters | 'search', value: string) => void;
  onSearchChange: (query: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  onApplyPreset?: (presetFilters: ProductFilters) => void;
}

export function ProductsFilters({
  filters,
  searchQuery,
  onFilterChange,
  onSearchChange,
  onClearAll,
  hasActiveFilters,
  onApplyPreset,
}: ProductsFiltersProps) {
  const [advancedFiltersExpanded, setAdvancedFiltersExpanded] = useState(false);

  // Load advanced filters expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-products-advanced-filters-expanded');
    if (saved === 'true') {
      setAdvancedFiltersExpanded(true);
    }
  }, []);

  const toggleAdvancedFilters = () => {
    const newState = !advancedFiltersExpanded;
    setAdvancedFiltersExpanded(newState);
    localStorage.setItem('admin-products-advanced-filters-expanded', String(newState));
  };

  const secondaryFilterCount = [
    filters.contract_term,
    filters.technology,
    filters.data_package,
  ].filter(Boolean).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
      {/* Search Line & Top Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name, SKU, category, or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10 border-slate-200 focus:ring-primary focus:border-primary shadow-sm rounded-lg w-full"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-slate-100 text-slate-500"
              onClick={() => onSearchChange('')}
            >
              <PiXBold className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-slate-600 border-slate-200 hover:bg-slate-50 gap-2 shrink-0 h-10"
          >
            <PiXBold className="h-4 w-4" />
            Clear All Filters
          </Button>
        )}
      </div>

        {/* Primary Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => onFilterChange('category', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="connectivity">Connectivity</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="bundles">Bundles</SelectItem>
              <SelectItem value="it_services">IT Services</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFilterChange('status', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.device_type || 'all'}
            onValueChange={(value) => onFilterChange('device_type', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Device Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="sim_only">SIM-Only</SelectItem>
              <SelectItem value="cpe">CPE/Router</SelectItem>
              <SelectItem value="handset">Handset</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleAdvancedFilters}
            className="ml-auto"
          >
            <PiSlidersHorizontalBold className="h-4 w-4 mr-2" />
            {advancedFiltersExpanded ? 'Less' : 'More'} Filters
            {secondaryFilterCount > 0 ? ` (${secondaryFilterCount})` : ''}
            <PiCaretDownBold
              className={`h-4 w-4 ml-2 transition-transform duration-200 ${
                advancedFiltersExpanded ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {advancedFiltersExpanded && (
          <div className="flex gap-3 flex-wrap items-center animate-in slide-in-from-top-2 border-t border-gray-200 pt-3">
            <Select
              value={filters.contract_term?.toString() || 'all'}
              onValueChange={(value) => onFilterChange('contract_term', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Contract Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="0">Month-to-Month</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="36">36 Months</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.technology || 'all'}
              onValueChange={(value) => onFilterChange('technology', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Technology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tech</SelectItem>
                <SelectItem value="5g">5G</SelectItem>
                <SelectItem value="lte">LTE</SelectItem>
                <SelectItem value="fibre">Fibre</SelectItem>
                <SelectItem value="wireless">Wireless</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.data_package || 'all'}
              onValueChange={(value) => onFilterChange('data_package', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Data Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="0-10">0-10 GB</SelectItem>
                <SelectItem value="10-50">10-50 GB</SelectItem>
                <SelectItem value="50-100">50-100 GB</SelectItem>
                <SelectItem value="100-500">100-500 GB</SelectItem>
                <SelectItem value="500+">500+ GB</SelectItem>
                <SelectItem value="uncapped">Uncapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sort By + Presets */}
        <div className="flex gap-3 flex-wrap items-center border-t border-gray-100 pt-3">
          {onApplyPreset && (
            <FilterPresets
              currentFilters={filters}
              onApplyPreset={onApplyPreset}
            />
          )}

          <Select
            value={filters.sort_by || 'created_desc'}
            onValueChange={(value) => onFilterChange('sort_by', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Newest</SelectItem>
              <SelectItem value="updated_desc">Recently Updated</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
              <SelectItem value="price_asc">Price Low-High</SelectItem>
              <SelectItem value="price_desc">Price High-Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
    </div>
  );
}
