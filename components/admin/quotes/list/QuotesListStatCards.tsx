'use client';

import { 
  PiFileTextBold, 
  PiClockBold, 
  PiCheckCircleBold, 
  PiCurrencyDollarBold 
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Quotes"
        value={stats.totalQuotes.toString()}
        icon={<PiFileTextBold className="w-5 h-5" />}
        iconBgColor="bg-blue-50"
        iconColor="text-blue-500"
      />
      <StatCard
        label="Pending Approval"
        value={stats.pendingApproval.toString()}
        icon={<PiClockBold className="w-5 h-5" />}
        iconBgColor="bg-amber-50"
        iconColor="text-amber-500"
        className="text-amber-600"
      />
      <StatCard
        label="Accepted"
        value={stats.accepted.toString()}
        icon={<PiCheckCircleBold className="w-5 h-5" />}
        iconBgColor="bg-emerald-50"
        iconColor="text-emerald-500"
        className="text-emerald-600"
      />
      <StatCard
        label="Monthly Revenue"
        value={formatCurrency(stats.monthlyRevenue)}
        subtitle="From accepted quotes"
        icon={<PiCurrencyDollarBold className="w-5 h-5" />}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        className="text-slate-900"
      />
    </div>
  );
}
