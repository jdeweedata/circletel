'use client';

/**
 * The report canvas — Variant B from #688, drawn in the sample PDF's grammar so
 * the screen and the printed document read as the same artefact: brand mark
 * left with the title right, thick orange rule, uppercase micro-labels, a KPI
 * row with no card boxes, flat bars on a grey panel, grey inline device panel,
 * bordered Wi-Fi panels, centred footer.
 */

import { PiArrowDownBold, PiArrowUpBold, PiDatabaseBold, PiLightningBold } from 'react-icons/pi';

import { formatBytesAsGb } from '@/lib/usage-reports/bytes';
import type { SiteUsageReportModel } from '@/lib/usage-reports/types';

import { TrafficChart } from './TrafficChart';

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

function Panel({
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

function formatMbps(kbps: number | null): string {
  return kbps == null ? '—' : `${(kbps / 1000).toFixed(1)} Mbps`;
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  })}, ${date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
  })} SAST`;
}

export function ReportDocument({ model }: { model: SiteUsageReportModel }) {
  const { site, period, core, device, staff, patient, unjani } = model;

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
            Generated {formatGeneratedAt(model.generatedAtIso)}
          </p>
        </div>
      </header>
      <div className="mt-4 h-[3px] w-full bg-orange-500" />

      <section className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <MicroLabel>Site</MicroLabel>
          <p className="text-lg font-bold text-slate-900">{site.name}</p>
          <p className="text-xs text-slate-500">
            {site.accountNumber} · {site.accountName}
          </p>
        </div>
        <div className="text-right">
          <MicroLabel>Report period</MicroLabel>
          <p className="text-lg font-bold text-slate-900">{period.label}</p>
          <p className="text-xs text-slate-500">{period.rangeLabel} · SAST</p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Kpi
          label="Downloaded"
          value={formatBytesAsGb(core.downloadBytes)}
          icon={<PiArrowDownBold className="h-3.5 w-3.5 text-emerald-600" />}
        />
        <Kpi
          label="Uploaded"
          value={formatBytesAsGb(core.uploadBytes)}
          icon={<PiArrowUpBold className="h-3.5 w-3.5 text-blue-600" />}
        />
        <Kpi
          label="Avg DL"
          value={formatMbps(core.avgDownKbps)}
          icon={<PiLightningBold className="h-3.5 w-3.5 text-orange-500" />}
        />
        <Kpi
          label="Peak bucket"
          value={formatBytesAsGb(core.peakBucketBytes ?? 0)}
          icon={<PiDatabaseBold className="h-3.5 w-3.5 text-slate-400" />}
        />
      </section>

      <section className="mt-7 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Core site traffic</h3>
          <span className="text-xs text-slate-500">Primary: {core.sourceLabel}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{core.note}</p>
        <div className="mt-3">
          <TrafficChart
            dailyDownloadBytes={core.dailyDownloadBytes}
            dailyCovered={core.dailyCovered}
            periodStartIso={period.startIso}
          />
        </div>
        {core.secondaryInterstellio && (
          <p className="mt-2 text-[11px] text-slate-400">
            BNG / Interstellio, same period:{' '}
            {formatBytesAsGb(core.secondaryInterstellio.downloadBytes)} down ·{' '}
            {formatBytesAsGb(core.secondaryInterstellio.uploadBytes)} up — shown for
            comparison, never summed with the primary.
          </p>
        )}
      </section>

      {device && (
        <section className="mt-6 rounded-md bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold text-slate-900">Device identity</p>
          <p className="mt-1 text-xs text-slate-500">
            {[
              device.name,
              device.model,
              device.serial && `SN ${device.serial}`,
              device.group && `Group ${device.group}`,
              device.status,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </section>
      )}

      {unjani && (
        <section className="mt-7">
          <h3 className="text-sm font-bold text-slate-900">
            Unjani Wi-Fi breakdown{' '}
            <span className="font-normal text-slate-500">
              (separate sources — do not sum)
            </span>
          </h3>

          <div className="mt-3 space-y-3">
            <Panel
              title="Staff Wi-Fi"
              source="Source: CircleTel radio (SSID period bytes)"
            >
              {staff.kind === 'available' ? (
                <>
                  <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-slate-900">
                    <span>Total: {formatBytesAsGb(staff.totalBytes)}</span>
                    <span>Download: {formatBytesAsGb(staff.rxBytes)}</span>
                    <span>Upload: {formatBytesAsGb(staff.txBytes)}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Sampled STA session telemetry — not accounting-grade;
                    forward-only from sampler go-live and may undercount short
                    sessions.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  {staff.kind === 'no_samples'
                    ? 'Not available — no Staff Wi-Fi samples in this period.'
                    : 'Not available — this site has no access point linked to it.'}
                </p>
              )}
            </Panel>

            <Panel
              title="Patient Free Wi-Fi"
              source={
                patient.kind === 'available'
                  ? patient.source === 'tdx_csv'
                    ? 'Source: TDX/ThinkWiFi (manual Looker export)'
                    : patient.source === 'combined'
                      ? 'Source: CircleTel Free Clinic SSID + optional TDX users/sessions'
                      : 'Source: CircleTel radio (Free Clinic SSID period bytes)'
                  : 'Source: CircleTel Free Clinic SSID (or optional TDX export)'
              }
            >
              {patient.kind === 'available' ? (
                <>
                  <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-slate-900">
                    {patient.totalBytes != null ? (
                      <>
                        <span>Total: {formatBytesAsGb(patient.totalBytes)}</span>
                        <span>
                          Download: {formatBytesAsGb(patient.rxBytes ?? 0)}
                        </span>
                        <span>
                          Upload: {formatBytesAsGb(patient.txBytes ?? 0)}
                        </span>
                      </>
                    ) : (
                      <span>
                        Download: {patient.downloadGb.toFixed(2)} GB
                      </span>
                    )}
                    {patient.uniqueUsers != null && (
                      <span>
                        Unique users: {patient.uniqueUsers.toLocaleString()}
                      </span>
                    )}
                    {patient.loginSessions != null && (
                      <span>
                        Login sessions:{' '}
                        {patient.loginSessions.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {patient.source === 'tdx_csv'
                      ? 'Aggregate / anonymised · may be revised by TDX · do not sum with Staff or BNG totals.'
                      : 'Sampled STA session telemetry on Unjani Clinic Free WiFi — not accounting-grade; do not sum with Staff, BNG, or TDX Download GB.'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  {patient.kind === 'ap_unlinked'
                    ? 'Not available — this site has no access point linked to it.'
                    : patient.kind === 'no_samples'
                      ? 'Not available — no Free Clinic Wi-Fi samples in this period (optional TDX CSV also not supplied).'
                      : 'Awaiting TDX export.'}
                </p>
              )}
            </Panel>
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
        CircleTel · {site.accountNumber} · Generated{' '}
        {formatGeneratedAt(model.generatedAtIso)} · Figures are from the labelled
        source only
      </footer>
    </article>
  );
}
