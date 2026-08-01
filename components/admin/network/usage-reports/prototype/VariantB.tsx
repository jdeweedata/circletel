'use client';

/**
 * PROTOTYPE — throwaway. Variant B "Report-first" for ticket #688, restyled to
 * match the two references the design should sit between:
 *
 *  - `/admin/network/analytics` supplies the PAGE furniture: breadcrumb, title
 *    with a right-aligned toolbar, a source pill + "last rollup" meta line, and
 *    selectable inner cards (orange border + tint when active) — the same
 *    pattern as its Group Traffic selector.
 *  - The Unjani Alexandra sample PDF supplies the DOCUMENT grammar: a thick
 *    orange rule under the header, uppercase micro-labels above values, a KPI
 *    row with no card boxes, bars on a plain grey panel with no axes or
 *    gridlines, grey inline panels, and an orange callout for the critical gap.
 *
 * Page chrome from Analytics; canvas from the PDF.
 */

import { useState } from 'react';
import {
  PiArrowClockwiseBold,
  PiArrowDownBold,
  PiArrowUpBold,
  PiBuildingsBold,
  PiCaretDownBold,
  PiDatabaseBold,
  PiLightningBold,
  PiWarningBold,
} from 'react-icons/pi';
import { Bar, BarChart, ReferenceArea, ResponsiveContainer, XAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DownloadSplit } from './VariantA';
import {
  PROTO_REPORTS,
  PROTO_SITES,
  chartData,
  gb,
  isUnavailable,
  mbps,
} from './fixtures';

const ORANGE = '#E87A1E';

export function VariantB({ initialFocus }: { initialFocus?: string } = {}) {
  const [selected, setSelected] = useState<string[]>([
    'site-alexandra',
    'site-jabulani',
    'site-sweetwaters',
    'site-soshanguve',
  ]);
  const [focused, setFocused] = useState(initialFocus ?? 'site-alexandra');
  const report = PROTO_REPORTS[focused];

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  return (
    <div className="space-y-6 pb-24">
      {/* ---- Page chrome: Analytics grammar ---- */}
      <div>
        <p className="text-xs text-slate-400">
          Activity / Infrastructure / Usage Reports
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Site Usage Reports
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Preview a site&apos;s report, then download it or the whole selection
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 font-normal">
                  <PiBuildingsBold className="h-4 w-4 text-slate-400" />
                  {selected.length} sites
                  <PiCaretDownBold className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 font-normal">
                  Previous month
                  <PiCaretDownBold className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Report period (SAST)</DropdownMenuLabel>
                <DropdownMenuCheckboxItem>Last complete week</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked>Previous month</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Last 60 days</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Custom range…</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="gap-2 font-normal">
              <PiArrowClockwiseBold className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Source + freshness line, as Analytics does under its header */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
            Interstellio subscriber usage
          </span>
          <span className="text-slate-400">
            {isUnavailable(report) ? 'Unjani Clinic Soshanguve' : report.site.name} · 1
            – 31 July 2026 · loaded 14:02
          </span>
        </div>
      </div>

      {/* ---- Site selector: Analytics "Group Traffic" inner-card pattern ---- */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Selected sites</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Click a site to preview its report — download acts on the whole selection
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PROTO_SITES.filter((site) => selected.includes(site.id)).map((site) => {
            const isFocused = site.id === focused;
            const siteReport = PROTO_REPORTS[site.id];
            const unavailable = isUnavailable(siteReport);
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => setFocused(site.id)}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  isFocused
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="block truncate text-sm font-medium text-slate-900">
                  {site.name}
                </span>
                <span className="mt-1 block text-lg font-semibold text-slate-900">
                  {unavailable ? '—' : gb(siteReport.core.downloadBytes)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {unavailable
                    ? 'Not available'
                    : `${site.account_number} · ${mbps(siteReport.core.avgDownKbps)} avg`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- The document: PDF grammar ---- */}
      <div className="mx-auto max-w-3xl bg-white px-10 py-9 shadow-sm ring-1 ring-slate-200">
        {/* Brand header + thick orange rule, straight from the PDF */}
        <header className="flex items-start justify-between gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange-500 text-xs font-bold text-orange-600">
            CT
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Site Network Usage Report
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Generated 1 August 2026, 12:14 SAST
            </p>
          </div>
        </header>
        <div className="mt-4 h-[3px] w-full bg-orange-500" />

        {isUnavailable(report) ? (
          <PdfCallout
            title={report.headline}
            body={report.reason}
            points={report.unlock}
            footnote={report.staffNote}
          />
        ) : (
          <>
            {/* SITE / REPORT PERIOD — uppercase micro-labels, two columns */}
            <section className="mt-6 flex items-start justify-between gap-6">
              <div>
                <MicroLabel>Site</MicroLabel>
                <p className="text-lg font-bold text-slate-900">{report.site.name}</p>
                <p className="text-xs text-slate-500">
                  {report.site.accountNumber} · {report.site.accountName}
                </p>
              </div>
              <div className="text-right">
                <MicroLabel>Report period</MicroLabel>
                <p className="text-lg font-bold text-slate-900">{report.period.label}</p>
                <p className="text-xs text-slate-500">
                  {report.period.rangeLabel} · SAST
                </p>
              </div>
            </section>

            {/* KPI row — no boxes, just label over value (PDF) */}
            <section className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Kpi
                label="Downloaded"
                value={gb(report.core.downloadBytes)}
                icon={<PiArrowDownBold className="h-3.5 w-3.5 text-emerald-600" />}
              />
              <Kpi
                label="Uploaded"
                value={gb(report.core.uploadBytes)}
                icon={<PiArrowUpBold className="h-3.5 w-3.5 text-blue-600" />}
              />
              <Kpi
                label="Avg DL"
                value={mbps(report.core.avgDownKbps)}
                icon={<PiLightningBold className="h-3.5 w-3.5 text-orange-500" />}
              />
              <Kpi
                label="Peak bucket"
                value={gb(report.core.peakBucketBytes ?? 0)}
                icon={<PiDatabaseBold className="h-3.5 w-3.5 text-slate-400" />}
              />
            </section>

            {/* Core traffic — section title left, source right; bars on a grey
                panel with no axes or gridlines, exactly as the PDF draws them */}
            <section className="mt-7 border-t border-slate-200 pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-bold text-slate-900">Core site traffic</h3>
                <span className="text-xs text-slate-500">
                  Primary: {report.core.sourceLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{report.core.note}</p>

              <div className="mt-3 rounded-md bg-slate-50 p-3">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart
                    data={chartData(report)}
                    margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <pattern
                        id="pdf-gap"
                        width={6}
                        height={6}
                        patternTransform="rotate(45)"
                        patternUnits="userSpaceOnUse"
                      >
                        <rect width={6} height={6} fill="#EEF2F7" />
                        <line x1={0} y1={0} x2={0} y2={6} stroke="#94A3B8" strokeWidth={1.2} />
                      </pattern>
                    </defs>
                    {/* Uncovered stretch — never a zero-height bar (#689) */}
                    <ReferenceArea x1={1} x2={8} fill="url(#pdf-gap)" fillOpacity={1} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                      tickMargin={6}
                      fontSize={9}
                      stroke="#94A3B8"
                    />
                    <Bar
                      dataKey="downloadGb"
                      fill={ORANGE}
                      radius={1}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Daily download (GB) · {report.period.rangeLabel} · hatched days have no
                samples
              </p>
            </section>

            {/* Device identity — flat grey panel, inline dot-separated (PDF) */}
            <section className="mt-6 rounded-md bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-900">Device identity</p>
              <p className="mt-1 text-xs text-slate-500">
                {[
                  report.device?.name,
                  report.device?.model,
                  `SN ${report.device?.serial}`,
                  `Group ${report.device?.group}`,
                  report.device?.status,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </section>

            {report.unjani && (
              <section className="mt-7">
                <h3 className="text-sm font-bold text-slate-900">
                  Unjani Wi-Fi breakdown{' '}
                  <span className="font-normal text-slate-500">
                    (separate sources — do not sum)
                  </span>
                </h3>

                <div className="mt-3 space-y-3">
                  {report.staff.kind === 'available' ? (
                    <PdfPanel
                      title="Staff Wi-Fi"
                      source="Source: CircleTel radio (SSID period bytes)"
                    >
                      <div className="flex flex-wrap gap-x-10 gap-y-1 text-sm text-slate-900">
                        <span>Total: {gb(report.staff.totalBytes)}</span>
                        <span>Download: {gb(report.staff.rxBytes)}</span>
                        <span>Upload: {gb(report.staff.txBytes)}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">
                        Sampled STA session telemetry — not accounting-grade; forward-only
                        from sampler go-live and may undercount short sessions.
                      </p>
                    </PdfPanel>
                  ) : (
                    <PdfCallout
                      title="Staff Wi-Fi — not available"
                      body={
                        report.staff.kind === 'no_samples'
                          ? 'No Staff Wi-Fi samples were recorded in this period.'
                          : 'This site has no access point linked to it.'
                      }
                      points={
                        report.staff.kind === 'no_samples'
                          ? [
                              'The SSID sampler records forward-only and cannot backfill',
                              'Periods before sampler go-live will stay empty',
                            ]
                          : ['Link a device to this site on /admin/network/devices']
                      }
                    />
                  )}

                  <PdfPanel
                    title="Patient Free Wi-Fi"
                    source="Source: TDX/ThinkWiFi (manual Looker export)"
                  >
                    {report.patient.kind === 'available' ? (
                      <>
                        <div className="flex flex-wrap gap-x-10 gap-y-1 text-sm text-slate-900">
                          <span>
                            Unique users: {report.patient.uniqueUsers.toLocaleString()}
                          </span>
                          <span>
                            Login sessions:{' '}
                            {report.patient.loginSessions.toLocaleString()}
                          </span>
                          <span>Download: {report.patient.downloadGb} GB</span>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                          Aggregate / anonymised · may be revised by TDX · do not sum with
                          Staff or BNG totals.
                        </p>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-500">Awaiting TDX export</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Upload Looker CSV
                        </Button>
                      </div>
                    )}
                  </PdfPanel>
                </div>
              </section>
            )}

            <footer className="mt-8 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
              CircleTel · {report.site.accountNumber} · Generated 1 Aug 2026, 12:14 SAST
              · Do not sum Patient + Staff + BNG
            </footer>
          </>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <p className="truncate text-sm text-slate-600">
            Viewing{' '}
            <span className="font-medium text-slate-900">
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

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <MicroLabel>{label}</MicroLabel>
      <p className="mt-0.5 text-xl font-bold text-slate-900">{value}</p>
      <span className="mt-1 inline-flex">{icon}</span>
    </div>
  );
}

function PdfPanel({
  title,
  source,
  children,
}: {
  title: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <span className="text-[11px] text-slate-500">{source}</span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** The PDF's orange-bordered cream callout, used for every not-available state. */
function PdfCallout({
  title,
  body,
  points,
  footnote,
}: {
  title: string;
  body: string;
  points: string[];
  footnote?: string;
}) {
  return (
    <div className="mt-6 rounded-md border-2 border-orange-500 bg-orange-50/40 px-5 py-4">
      <div className="flex items-start gap-2">
        <PiWarningBold className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
        <p className="text-sm font-bold text-orange-700">{title}</p>
      </div>
      <p className="mt-2 text-xs text-slate-700">{body}</p>
      <p className="mt-3 text-xs font-bold text-slate-900">To unlock:</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-xs text-slate-700">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ol>
      {footnote && (
        <p className="mt-3 text-xs font-medium text-orange-700">{footnote}</p>
      )}
    </div>
  );
}
