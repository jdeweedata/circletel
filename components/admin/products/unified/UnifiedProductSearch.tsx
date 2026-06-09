'use client';

import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type { UnifiedProductStatus } from '@/lib/types/unified-product';

const STATUS_OPTIONS: Array<{ value: UnifiedProductStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'created_desc', label: 'Newest' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'price_desc', label: 'Price high–low' },
  { value: 'price_asc', label: 'Price low–high' },
] as const;

export type UnifiedSort = (typeof SORT_OPTIONS)[number]['value'];

interface UnifiedProductSearchProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: UnifiedProductStatus | 'all';
  onStatusChange: (v: UnifiedProductStatus | 'all') => void;
  sort: UnifiedSort;
  onSortChange: (v: UnifiedSort) => void;
  className?: string;
}

const selectCls =
  'h-9 rounded-lg border border-ui-border bg-white px-3 text-sm text-ui-text-primary focus:outline-none focus:ring-2 focus:ring-circleTel-orange/30';

export function UnifiedProductSearch({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  className,
}: UnifiedProductSearchProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="relative min-w-[220px] flex-1">
        <PiMagnifyingGlassBold className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products, SKU, description…"
          className="h-9 w-full rounded-lg border border-ui-border bg-white pl-9 pr-3 text-sm text-ui-text-primary placeholder:text-ui-text-muted focus:outline-none focus:ring-2 focus:ring-circleTel-orange/30"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as UnifiedProductStatus | 'all')}
        className={selectCls}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as UnifiedSort)}
        className={selectCls}
        aria-label="Sort"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
