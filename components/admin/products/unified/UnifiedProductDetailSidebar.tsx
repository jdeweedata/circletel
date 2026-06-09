'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/types/products';
import type { UnifiedProduct } from '@/lib/types/unified-product';
import {
  MarginBar,
  ProductSourceChip,
  PublishReadinessChecklist,
  type ChecklistItem,
} from '@/components/admin/products/shared';

type DetailTab = 'overview' | 'pricing' | 'rules';

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'rules', label: 'Rules' },
];

/**
 * Right slide-over showing a selected product's detail. Rule evaluation and
 * publish gating are wired in Phases 6–7; for now the checklist is derived from
 * the product's own fields as a placeholder.
 */
export function UnifiedProductDetailSidebar({
  product,
  onClose,
}: {
  product: UnifiedProduct | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const open = product !== null;

  return (
    <>
      {/* overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Product detail"
      >
        {product && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-ui-border p-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <ProductSourceChip source={product.source} />
                  <span className="text-xs capitalize text-ui-text-muted">{product.status}</span>
                </div>
                <h2 className="truncate text-base font-semibold text-ui-text-primary">
                  {product.name}
                </h2>
                <p className="truncate text-xs text-ui-text-muted">
                  {product.sku ?? '—'} · {product.type}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-ui-text-muted hover:bg-slate-100"
                aria-label="Close"
              >
                <PiXBold className="h-5 w-5" />
              </button>
            </header>

            <nav className="flex gap-6 border-b border-ui-border px-4">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'border-b-2 py-3 text-sm font-medium transition-colors',
                    tab === t.id
                      ? 'border-circleTel-orange text-circleTel-orange'
                      : 'border-transparent text-ui-text-muted hover:text-ui-text-secondary'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'overview' && <OverviewTab product={product} />}
              {tab === 'pricing' && <PricingTab product={product} />}
              {tab === 'rules' && (
                <p className="text-sm text-ui-text-muted">
                  Rule evaluation appears here once wired (Phase 6).
                </p>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function OverviewTab({ product }: { product: UnifiedProduct }) {
  const checklist: ChecklistItem[] = [
    { label: 'Has a name', ok: Boolean(product.name?.trim()) },
    { label: 'Has a description', ok: (product.description?.trim().length ?? 0) >= 20 },
    { label: 'Has a price', ok: product.price > 0 },
    { label: 'Cost of sale set', ok: product.cost > 0 },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-ui-text-secondary">
        {product.description?.trim() || 'No description.'}
      </p>
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {t}
            </span>
          ))}
        </div>
      )}
      <PublishReadinessChecklist items={checklist} />
    </div>
  );
}

function PricingTab({ product }: { product: UnifiedProduct }) {
  return (
    <dl className="space-y-3 text-sm">
      <Row label="Retail price" value={formatPrice(product.price)} />
      <Row label="Cost of sale" value={formatPrice(product.cost)} />
      <div>
        <dt className="mb-1 text-xs uppercase tracking-wide text-ui-text-muted">Margin</dt>
        <MarginBar margin={product.margin} />
      </div>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ui-text-muted">{label}</dt>
      <dd className="font-medium text-ui-text-primary">{value}</dd>
    </div>
  );
}
