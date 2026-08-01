'use client';

/**
 * PROTOTYPE — throwaway. Variant B "Report-first" for ticket #688.
 *
 * No side rail. The report occupies the page as a document, echoing the printed
 * Layout A hierarchy. Sites are chosen from a header switcher and flipped through
 * with a filmstrip; actions dock in a sticky footer bar. Primary affordance is
 * reading the report you are about to send a client.
 */

import { useState } from 'react';
import {
  PiArrowClockwiseBold,
  PiBuildingsBold,
  PiCaretDownBold,
  PiCheckBold,
  PiWarningBold,
} from 'react-icons/pi';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DownloadSplit, NotAvailablePanel } from './VariantA';
import {
  PROTO_REPORTS,
  PROTO_SITES,
  chartData,
  gb,
  isUnavailable,
  mbps,
} from './fixtures';

const chartConfig = {
  downloadGb: { label: 'Downloaded', color: '#E87A1E' },
} satisfies ChartConfig;

export function VariantB() {
  const [selected, setSelected] = useState<string[]>([
    'site-alexandra',
    'site-jabulani',
    'site-sweetwaters',
    'site-soshanguve',
  ]);
  const [focused, setFocused] = useState('site-alexandra');
  const report = PROTO_REPORTS[focused];

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  return (
    <div className="pb-24">
      {/* Slim command row — period + site switcher, no cards */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Previous month
              <PiCaretDownBold className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Report period (SAST)</DropdownMenuLabel>
            <DropdownMenuCheckboxItem>Last complete week</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>Previous month</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Last 60 days</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem>Custom range…</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <PiBuildingsBold className="h-4 w-4 text-slate-400" />
              {selected.length} sites selected
              <PiCaretDownBold className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Eligible sites</DropdownMenuLabel>
            {PROTO_SITES.map((site) => (
              <DropdownMenuCheckboxItem
                key={site.id}
                checked={selected.includes(site.id)}
                onCheckedChange={() => toggle(site.id)}
              >
                <span className="truncate">{site.name}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <PiArrowClockwiseBold className="h-3.5 w-3.5" />
            Refresh
          </Button>
          loaded 14:02
        </div>
      </div>

      {/* Filmstrip — flip focus between the selected sites */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-4">
        {PROTO_SITES.filter((site) => selected.includes(site.id)).map((site) => {
          const isFocused = site.id === focused;
          const siteReport = PROTO_REPORTS[site.id];
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => setFocused(site.id)}
              className={`min-w-[13rem] shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                isFocused
                  ? 'border-orange-500 bg-white shadow-sm ring-1 ring-orange-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isUnavailable(siteReport) ? (
                  <PiWarningBold className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <PiCheckBold className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span className="truncate text-sm font-medium text-slate-900">
                  {site.name}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {isUnavailable(siteReport)
                  ? 'Not available'
                  : gb(siteReport.core.downloadBytes)}
              </span>
            </button>
          );
        })}
      </div>

      {/* The document */}
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        {isUnavailable(report) ? (
          <NotAvailablePanel
            headline={report.headline}
            reason={report.reason}
            unlock={report.unlock}
            staffNote={report.staffNote}
          />
        ) : (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white">
                  CT
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Site Network Usage Report
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {report.site.name} · {report.site.accountNumber}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-medium text-slate-700">{report.period.label}</p>
                <p>{report.period.rangeLabel}</p>
                <p className="mt-2">Generated 1 Aug 2026 12:14 SAST</p>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
              <Kpi label="Downloaded" value={gb(report.core.downloadBytes)} />
              <Kpi label="Uploaded" value={gb(report.core.uploadBytes)} />
              <Kpi label="Avg download" value={mbps(report.core.avgDownKbps)} />
              <Kpi label="Peak day" value={gb(report.core.peakBucketBytes ?? 0)} />
            </section>

            <section className="mt-8">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Core site traffic
                </h3>
                <Badge variant="secondary">{report.core.sourceLabel}</Badge>
              </div>
              <ChartContainer config={chartConfig} className="mt-4 h-56 w-full">
                <BarChart data={chartData(report)} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={38}
                    fontSize={11}
                    unit=" GB"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="downloadGb" fill="var(--color-downloadGb)" radius={2} />
                </BarChart>
              </ChartContainer>
              <p className="mt-3 text-xs text-slate-500">{report.core.note}</p>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                Device identity
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                <Field label="Name" value={report.device?.name ?? '—'} />
                <Field label="Model" value={report.device?.model ?? '—'} />
                <Field label="Serial" value={report.device?.serial ?? '—'} />
                <Field label="Group" value={report.device?.group ?? '—'} />
              </dl>
            </section>

            {report.unjani && (
              <section className="mt-8 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Wi-Fi breakdown
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Separate sources — do not sum with each other or with core traffic.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">Staff Wi-Fi</p>
                    {report.staff.kind === 'available' ? (
                      <>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                          {gb(report.staff.totalBytes)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {gb(report.staff.rxBytes)} down · {gb(report.staff.txBytes)} up
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        {report.staff.kind === 'no_samples'
                          ? 'Not available — no Staff Wi-Fi samples in this period'
                          : 'Not available — AP not linked to site'}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">
                      Patient Free Wi-Fi — TDX
                    </p>
                    {report.patient.kind === 'available' ? (
                      <>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                          {report.patient.downloadGb} GB
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {report.patient.uniqueUsers.toLocaleString()} users ·{' '}
                          {report.patient.loginSessions.toLocaleString()} sessions
                        </p>
                      </>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-slate-500">Awaiting TDX export</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Upload Looker CSV
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <p className="truncate text-sm text-slate-600">
            Viewing <span className="font-medium text-slate-900">
              {isUnavailable(report) ? 'Unjani Clinic Soshanguve' : report.site.name}
            </span>{' '}
            · {selected.length} selected
          </p>
          <DownloadSplit count={selected.length} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}
