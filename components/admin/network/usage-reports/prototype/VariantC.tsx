'use client';

/**
 * PROTOTYPE — throwaway. Variant C "Tabbed console" for ticket #688.
 *
 * No side rail and no long scroll. Selection lives in a compact table at the top
 * (row click focuses, checkbox selects, availability is visible per row); the
 * report is split across console tabs so each view fits a screen. Primary
 * affordance is working a batch without losing the overview.
 */

import { useState } from 'react';
import {
  PiArrowClockwiseBold,
  PiChartBarBold,
  PiDesktopTowerBold,
  PiGaugeBold,
  PiWifiHighBold,
} from 'react-icons/pi';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ConsoleTabsContent,
  ConsoleTabsList,
  MetricCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  Tabs,
} from '@/components/backend';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export function VariantC() {
  const [selected, setSelected] = useState<string[]>([
    'site-alexandra',
    'site-jabulani',
    'site-sweetwaters',
  ]);
  const [focused, setFocused] = useState('site-alexandra');
  const [tab, setTab] = useState('overview');
  const report = PROTO_REPORTS[focused];

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Usage Reports"
        subtitle="Previous month · 1 – 31 July 2026 · SAST"
        actions={
          <>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <PiArrowClockwiseBold className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <DownloadSplit count={selected.length} />
          </>
        }
      />

      {/* Selection table — availability visible before you commit to a batch */}
      <SectionCard title="Eligible sites" compact>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Site</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Downloaded</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PROTO_SITES.map((site) => {
              const siteReport = PROTO_REPORTS[site.id];
              const unavailable = isUnavailable(siteReport);
              return (
                <TableRow
                  key={site.id}
                  onClick={() => setFocused(site.id)}
                  className={`cursor-pointer ${
                    site.id === focused ? 'bg-orange-50/70' : ''
                  }`}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selected.includes(site.id)}
                      onCheckedChange={() => toggle(site.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {site.name}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {site.account_number}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {unavailable ? '—' : gb(siteReport.core.downloadBytes)}
                  </TableCell>
                  <TableCell>
                    {unavailable ? (
                      <StatusBadge status="Not available" variant="warning" />
                    ) : (
                      <Badge variant="secondary">Interstellio</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>

      {/* Report, split across tabs */}
      <div>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isUnavailable(report)
              ? 'Unjani Clinic Soshanguve'
              : report.site.name}
          </h2>
          <span className="text-sm text-slate-500">focused report</span>
        </div>

        {isUnavailable(report) ? (
          <NotAvailablePanel
            headline={report.headline}
            reason={report.reason}
            unlock={report.unlock}
            staffNote={report.staffNote}
          />
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <ConsoleTabsList
              items={[
                {
                  value: 'overview',
                  label: 'Overview',
                  icon: <PiGaugeBold className="h-4 w-4" />,
                },
                {
                  value: 'traffic',
                  label: 'Traffic',
                  icon: <PiChartBarBold className="h-4 w-4" />,
                },
                {
                  value: 'wifi',
                  label: 'Wi-Fi',
                  icon: <PiWifiHighBold className="h-4 w-4" />,
                },
                {
                  value: 'device',
                  label: 'Device',
                  icon: <PiDesktopTowerBold className="h-4 w-4" />,
                },
              ]}
            />

            <ConsoleTabsContent value="overview" className="mt-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Downloaded" value={gb(report.core.downloadBytes)} />
                <MetricCard title="Uploaded" value={gb(report.core.uploadBytes)} />
                <MetricCard title="Avg download" value={mbps(report.core.avgDownKbps)} />
                <MetricCard
                  title="Peak day"
                  value={gb(report.core.peakBucketBytes ?? 0)}
                />
              </div>
              <p className="mt-4 text-xs text-slate-500">
                {report.core.sourceLabel} — figures are from the labelled source only;
                do not combine with other network layers.
              </p>
            </ConsoleTabsContent>

            <ConsoleTabsContent value="traffic" className="mt-5">
              <SectionCard title="Core site traffic">
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <BarChart data={chartData(report)} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      interval={1}
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
            </ConsoleTabsContent>

            <ConsoleTabsContent value="wifi" className="mt-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Staff Wi-Fi">
                  {report.staff.kind === 'available' ? (
                    <>
                      <p className="text-3xl font-semibold text-slate-900">
                        {gb(report.staff.totalBytes)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {gb(report.staff.rxBytes)} down · {gb(report.staff.txBytes)} up
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        Sampled STA session telemetry — not accounting-grade; forward-only
                        from sampler go-live and may undercount short sessions.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {report.staff.kind === 'no_samples'
                        ? 'Not available — no Staff Wi-Fi samples in this period'
                        : 'Not available — AP not linked to site'}
                    </p>
                  )}
                </SectionCard>
                <SectionCard title="Patient Free Wi-Fi — TDX">
                  {report.patient.kind === 'available' ? (
                    <>
                      <p className="text-3xl font-semibold text-slate-900">
                        {report.patient.downloadGb} GB
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {report.patient.uniqueUsers.toLocaleString()} unique users ·{' '}
                        {report.patient.loginSessions.toLocaleString()} sessions
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        TDX anonymised analytics — figures may be revised by TDX.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500">Awaiting TDX export</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Upload Looker CSV
                      </Button>
                    </>
                  )}
                </SectionCard>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Separate sources — never summed with each other or with core traffic.
              </p>
            </ConsoleTabsContent>

            <ConsoleTabsContent value="device" className="mt-5">
              <SectionCard title="Device identity">
                <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Name" value={report.device?.name ?? '—'} />
                  <Field label="Model" value={report.device?.model ?? '—'} />
                  <Field label="Serial" value={report.device?.serial ?? '—'} />
                  <Field label="Group" value={report.device?.group ?? '—'} />
                </dl>
              </SectionCard>
            </ConsoleTabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}
