'use client';

/**
 * PROTOTYPE — throwaway. Variant A "Split workbench" for ticket #688.
 *
 * Master–detail: a sticky left rail owns selection and focus, the right pane is
 * a scrolling report canvas. Primary affordance is comparing sites quickly.
 */

import { useState } from 'react';
import {
  PiArrowClockwiseBold,
  PiCaretDownBold,
  PiDownloadSimpleBold,
  PiMagnifyingGlassBold,
  PiWarningBold,
} from 'react-icons/pi';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { MetricCard, PageHeader, SectionCard } from '@/components/backend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import {
  PROTO_REPORTS,
  PROTO_SITES,
  chartData,
  gb,
  isUnavailable,
  mbps,
} from './fixtures';

const PERIODS = [
  { key: 'weekly', label: 'Last week' },
  { key: 'monthly', label: 'Previous month' },
  { key: 'sixty_day', label: 'Last 60 days' },
  { key: 'custom', label: 'Custom' },
];

const chartConfig = {
  downloadGb: { label: 'Downloaded', color: '#E87A1E' },
} satisfies ChartConfig;

export function VariantA() {
  const [period, setPeriod] = useState('monthly');
  const [selected, setSelected] = useState<string[]>([
    'site-alexandra',
    'site-jabulani',
    'site-sweetwaters',
  ]);
  const [focused, setFocused] = useState('site-alexandra');

  const report = PROTO_REPORTS[focused];
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Usage Reports"
        subtitle="Preview a site's report, then download it or the whole selection."
        actions={<DownloadSplit count={selected.length} />}
      />

      {/* Toolbar — the three option cards collapsed into one row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {PERIODS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setPeriod(option.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === option.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox defaultChecked /> Include provisioned
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox /> Unjani only
        </label>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <PiArrowClockwiseBold className="h-3.5 w-3.5" />
            Refresh
          </Button>
          loaded 14:02
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* Left rail — selection + focus */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search sites" className="pl-9" />
              </div>
              <p className="mt-2 px-1 text-xs text-slate-500">
                {selected.length} of {PROTO_SITES.length} selected
              </p>
            </div>
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
              {PROTO_SITES.map((site) => {
                const isFocused = site.id === focused;
                return (
                  <li key={site.id}>
                    <div
                      className={`flex items-start gap-3 px-3 py-2.5 ${
                        isFocused
                          ? 'border-l-2 border-orange-500 bg-orange-50/60'
                          : 'border-l-2 border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <Checkbox
                        checked={selected.includes(site.id)}
                        onCheckedChange={() => toggle(site.id)}
                        className="mt-1"
                      />
                      <button
                        type="button"
                        onClick={() => setFocused(site.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {site.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {site.account_number}
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Right pane — report canvas */}
        <div className="min-w-0 space-y-5">
          {isUnavailable(report) ? (
            <NotAvailablePanel
              headline={report.headline}
              reason={report.reason}
              unlock={report.unlock}
              staffNote={report.staffNote}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {report.site.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {report.site.accountNumber} · {report.period.rangeLabel} · SAST
                  </p>
                </div>
                <Badge variant="secondary">{report.core.sourceLabel}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Downloaded" value={gb(report.core.downloadBytes)} />
                <MetricCard title="Uploaded" value={gb(report.core.uploadBytes)} />
                <MetricCard title="Avg download" value={mbps(report.core.avgDownKbps)} />
                <MetricCard
                  title="Peak day"
                  value={gb(report.core.peakBucketBytes ?? 0)}
                />
              </div>

              <SectionCard title="Core site traffic">
                <ChartContainer config={chartConfig} className="h-64 w-full">
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
              </SectionCard>

              <div className="grid gap-5 lg:grid-cols-2">
                <SectionCard title="Device identity">
                  <dl className="space-y-2 text-sm">
                    <Row label="Name" value={report.device?.name ?? '—'} />
                    <Row label="Model" value={report.device?.model ?? '—'} />
                    <Row label="Serial" value={report.device?.serial ?? '—'} />
                    <Row label="Group" value={report.device?.group ?? '—'} />
                  </dl>
                </SectionCard>

                <SectionCard title="Wi-Fi breakdown">
                  <div className="space-y-4">
                    <WifiBlock
                      title="Staff Wi-Fi"
                      body={
                        report.staff.kind === 'available'
                          ? `${gb(report.staff.totalBytes)} total`
                          : report.staff.kind === 'no_samples'
                            ? 'Not available — no Staff Wi-Fi samples in this period'
                            : 'Not available — AP not linked to site'
                      }
                      muted={report.staff.kind !== 'available'}
                    />
                    <WifiBlock
                      title="Patient Free Wi-Fi — TDX"
                      body={
                        report.patient.kind === 'available'
                          ? `${report.patient.uniqueUsers.toLocaleString()} users · ${report.patient.downloadGb} GB`
                          : 'Awaiting TDX export'
                      }
                      muted={report.patient.kind !== 'available'}
                      action={
                        report.patient.kind !== 'available' && report.unjani ? (
                          <Button variant="outline" size="sm">
                            Upload Looker CSV
                          </Button>
                        ) : null
                      }
                    />
                    <p className="text-xs text-slate-500">
                      Separate sources — do not sum with core traffic.
                    </p>
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function WifiBlock({
  title,
  body,
  muted,
  action,
}: {
  title: string;
  body: string;
  muted: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className={`mt-1 text-sm ${muted ? 'text-slate-500' : 'text-slate-900'}`}>
        {body}
      </p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function DownloadSplit({ count }: { count: number }) {
  return (
    <div className="flex">
      <Button className="rounded-r-none">
        <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-l-none border-l border-white/20 px-2">
            <PiCaretDownBold className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>This site</DropdownMenuLabel>
          <DropdownMenuItem>Download CSV</DropdownMenuItem>
          <DropdownMenuItem>Download PDF + CSV</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Selection</DropdownMenuLabel>
          <DropdownMenuItem>
            {count > 5
              ? `Queue ${count} reports (ZIP)`
              : `Download ${count} reports (ZIP)`}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function NotAvailablePanel({
  headline,
  reason,
  unlock,
  staffNote,
}: {
  headline: string;
  reason: string;
  unlock: string[];
  staffNote: string;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <PiWarningBold className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-amber-900">{headline}</p>
            <p className="mt-1 text-sm text-amber-800">{reason}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
              To unlock
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-800">
              {unlock.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-amber-800">{staffNote}</p>
          <p className="text-xs text-amber-700">
            In a bulk ZIP this site becomes a skip slip — never a zero-filled report.
          </p>
        </div>
      </div>
    </div>
  );
}
