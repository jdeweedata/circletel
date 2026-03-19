'use client';

import { PiCalendarBold, PiChartLineUpBold, PiWalletBold } from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared';
import type { QuoteDetails } from '@/lib/quotes/types';

interface QuoteStatCardsProps {
  quote: QuoteDetails;
  pricing: {
    total_monthly: number;
    total_installation: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuoteStatCards({ quote, pricing }: QuoteStatCardsProps) {
  const contractValue = pricing.total_monthly * quote.contract_term + pricing.total_installation;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        label="Monthly Total"
        value={formatCurrency(pricing.total_monthly)}
        subtitle="VAT Inclusive"
        subtitleIcon={<PiWalletBold className="w-3 h-3 text-slate-400" />}
      />
      <StatCard
        label="Contract Value"
        value={formatCurrency(contractValue)}
        subtitle={`${quote.contract_term} Months`}
        subtitleIcon={<PiChartLineUpBold className="w-3 h-3 text-slate-400" />}
      />
      <StatCard
        label="Valid Until"
        value={new Date(quote.valid_until).toLocaleDateString('en-ZA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
        subtitle="Expiration Date"
        subtitleIcon={<PiCalendarBold className="w-3 h-3 text-slate-400" />}
      />
    </div>
  );
}
