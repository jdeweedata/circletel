'use client';

import { useState } from 'react';
import { PiCaretDownBold, PiCaretRightBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types/products';
import {
  CategoryGroupName,
  CATEGORY_GROUP_COLORS,
} from '@/lib/admin/product-categories';

interface CategoryGroupSectionProps {
  groupName: CategoryGroupName;
  products: Product[];
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function CategoryGroupSection({
  groupName,
  products,
  children,
  defaultExpanded = true,
}: CategoryGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = CATEGORY_GROUP_COLORS[groupName];

  // Calculate stats for the group
  const activeCount = products.filter((p) => p.status === 'active').length;
  const totalRevenue = products.reduce((sum, p) => {
    return sum + parseFloat(p.base_price_zar || '0');
  }, 0);

  // Calculate average margin
  const margins = products
    .filter((p) => parseFloat(p.cost_price_zar || '0') > 0)
    .map((p) => {
      const price = parseFloat(p.base_price_zar || '0');
      const cost = parseFloat(p.cost_price_zar || '0');
      return price > 0 ? ((price - cost) / price) * 100 : 0;
    });
  const avgMargin = margins.length > 0
    ? margins.reduce((a, b) => a + b, 0) / margins.length
    : 0;

  const marginColor = avgMargin >= 35 ? 'text-emerald-600' : avgMargin >= 25 ? 'text-amber-600' : 'text-red-600';

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-xl border overflow-hidden', colors.border)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 transition-colors',
          colors.bg,
          'hover:opacity-90'
        )}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <PiCaretDownBold className={cn('h-4 w-4', colors.text)} />
          ) : (
            <PiCaretRightBold className={cn('h-4 w-4', colors.text)} />
          )}
          <h3 className={cn('font-bold text-sm', colors.text)}>{groupName}</h3>
          <span className="text-xs text-slate-500">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="text-slate-600">
            <span className="font-medium text-emerald-600">{activeCount}</span> active
          </div>
          <div className="text-slate-600">
            Avg margin: <span className={cn('font-medium', marginColor)}>{avgMargin.toFixed(1)}%</span>
          </div>
          <div className="text-slate-600">
            MRR: <span className="font-medium">R{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
