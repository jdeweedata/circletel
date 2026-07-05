'use client';

import { PiPackageBold, PiSpinnerGapBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/types/products';
import type { UnifiedProduct, UnifiedProductStatus } from '@/lib/types/unified-product';
import {
  MarginBar,
  ProductSourceChip,
  RuleHealthBadge,
  type RuleSummary,
} from '@/components/admin/products/shared';

interface UnifiedProductTableProps {
  products: UnifiedProduct[];
  isLoading?: boolean;
  /** Rule summaries keyed by product uid. */
  ruleSummaries?: Record<string, RuleSummary>;
  selectedUid?: string | null;
  onSelect?: (product: UnifiedProduct) => void;
  emptyHint?: string;
  className?: string;
}

const STATUS_STYLE: Record<UnifiedProductStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-50 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
  archived: 'bg-red-50 text-red-600',
};

const TH =
  'sticky top-0 z-10 bg-ui-bg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ui-text-muted';

/**
 * Dense catalogue table for the unified console. Built for an expert operator
 * triaging 25k+ SKUs — ~25–30 rows per screen, sticky header, scannable
 * price/margin/rule columns. Reuses the shared chip/bar/badge primitives.
 */
export function UnifiedProductTable({
  products,
  isLoading,
  ruleSummaries,
  selectedUid,
  onSelect,
  emptyHint = 'No products to show.',
  className,
}: UnifiedProductTableProps) {
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
        'overflow-x-auto rounded-xl border border-ui-border bg-white',
        className
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ui-border">
            <th className={cn(TH, 'w-[110px]')}>Source</th>
            <th className={TH}>Product</th>
            <th className={cn(TH, 'w-[96px]')}>Status</th>
            <th className={cn(TH, 'w-[110px] text-right')}>Price</th>
            <th className={cn(TH, 'w-[100px] text-right')}>Cost</th>
            <th className={cn(TH, 'w-[150px]')}>Margin</th>
            <th className={cn(TH, 'w-[120px]')}>Rules</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isSelected = selectedUid === product.uid;
            const summary = ruleSummaries?.[product.uid];
            return (
              <tr
                key={product.uid}
                onClick={onSelect ? () => onSelect(product) : undefined}
                className={cn(
                  'border-b border-ui-border/60 transition-colors',
                  onSelect && 'cursor-pointer hover:bg-ui-bg',
                  isSelected && 'bg-circleTel-orange-light hover:bg-circleTel-orange-light'
                )}
              >
                <td className="relative px-3 py-2 align-middle">
                  {isSelected && (
                    <span className="absolute inset-y-0 left-0 w-1 bg-circleTel-orange" />
                  )}
                  <ProductSourceChip source={product.source} />
                </td>

                <td className="px-3 py-2 align-middle">
                  <div className="font-medium text-ui-text-primary">{product.name}</div>
                  <div className="mt-0.5 truncate text-xs text-ui-text-muted">
                    {product.sku ?? '—'} · {product.type}
                  </div>
                </td>

                <td className="px-3 py-2 align-middle">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                      STATUS_STYLE[product.status]
                    )}
                  >
                    {product.status}
                  </span>
                </td>

                <td className="px-3 py-2 text-right align-middle font-semibold tabular-nums text-circleTel-navy">
                  {formatPrice(product.price)}
                </td>

                <td className="px-3 py-2 text-right align-middle text-xs tabular-nums text-ui-text-muted">
                  {formatPrice(product.cost)}
                </td>

                <td className="px-3 py-2 align-middle">
                  <MarginBar margin={product.margin} />
                </td>

                <td className="px-3 py-2 align-middle">
                  {summary ? (
                    <RuleHealthBadge summary={summary} />
                  ) : (
                    <span className="text-xs text-ui-text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
