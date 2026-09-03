'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PiArrowRightBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/backend';
import type { StatusVariant } from '@/components/backend';
import { filterThreeWayInvoices } from '@/lib/billing/recon-hub/build-three-way';
import type {
  ThreeWayInvoiceRow,
  ThreeWayMatchFilter,
  ZohoStatus,
} from '@/lib/billing/recon-hub/types';

export interface ThreeWayInvoiceTableProps {
  invoices: ThreeWayInvoiceRow[];
}

const FILTER_CHIPS: Array<{ id: ThreeWayMatchFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'issued', label: 'Issued' },
  { id: 'paid', label: 'Paid' },
  { id: 'voided', label: 'Voided' },
  { id: 'ct_paid_books_open', label: 'CT paid / Books open' },
  { id: 'netcash_unmatched', label: 'Netcash gap' },
  { id: 'amount_mismatch', label: 'Amount mismatch' },
  { id: 'name_mismatch', label: 'Name mismatch' },
];

const ZOHO_VARIANT: Record<ZohoStatus, StatusVariant> = {
  synced: 'success',
  pending: 'warning',
  failed: 'error',
  skipped: 'neutral',
  'n/a': 'neutral',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function statusVariant(status: string | null): StatusVariant {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s === 'paid') return 'success';
  if (s === 'overdue') return 'error';
  if (s === 'partial' || s === 'sent') return 'warning';
  if (s === 'voided' || s === 'cancelled') return 'neutral';
  return 'info';
}

/**
 * Invoice-centric three-way match table (CT / Books / Netcash).
 */
export function ThreeWayInvoiceTable({ invoices }: ThreeWayInvoiceTableProps) {
  const [filter, setFilter] = useState<ThreeWayMatchFilter>('all');

  const rows = useMemo(
    () => filterThreeWayInvoices(invoices, filter),
    [invoices, filter]
  );

  const chipCounts = useMemo(() => {
    const counts = {} as Record<ThreeWayMatchFilter, number>;
    for (const chip of FILTER_CHIPS) {
      counts[chip.id] = filterThreeWayInvoices(invoices, chip.id).length;
    }
    return counts;
  }, [invoices]);

  return (
    <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Three-way invoices
          </CardTitle>
          <p className="text-xs text-slate-500">
            CircleTel (SoR) · Zoho Books mirror · Netcash settlement
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500">{rows.length} shown</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Three-way invoice filters"
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
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
              No invoices for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Invoice
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Account / service
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      CT
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Books
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Netcash
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Open
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const flag =
                      row.matchFlags.ctPaidBooksOpen ||
                      row.matchFlags.amountMismatch ||
                      row.matchFlags.netcashUnmatchedPaid ||
                      row.matchFlags.nameMismatch;
                    return (
                      <tr
                        key={row.id}
                        className={
                          flag
                            ? 'bg-amber-50/40 transition-colors hover:bg-amber-50/70'
                            : 'transition-colors hover:bg-slate-50'
                        }
                      >
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <Link
                            href={row.href}
                            className="inline-flex items-center gap-1 font-medium text-circleTel-orange hover:underline"
                          >
                            {row.invoiceNumber || row.id.slice(0, 8)}
                            <PiArrowRightBold className="h-3 w-3" aria-hidden />
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {row.invoiceDate || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-xs font-medium text-slate-800">
                            {row.customerDisplayName || '—'}
                          </div>
                          <div className="font-mono text-xs text-slate-700">
                            {row.accountNumber || '—'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.serviceName || '—'}
                          </div>
                          {row.matchFlags.nameMismatch ? (
                            <div className="text-[11px] font-medium text-amber-700">
                              Books name differs
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <StatusBadge
                            status={row.ctStatus}
                            variant={statusVariant(row.ctStatus)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {formatCurrency(row.ctTotal)}
                          {row.matchFlags.amountMismatch && row.booksTotal != null ? (
                            <div className="text-[11px] font-normal text-amber-700">
                              Books {formatCurrency(row.booksTotal)}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <StatusBadge
                            status={row.booksSyncStatus}
                            variant={ZOHO_VARIANT[row.booksSyncStatus]}
                          />
                          <div className="text-[11px] text-slate-500">
                            {row.booksStatus ||
                              (row.booksInvoiceId ? 'linked' : 'unlinked')}
                            {row.booksBalance != null
                              ? ` · bal ${formatCurrency(row.booksBalance)}`
                              : ''}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-600">
                          {row.netcashState}
                          {row.netcashRef ? (
                            <div className="font-mono text-[11px] text-slate-400">
                              {row.netcashRef}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          <Link
                            href={row.href}
                            className="text-xs font-semibold text-slate-600 hover:text-circleTel-orange hover:underline"
                          >
                            Open
                          </Link>
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
