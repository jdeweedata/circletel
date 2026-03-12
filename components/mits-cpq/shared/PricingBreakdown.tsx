'use client';

import { cn } from '@/lib/utils';
import type { MITSPricingData } from '@/lib/mits-cpq/types';

interface PricingBreakdownProps {
  pricing: MITSPricingData;
  tierName?: string;
  showMargin?: boolean;
}

export function PricingBreakdown({
  pricing,
  tierName,
  showMargin = false,
}: PricingBreakdownProps) {
  const formatCurrency = (value: number) => {
    return `R${value.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      {/* Line Items */}
      <div className="space-y-3">
        {tierName && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{tierName}</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(pricing.base_tier_price)}
            </span>
          </div>
        )}

        {pricing.additional_m365_price > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Additional M365 Licences</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(pricing.additional_m365_price)}
            </span>
          </div>
        )}

        {pricing.add_ons_mrc > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Add-Ons (Monthly)</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(pricing.add_ons_mrc)}
            </span>
          </div>
        )}

        {/* Subtotal */}
        <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
          <span className="text-slate-700">Subtotal</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(pricing.subtotal_mrc)}
          </span>
        </div>

        {/* Discount */}
        {pricing.discount_percent > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>
              Discount ({pricing.discount_percent}%)
            </span>
            <span className="font-semibold">
              -{formatCurrency(pricing.discount_amount)}
            </span>
          </div>
        )}
      </div>

      {/* Total MRC */}
      <div className="border-t border-slate-200 pt-3 flex justify-between text-lg">
        <span className="font-semibold text-slate-900">Total Monthly</span>
        <span className="font-bold text-orange">
          {formatCurrency(pricing.total_mrc)}
        </span>
      </div>

      {/* One-Off Charges */}
      {pricing.add_ons_nrc > 0 && (
        <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
          <span className="text-slate-600">Once-Off Installation</span>
          <span className="font-medium text-slate-900">
            {formatCurrency(pricing.add_ons_nrc)}
          </span>
        </div>
      )}

      {/* Margin Panel */}
      {showMargin && (
        <div
          className={cn(
            'border-t border-slate-200 pt-4 rounded-lg p-4 space-y-2',
            pricing.gross_margin_percent >= 30
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          )}
        >
          <div className="text-xs font-semibold uppercase text-slate-600">
            Margin Analysis
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">Monthly Margin</span>
            <span
              className={cn(
                'font-semibold',
                pricing.gross_margin_percent >= 30
                  ? 'text-green-700'
                  : 'text-amber-700'
              )}
            >
              {pricing.gross_margin_percent.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
