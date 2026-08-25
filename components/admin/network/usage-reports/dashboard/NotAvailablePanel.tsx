'use client';

/**
 * The not-available state (#689), drawn as the sample PDF's orange callout.
 *
 * Until per-device history builds up (#702) this is what most sites show, so it
 * is the main surface of the page rather than an edge case — it has to be
 * genuinely useful, not an apology.
 */

import Link from 'next/link';
import { PiArrowSquareOutBold, PiWarningBold } from 'react-icons/pi';

import { describeCoreUnavailable } from '@/lib/usage-reports/unavailable-copy';
import type { CoreUnavailableDiagnosis } from '@/lib/usage-reports/types';

interface NotAvailablePanelProps {
  siteLabel: string;
  periodLabel: string;
  reason: 'core_unavailable' | 'site_not_eligible';
  diagnosis: CoreUnavailableDiagnosis | null;
}

export function NotAvailablePanel({
  siteLabel,
  periodLabel,
  reason,
  diagnosis,
}: NotAvailablePanelProps) {
  const causes = diagnosis ? describeCoreUnavailable(diagnosis) : [];

  return (
    <article className="mx-auto max-w-3xl bg-white px-6 py-7 shadow-sm ring-1 ring-slate-200 sm:px-10 sm:py-9">
      <header className="flex items-start justify-between gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 text-xs font-bold text-orange-600">
          CT
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Site Network Usage Report
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {siteLabel} · {periodLabel}
          </p>
        </div>
      </header>
      <div className="mt-4 h-[3px] w-full bg-orange-500" />

      <div className="mt-6 rounded-md border-2 border-orange-500 bg-orange-50/40 px-5 py-4">
        <div className="flex items-start gap-2">
          <PiWarningBold className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <p className="text-sm font-bold text-orange-700">
            {reason === 'site_not_eligible'
              ? 'This site is not eligible for usage reporting'
              : 'Core traffic not available for this period'}
          </p>
        </div>

        {reason === 'site_not_eligible' ? (
          <p className="mt-2 text-xs text-slate-700">
            Only active corporate sites are reported. A site that is pending or
            whose linked service is not active is excluded.
          </p>
        ) : causes.length === 0 ? (
          <p className="mt-2 text-xs text-slate-700">
            No permitted traffic source covers this period.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {causes.map((cause) => (
              <li key={cause.key}>
                <p className="text-xs font-bold text-slate-900">{cause.title}</p>
                <p className="mt-0.5 text-xs text-slate-700">{cause.detail}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {cause.href ? (
                    <Link
                      href={cause.href}
                      className="inline-flex items-center gap-1 font-medium text-orange-700 underline underline-offset-2"
                    >
                      {cause.unlock}
                      <PiArrowSquareOutBold className="h-3 w-3" />
                    </Link>
                  ) : (
                    cause.unlock
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-[11px] text-orange-700">
          No figure is shown rather than a wrong one. In a bulk ZIP this site
          becomes a skip slip.
        </p>
      </div>
    </article>
  );
}
