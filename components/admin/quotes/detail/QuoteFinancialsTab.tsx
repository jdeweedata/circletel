'use client';

import { PiChartLineUpBold, PiWalletBold, PiReceiptBold } from 'react-icons/pi';
import { SectionCard } from '@/components/admin/shared';
import type { QuoteDetails } from '@/lib/quotes/types';

interface QuoteFinancialsTabProps {
  quote: QuoteDetails;
  pricing: {
    subtotal_monthly: number;
    vat_amount_monthly: number;
    total_monthly: number;
    subtotal_installation: number;
    vat_amount_installation: number;
    total_installation: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function QuoteFinancialsTab({ quote, pricing }: QuoteFinancialsTabProps) {
  const contractValue = pricing.total_monthly * quote.contract_term + pricing.total_installation;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <SectionCard
        title="Monthly Recurring Costs"
        icon={PiChartLineUpBold}
        compact
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Subtotal (Excl. VAT)</span>
              <span className="text-slate-900">{formatCurrency(pricing.subtotal_monthly)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">VAT (15%)</span>
              <span className="text-slate-900">{formatCurrency(pricing.vat_amount_monthly)}</span>
            </div>
            
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total (Incl. VAT)</span>
              <span className="font-extrabold text-xl text-primary">{formatCurrency(pricing.total_monthly)}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="One-Time Costs & Contract"
        icon={PiWalletBold}
        compact
      >
        <div className="space-y-6">
          {/* Installation Pricing */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Installation</p>
            {pricing.total_installation > 0 ? (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Subtotal (Excl. VAT)</span>
                  <span className="text-slate-900">{formatCurrency(pricing.subtotal_installation)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">VAT (15%)</span>
                  <span className="text-slate-900">{formatCurrency(pricing.vat_amount_installation)}</span>
                </div>
                
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total (Incl. VAT)</span>
                  <span className="font-bold text-lg text-slate-900">{formatCurrency(pricing.total_installation)}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-2 text-sm text-emerald-600 font-semibold bg-emerald-50 rounded-lg">
                Installation Included
              </div>
            )}
          </div>

          {/* Contract Info */}
          <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Contract Value</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-700 font-medium">Term</span>
              <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded shadow-sm">
                {quote.contract_term} months
              </span>
            </div>
            
            <div className="border-t border-indigo-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total Lifetime Value</span>
              <span className="font-extrabold text-lg text-indigo-700">
                {formatCurrency(contractValue)}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
