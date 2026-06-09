'use client';

import { useState } from 'react';
import { PiSlidersBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type {
  UnifiedProduct,
  UnifiedProductSource,
  UnifiedProductStatus,
} from '@/lib/types/unified-product';
import { UnifiedProductSearch, type UnifiedSort } from './UnifiedProductSearch';
import { UnifiedProductGrid } from './UnifiedProductGrid';
import { UnifiedProductDetailSidebar } from './UnifiedProductDetailSidebar';
import { RulesStudio } from './RulesStudio';

type SourceTab = UnifiedProductSource | 'all';

const SOURCE_TABS: Array<{ id: SourceTab; label: string }> = [
  { id: 'all', label: 'All sources' },
  { id: 'CircleTel', label: 'CircleTel' },
  { id: 'MTN / Arlan', label: 'MTN / Arlan' },
  { id: 'Hardware', label: 'Hardware' },
];

/**
 * Unified Product Console — Phase 4 shell.
 *
 * Holds all console state and wires the search/filter/grid/detail/RulesStudio
 * pieces together. Data fetching is intentionally NOT wired yet (Phase 5); the
 * grid renders an empty state so the shell is verifiable in isolation.
 */
export function UnifiedProductConsole() {
  const [sourceTab, setSourceTab] = useState<SourceTab>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UnifiedProductStatus | 'all'>('all');
  const [sort, setSort] = useState<UnifiedSort>('updated_desc');
  const [selected, setSelected] = useState<UnifiedProduct | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Phase 5 replaces this with useUnifiedProducts(...).
  const products: UnifiedProduct[] = [];
  const isLoading = false;

  return (
    <div className="space-y-4 p-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ui-text-primary">Unified Product Console</h1>
          <p className="text-sm text-ui-text-muted">
            CircleTel services, MTN/Arlan deals &amp; hardware in one place.
          </p>
        </div>
        <button
          onClick={() => setRulesOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-circleTel-navy px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-circleTel-midnight-navy"
        >
          <PiSlidersBold className="h-4 w-4" />
          Rules Studio
        </button>
      </div>

      {/* source tabs */}
      <div className="border-b border-ui-border">
        <div role="tablist" className="flex gap-6 overflow-x-auto">
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={sourceTab === tab.id}
              onClick={() => setSourceTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors',
                sourceTab === tab.id
                  ? 'border-circleTel-orange font-bold text-circleTel-orange'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* search + filters */}
      <UnifiedProductSearch
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
      />

      {/* grid */}
      <UnifiedProductGrid
        products={products}
        isLoading={isLoading}
        selectedUid={selected?.uid ?? null}
        onSelect={setSelected}
        emptyHint="Data loading is wired in Phase 5. The console shell is ready."
      />

      {/* detail slide-over */}
      <UnifiedProductDetailSidebar product={selected} onClose={() => setSelected(null)} />

      {/* rules studio modal */}
      <RulesStudio open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
