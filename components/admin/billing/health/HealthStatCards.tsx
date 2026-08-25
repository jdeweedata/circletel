'use client';

import {
  PiClockBold,
  PiFileTextBold,
  PiMoneyBold,
  PiUserMinusBold,
} from 'react-icons/pi';
import type { BillingHealthResponse } from '@/lib/billing/health/types';
import { HealthCard } from './HealthCard';
import { formatRand } from './format';

interface HealthStatCardsProps {
  data: Pick<BillingHealthResponse, 'mrr' | 'pastDue' | 'suspension' | 'unpaid'>;
}

export function HealthStatCards({ data }: HealthStatCardsProps) {
  const { mrr, pastDue, suspension, unpaid } = data;
  const momText =
    mrr.momChangePct === null
      ? 'No prior-month baseline'
      : `${mrr.momChangePct >= 0 ? '+' : ''}${mrr.momChangePct}% MoM`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <HealthCard
        label="MRR"
        value={formatRand(mrr.current)}
        primaryLine={momText}
        primaryClassName={mrr.momChangePct !== null && mrr.momChangePct < 0 ? 'text-red-600' : 'text-teal-600'}
        secondaryLine={mrr.deltaLabel}
        icon={<PiMoneyBold className="h-5 w-5" />}
        iconClassName="bg-teal-50 text-teal-600"
      />
      <HealthCard
        label="Past-due amount"
        value={formatRand(pastDue.totalAmount)}
        primaryLine={`${pastDue.customerCount} customer${pastDue.customerCount === 1 ? '' : 's'} past due`}
        secondaryLine="Includes current bucket"
        icon={<PiClockBold className="h-5 w-5" />}
        iconClassName="bg-orange-50 text-orange-500"
      />
      <HealthCard
        label="Suspension Candidates"
        value={String(suspension.candidates)}
        primaryLine={`${suspension.urgent} urgent ≥31 days`}
        primaryClassName="text-red-600"
        secondaryLine={`Policy: ${suspension.policyDays}+ days past due`}
        icon={<PiUserMinusBold className="h-5 w-5" />}
        iconClassName="bg-red-50 text-red-600"
      />
      <HealthCard
        label="Unpaid Invoices"
        value={String(unpaid.total)}
        primaryLine={`${unpaid.overdue} overdue`}
        primaryClassName="text-orange-500"
        secondaryLine="Sent, partial & overdue"
        icon={<PiFileTextBold className="h-5 w-5" />}
        iconClassName="bg-teal-50 text-teal-600"
      />
    </div>
  );
}
