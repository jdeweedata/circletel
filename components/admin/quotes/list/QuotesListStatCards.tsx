'use client';

import { KpiStrip } from '@/components/portal/modernist/PortalModernistShell';

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
    <KpiStrip
      variant="cards"
      items={[
        {
          label: 'Total quotes',
          value: stats.totalQuotes.toString(),
          accent: '#13274A',
        },
        {
          label: 'Pending approval',
          value: stats.pendingApproval.toString(),
          accent: stats.pendingApproval > 0 ? '#F5841E' : '#13274A',
          valueColor: stats.pendingApproval > 0 ? '#F5841E' : undefined,
        },
        {
          label: 'Accepted',
          value: stats.accepted.toString(),
          accent: '#2F9E5E',
          valueColor: '#2F9E5E',
        },
        {
          label: 'Monthly revenue',
          value: formatCurrency(stats.monthlyRevenue),
          note: 'From accepted quotes',
          accent: '#13274A',
        },
      ]}
    />
  );
}
