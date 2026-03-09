'use client';

import { StatCard } from '@/components/admin/shared/StatCard';
import { formatCurrency } from '@/lib/quotes/quote-calculator';
import {
  PiCurrencyCircleDollarBold,
  PiCalendarCheckBold,
  PiCheckCircleBold,
  PiChartLineUpBold,
} from 'react-icons/pi';

interface ContractStatCardsProps {
  contract: {
    monthly_recurring: number;
    contract_term_months: number;
    status: string;
    total_contract_value: number;
  };
}

const STATUS_INDICATORS: Record<string, { color: string; bgColor: string }> = {
  draft: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  pending_signature: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
  partially_signed: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
  fully_signed: { color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  active: { color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  expired: { color: 'text-red-600', bgColor: 'bg-red-100' },
  terminated: { color: 'text-red-600', bgColor: 'bg-red-100' },
};

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending_signature: 'Pending Signature',
    partially_signed: 'Partially Signed',
    fully_signed: 'Fully Signed',
    active: 'Active',
    expired: 'Expired',
    terminated: 'Terminated',
  };
  return labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function ContractStatCards({ contract }: ContractStatCardsProps) {
  const statusConfig = STATUS_INDICATORS[contract.status] || {
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Monthly Value"
        value={formatCurrency(contract.monthly_recurring)}
        icon={<PiCurrencyCircleDollarBold className="w-5 h-5" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        subtitle="Recurring revenue"
      />
      <StatCard
        label="Contract Term"
        value={`${contract.contract_term_months} months`}
        icon={<PiCalendarCheckBold className="w-5 h-5" />}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
        subtitle="Agreement duration"
      />
      <StatCard
        label="Contract Status"
        value={getStatusLabel(contract.status)}
        icon={<PiCheckCircleBold className="w-5 h-5" />}
        iconBgColor={statusConfig.bgColor}
        iconColor={statusConfig.color}
        subtitle="Current state"
      />
      <StatCard
        label="Total Value"
        value={formatCurrency(contract.total_contract_value)}
        icon={<PiChartLineUpBold className="w-5 h-5" />}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
        subtitle="Over contract term"
      />
    </div>
  );
}
