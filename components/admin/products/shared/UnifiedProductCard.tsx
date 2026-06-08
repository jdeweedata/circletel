'use client';

import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/types/products';
import type { UnifiedProduct, UnifiedProductStatus } from '@/lib/types/unified-product';
import { MarginBar } from './MarginBar';
import { ProductSourceChip } from './ProductSourceChip';
import { RuleHealthBadge, type RuleSummary } from './RuleHealthBadge';

const STATUS_STYLE: Record<UnifiedProductStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-50 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
  archived: 'bg-red-50 text-red-600',
};

/**
 * Grid card for the unified console. Composes the source chip, status, price/cost,
 * margin bar and (optionally) a rule-health roll-up. Presentational only.
 */
export function UnifiedProductCard({
  product,
  ruleSummary,
  onClick,
  className,
}: {
  product: UnifiedProduct;
  ruleSummary?: RuleSummary;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-ui-border bg-white p-4 transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <ProductSourceChip source={product.source} />
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
            STATUS_STYLE[product.status]
          )}
        >
          {product.status}
        </span>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-ui-text-primary">{product.name}</h3>
      <p className="mt-0.5 truncate text-xs text-ui-text-muted">
        {product.sku ?? '—'} · {product.type}
      </p>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-lg font-bold text-circleTel-navy">{formatPrice(product.price)}</span>
        <span className="text-xs text-ui-text-muted">cost {formatPrice(product.cost)}</span>
      </div>

      <div className="mt-2">
        <MarginBar margin={product.margin} />
      </div>

      {ruleSummary && (
        <div className="mt-3">
          <RuleHealthBadge summary={ruleSummary} />
        </div>
      )}
    </div>
  );
}
