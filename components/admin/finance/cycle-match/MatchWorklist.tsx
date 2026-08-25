'use client';

import Link from 'next/link';
import { SourceDot, type SourceDotTone } from './SourceDot';
import { formatZar, formatSignedZar } from './money';
import type { CycleWorklistRow } from '@/lib/billing/cycle-match/load-workbench';
import type { LeakType } from '@/lib/billing/cycle-match/types';

const LEAK_TONE: Record<LeakType, SourceDotTone> = {
  never_invoiced: 'red',
  under_contract: 'yellow',
  promo_expired: 'amber',
  cancelled_still_billing: 'blue',
};

const th =
  'pb-2 pr-4 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400';

export function MatchWorklist({
  rows,
  title,
  actionHref,
}: {
  rows: CycleWorklistRow[];
  title: string;
  actionHref?: (row: CycleWorklistRow) => string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">{rows.length} rows</span>
      </div>
      <div className="overflow-x-auto px-5 py-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className={th}>Service</th>
              <th className={th}>Customer / service</th>
              <th className={th}>ISP Platform</th>
              <th className={th}>Zoho Books</th>
              <th className={th}>Netcash</th>
              <th className={`${th} text-right`}>Variance</th>
              <th className={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  No rows in this view.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const href =
                  actionHref?.(row) ||
                  (row.exceptionId
                    ? `/admin/finance/reconciliation/${row.exceptionId}`
                    : undefined);
                const mismatch = row.matchState !== 'matched_3';
                return (
                  <tr
                    key={row.matchId}
                    className={
                      mismatch
                        ? 'border-b border-slate-100 bg-red-50/40'
                        : 'border-b border-slate-100'
                    }
                  >
                    <td className="py-3 pr-4 font-mono text-xs">{row.serviceDisplayId}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{row.customerName}</div>
                      <div className="text-xs text-slate-500">
                        {row.packageName}
                        {row.fno ? ` · ${row.fno}` : ''}
                      </div>
                      {row.leakLabel && (
                        <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <SourceDot tone={row.leakType ? LEAK_TONE[row.leakType] : 'grey'} />
                          {row.leakLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{formatZar(row.platformExVat)}</td>
                    <td
                      className={
                        row.zohoExVat == null
                          ? 'py-3 pr-4 font-medium text-red-600'
                          : 'py-3 pr-4'
                      }
                    >
                      {row.zohoExVat == null ? 'none' : formatZar(row.zohoExVat)}
                      {row.zohoInvoiceNumber && (
                        <div className="font-mono text-[11px] text-slate-400">
                          {row.zohoInvoiceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {formatZar(row.netcashAmount)}
                      {row.netcashRef && (
                        <div className="font-mono text-[11px] text-slate-400">
                          {row.netcashRef}
                        </div>
                      )}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-medium ${
                        row.signedVariance < 0
                          ? 'text-red-600'
                          : row.signedVariance > 0
                            ? 'text-slate-900'
                            : 'text-slate-500'
                      }`}
                    >
                      {formatSignedZar(row.signedVariance)}
                    </td>
                    <td className="py-3">
                      {href ? (
                        <Link
                          href={href}
                          className="text-sm font-medium text-circleTel-orange hover:underline"
                        >
                          {row.actionLabel}
                        </Link>
                      ) : (
                        <span className="text-slate-400">{row.actionLabel}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
