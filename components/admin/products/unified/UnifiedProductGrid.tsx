'use client';

import { PiPackageBold, PiSpinnerGapBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type { UnifiedProduct } from '@/lib/types/unified-product';
import type { RuleSummary } from '@/components/admin/products/shared';
import { UnifiedProductCard } from '@/components/admin/products/shared';

interface UnifiedProductGridProps {
  products: UnifiedProduct[];
  isLoading?: boolean;
  /** Optional rule summaries keyed by product uid (wired in Phase 6). */
  ruleSummaries?: Record<string, RuleSummary>;
  selectedUid?: string | null;
  onSelect?: (product: UnifiedProduct) => void;
  emptyHint?: string;
  className?: string;
}

export function UnifiedProductGrid({
  products,
  isLoading,
  ruleSummaries,
  selectedUid,
  onSelect,
  emptyHint = 'No products to show.',
  className,
}: UnifiedProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ui-text-muted">
        <PiSpinnerGapBold className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading products…</span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ui-border py-16 text-center">
        <PiPackageBold className="h-8 w-8 text-slate-300" />
        <p className="text-sm text-ui-text-muted">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {products.map((product) => (
        <UnifiedProductCard
          key={product.uid}
          product={product}
          ruleSummary={ruleSummaries?.[product.uid]}
          onClick={onSelect ? () => onSelect(product) : undefined}
          className={cn(selectedUid === product.uid && 'ring-2 ring-circleTel-orange')}
        />
      ))}
    </div>
  );
}
