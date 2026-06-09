'use client';

import { useEffect, useMemo, useState } from 'react';
import { PiSlidersBold, PiCaretLeftBold, PiCaretRightBold, PiWarningBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type {
  UnifiedProduct,
  UnifiedProductSource,
  UnifiedProductStatus,
} from '@/lib/types/unified-product';
import { rulesEngine, type RuleConfig } from '@/lib/products/rules';
import type { RuleSummary } from '@/components/admin/products/shared';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';
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

const PER_PAGE = 20;

/**
 * Unified Product Console — Phase 5 (data wired).
 *
 * Fetches from /api/admin/products/unified via useUnifiedProducts with debounced
 * search, source/status/sort filters, and pagination.
 */
export function UnifiedProductConsole() {
  const [sourceTab, setSourceTab] = useState<SourceTab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<UnifiedProductStatus | 'all'>('all');
  const [sort, setSort] = useState<UnifiedSort>('updated_desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UnifiedProduct | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  // Rule threshold overrides (edited in Rules Studio); empty = engine defaults.
  const [ruleConfig, setRuleConfig] = useState<Partial<RuleConfig>>({});

  // Debounce search → also reset to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { products, total, totalPages, countsBySource, loading, error } = useUnifiedProducts({
    source: sourceTab === 'all' ? undefined : sourceTab,
    status: status === 'all' ? undefined : status,
    search: debouncedSearch,
    sortBy: sort,
    page,
    perPage: PER_PAGE,
  });

  // Evaluate rules client-side for the loaded page (engine is pure + cheap).
  // Re-runs when products or threshold overrides change → live badge updates.
  const ruleSummaries = useMemo<Record<string, RuleSummary>>(() => {
    const out: Record<string, RuleSummary> = {};
    for (const evaluation of rulesEngine.evaluateMany(products, ruleConfig)) {
      out[evaluation.uid] = evaluation.summary;
    }
    return out;
  }, [products, ruleConfig]);

  const resetPageThen = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const countFor = (tab: SourceTab): number | null =>
    tab === 'all' ? total : countsBySource[tab] ?? null;

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

      {/* source tabs with counts */}
      <div className="border-b border-ui-border">
        <div role="tablist" className="flex gap-6 overflow-x-auto">
          {SOURCE_TABS.map((tab) => {
            const count = countFor(tab.id);
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={sourceTab === tab.id}
                onClick={() => {
                  setSourceTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors',
                  sourceTab === tab.id
                    ? 'border-circleTel-orange font-bold text-circleTel-orange'
                    : 'border-transparent text-ui-text-muted hover:text-ui-text-secondary'
                )}
              >
                {tab.label}
                {count !== null && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                    {count.toLocaleString('en-ZA')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* search + filters */}
      <UnifiedProductSearch
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={resetPageThen(setStatus)}
        sort={sort}
        onSortChange={resetPageThen(setSort)}
      />

      {/* error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <PiWarningBold className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* grid */}
      <UnifiedProductGrid
        products={products}
        isLoading={loading}
        ruleSummaries={ruleSummaries}
        selectedUid={selected?.uid ?? null}
        onSelect={setSelected}
        emptyHint="No products match these filters."
      />

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-ui-border pt-3 text-sm">
          <span className="text-ui-text-muted">
            Page {page} of {totalPages} · {total.toLocaleString('en-ZA')} products
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-ui-border px-2.5 py-1.5 text-ui-text-secondary disabled:opacity-40"
            >
              <PiCaretLeftBold className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-ui-border px-2.5 py-1.5 text-ui-text-secondary disabled:opacity-40"
            >
              Next <PiCaretRightBold className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* detail slide-over */}
      <UnifiedProductDetailSidebar
        product={selected}
        ruleConfig={ruleConfig}
        onClose={() => setSelected(null)}
      />

      {/* rules studio modal */}
      <RulesStudio
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        config={ruleConfig}
        onConfigChange={setRuleConfig}
        simulationProduct={selected ?? products[0] ?? null}
      />
    </div>
  );
}
