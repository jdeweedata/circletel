'use client';

import Link from 'next/link';
import { SourceDot, type SourceDotTone } from '@/components/admin/finance/cycle-match/SourceDot';
import { formatZar } from '@/components/admin/finance/cycle-match/money';
import type { CycleFunnel } from '@/lib/billing/cycle-match/types';

const STAGES: Array<{
  key: keyof CycleFunnel['stages'];
  label: string;
  tone: SourceDotTone;
  href: (month: string) => string;
}> = [
  {
    key: 'activeOnNetwork',
    label: 'Active on the network',
    tone: 'platform',
    href: (month) => `/admin/finance/reconciliation?month=${month}`,
  },
  {
    key: 'contracted',
    label: 'Contracted in the platform',
    tone: 'platform',
    href: (month) => `/admin/finance/reconciliation?month=${month}`,
  },
  {
    key: 'invoiced',
    label: 'Invoiced in Zoho Books',
    tone: 'zoho',
    href: () => '/admin/billing/invoices',
  },
  {
    key: 'collected',
    label: 'Collected via Netcash',
    tone: 'netcash',
    href: () => '/admin/payments/transactions',
  },
];

export function NetworkToCashFunnel({
  funnel,
  month,
}: {
  funnel: CycleFunnel;
  month: string;
}) {
  const max = Math.max(
    ...STAGES.map((s) => funnel.stages[s.key].count),
    1
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Network to cash</h2>
      <div className="space-y-4">
        {STAGES.map((stage) => {
          const data = funnel.stages[stage.key];
          const width = `${Math.max(8, (data.count / max) * 100)}%`;
          return (
            <Link
              key={stage.key}
              href={stage.href(month)}
              className="block rounded-lg p-1 -mx-1 hover:bg-slate-50"
            >
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                  <SourceDot tone={stage.tone} />
                  {stage.label}
                </span>
                <span className="text-slate-500">
                  {data.count} services · {formatZar(data.amount)}
                  {data.dropCount > 0 && (
                    <span className="ml-2 text-red-600">
                      −{data.dropCount} ({formatZar(data.dropAmount)})
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={
                    stage.tone === 'zoho'
                      ? 'h-full rounded-full bg-circleTel-orange'
                      : stage.tone === 'netcash'
                        ? 'h-full rounded-full bg-emerald-500'
                        : 'h-full rounded-full bg-blue-600'
                  }
                  style={{ width }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
