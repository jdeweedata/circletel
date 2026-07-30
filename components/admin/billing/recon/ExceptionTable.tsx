'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowRightBold,
  PiLinkBold,
  PiWarningBold,
} from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/backend';
import type { StatusVariant } from '@/components/backend';
import { filterExceptions } from '@/lib/billing/recon-hub/build-exceptions';
import type {
  ExceptionFilter,
  ReconExceptionRow,
  ZohoStatus,
} from '@/lib/billing/recon-hub/types';

export interface ExceptionTableProps {
  exceptions: ReconExceptionRow[];
}

const FILTER_CHIPS: Array<{ id: ExceptionFilter; label: string }> = [
  { id: 'unmatched_cash', label: 'Unmatched cash' },
  { id: 'zoho_lag', label: 'Zoho lag' },
  { id: 'open_ar', label: 'Open AR' },
  { id: 'all', label: 'All' },
];

const UNMATCHED_HREF = '/admin/finance/reconciliation';

const ZOHO_VARIANT: Record<ZohoStatus, StatusVariant> = {
  synced: 'success',
  pending: 'warning',
  failed: 'error',
  skipped: 'neutral',
  'n/a': 'neutral',
};

const ZOHO_LABEL: Record<ZohoStatus, string> = {
  synced: 'Synced',
  pending: 'Pending',
  failed: 'Failed',
  skipped: 'Skipped',
  'n/a': 'N/A',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  });
}

function invoiceStatusVariant(status: string | null): StatusVariant {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'completed') return 'success';
  if (s === 'overdue') return 'error';
  if (s === 'partial' || s === 'sent') return 'warning';
  if (s === 'draft' || s === 'voided' || s === 'cancelled') return 'neutral';
  return 'info';
}

function isUnmatchedRow(row: ReconExceptionRow): boolean {
  return (
    row.severity === 'red' ||
    row.reasonCode === 'no_ct_invoice' ||
    row.reasonCode === 'paynow_unmatched'
  );
}

/**
 * Exception queue with client-side filter chips (default: unmatched cash).
 */
export function ExceptionTable({ exceptions }: ExceptionTableProps) {
  const [filter, setFilter] = useState<ExceptionFilter>('unmatched_cash');

  const rows = useMemo(
    () => filterExceptions(exceptions, filter),
    [exceptions, filter]
  );

  const chipCounts = useMemo(() => {
    return {
      unmatched_cash: filterExceptions(exceptions, 'unmatched_cash').length,
      zoho_lag: filterExceptions(exceptions, 'zoho_lag').length,
      open_ar: filterExceptions(exceptions, 'open_ar').length,
      all: exceptions.length,
    } satisfies Record<ExceptionFilter, number>;
  }, [exceptions]);

  return (
    <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">Exceptions</CardTitle>
          <p className="text-xs text-slate-500">
            Unmatched cash, Zoho sync lag, and open AR needing action
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500">{rows.length} shown</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Exception filters"
        >
          {FILTER_CHIPS.map((chip) => {
            const active = filter === chip.id;
            const count = chipCounts[chip.id];
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(chip.id)}
                className={
                  active
                    ? 'inline-flex items-center gap-1.5 rounded-full border border-circleTel-orange bg-circleTel-orange/10 px-3 py-1 text-xs font-semibold text-circleTel-orange'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }
              >
                {chip.label}
                <span
                  className={
                    active
                      ? 'rounded-full bg-circleTel-orange px-1.5 py-0.5 text-[10px] font-bold text-white'
                      : 'rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600'
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
            <PiWarningBold className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            No exceptions for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    NetCash ref
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    CT invoice
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice status
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Zoho
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reason
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const unmatched = isUnmatchedRow(row);
                  const actionHref = row.href ?? (unmatched ? UNMATCHED_HREF : null);
                  const invoiceHref =
                    row.invoiceId != null
                      ? row.href ?? `/admin/billing/invoices/${row.invoiceId}`
                      : null;

                  return (
                    <tr
                      key={`${row.kind}-${row.id}`}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                        {formatDate(row.date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700">
                        {row.netcashRef || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {row.invoiceNumber && invoiceHref ? (
                          <Link
                            href={invoiceHref}
                            className="font-medium text-circleTel-orange hover:underline"
                          >
                            {row.invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {row.invoiceStatus ? (
                          <StatusBadge
                            status={
                              row.invoiceStatus.charAt(0).toUpperCase() +
                              row.invoiceStatus.slice(1)
                            }
                            variant={invoiceStatusVariant(row.invoiceStatus)}
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusBadge
                          status={ZOHO_LABEL[row.zohoStatus]}
                          variant={ZOHO_VARIANT[row.zohoStatus]}
                        />
                      </td>
                      <td className="max-w-[220px] px-3 py-2.5 text-xs text-slate-600">
                        <span
                          className={
                            row.severity === 'red'
                              ? 'font-medium text-red-700'
                              : row.severity === 'amber'
                                ? 'font-medium text-amber-700'
                                : 'text-slate-600'
                          }
                        >
                          {row.reasonLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        {unmatched && actionHref ? (
                          <Link
                            href={actionHref}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-circleTel-orange hover:underline"
                          >
                            <PiLinkBold className="h-3.5 w-3.5" aria-hidden="true" />
                            Match…
                          </Link>
                        ) : actionHref ? (
                          <Link
                            href={actionHref}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-circleTel-orange hover:underline"
                          >
                            Open
                            <PiArrowRightBold className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
