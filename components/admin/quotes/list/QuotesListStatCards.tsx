'use client';

import { 
  PiFileTextBold, 
  PiClockBold, 
  PiCheckCircleBold, 
  PiCurrencyDollarBold 
} from 'react-icons/pi';
import { MetricPanel } from '@/components/backend';

interface QuotesListStatCardsProps {
  stats: {
    totalQuotes: number;
    pendingApproval: number;
    accepted: number;
    monthlyRevenue: number;
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

export function QuotesListStatCards({ stats }: QuotesListStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MetricPanel
        label="Total Quotes"
        value={stats.totalQuotes.toString()}
        icon={<PiFileTextBold className="h-4 w-4" />}
      />
      <MetricPanel
        label="Pending Approval"
        value={stats.pendingApproval.toString()}
        description="Requires review"
        icon={<PiClockBold className="h-4 w-4" />}
      />
      <MetricPanel
        label="Accepted"
        value={stats.accepted.toString()}
        description="Converted quotes"
        icon={<PiCheckCircleBold className="h-4 w-4" />}
      />
      <MetricPanel
        label="Monthly Revenue"
        value={formatCurrency(stats.monthlyRevenue)}
        description="From accepted quotes"
        icon={<PiCurrencyDollarBold className="h-4 w-4" />}
      />
    </div>
  );
}
