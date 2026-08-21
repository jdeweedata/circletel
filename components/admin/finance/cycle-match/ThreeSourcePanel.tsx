'use client';

import { SourceDot } from './SourceDot';
import { formatZar } from './money';
import type { ThreeSourcePanel } from '@/lib/billing/cycle-match/load-workbench';

function Column({
  tone,
  title,
  children,
}: {
  tone: 'platform' | 'zoho' | 'netcash';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        <SourceDot tone={tone} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Bar({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <div
      className={
        ok
          ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
          : 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
      }
    >
      {label}
    </div>
  );
}

export function ThreeSourcePanel({ panel }: { panel: ThreeSourcePanel }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            Three-way match
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            {panel.displayCode ? `${panel.displayCode} · ` : ''}
            {panel.customerName}
          </h2>
          <p className="text-sm text-slate-500">
            {panel.serviceDisplayId} · {panel.packageName}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
          <SourceDot tone={panel.legsMatched === 3 ? 'netcash' : 'zoho'} />
          {panel.legsMatched} of 3 matched
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Column tone="platform" title="ISP Platform">
          <p className="font-mono text-sm text-slate-900">{panel.platform.recordId}</p>
          <p className="mt-1 text-sm text-slate-500">{panel.platform.status}</p>
          <p className="mt-3 text-xl font-semibold">{formatZar(panel.platform.amountExVat)}</p>
          <p className="text-xs text-slate-500">excl VAT · {formatZar(panel.platform.amountInclVat)} incl</p>
        </Column>
        <Column tone="zoho" title="Zoho Books">
          <p className="font-mono text-sm text-slate-900">
            {panel.zoho.invoiceNumber || 'none'}
          </p>
          <p className="mt-1 text-sm text-slate-500">{panel.zoho.status}</p>
          <p
            className={
              panel.pairwise.platformToZoho.ok
                ? 'mt-3 text-xl font-semibold'
                : 'mt-3 text-xl font-semibold text-red-600'
            }
          >
            {formatZar(panel.zoho.amountExVat)}
          </p>
          <p className="text-xs text-slate-500">excl VAT</p>
        </Column>
        <Column tone="netcash" title="Netcash">
          <p className="font-mono text-sm text-slate-900">{panel.netcash.ref || 'none'}</p>
          <p className="mt-1 text-sm text-slate-500">{panel.netcash.status}</p>
          <p className="mt-3 text-xl font-semibold">{formatZar(panel.netcash.amount)}</p>
          <p className="text-xs text-slate-500">collected</p>
        </Column>
      </div>

      <div className="space-y-2">
        <Bar ok={panel.pairwise.platformToZoho.ok} label={panel.pairwise.platformToZoho.label} />
        <Bar ok={panel.pairwise.zohoToNetcash.ok} label={panel.pairwise.zohoToNetcash.label} />
        <Bar
          ok={panel.pairwise.platformToNetcash.ok}
          label={panel.pairwise.platformToNetcash.label}
        />
      </div>

      {panel.diagnosis && (
        <p className="border-l-4 border-circleTel-orange bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {panel.diagnosis}
        </p>
      )}
    </section>
  );
}
