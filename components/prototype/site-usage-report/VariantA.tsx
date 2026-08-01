/**
 * PROTOTYPE Variant A — Classic document (invoice-like hierarchy).
 * Question: does a traditional branded PDF feel right for monthly site usage?
 */
import Image from 'next/image';
import { MOCK_SITE_USAGE_REPORT as d } from './mock-data';

function fmtGb(n: number) {
  return `${n.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} GB`;
}

function dayOfMonth(index: number): number {
  return index + 1;
}

/** Week number within the period (1-based), Mon-start buckets of 7 days. */
function weekOfPeriod(index: number): number {
  return Math.floor(index / 7) + 1;
}

export function VariantA() {
  const maxDay = Math.max(...d.dailyDownloadGb);
  const dayCount = d.dailyDownloadGb.length;
  return (
    <article className="mx-auto w-[210mm] min-h-[297mm] bg-white text-[#1F2937] shadow-xl print:shadow-none">
      <div className="border-b-[3px] border-[#F5831F] px-10 pb-5 pt-8">
        <div className="flex items-start justify-between gap-6">
          <Image
            src="/images/circletel-enclosed-logo.png"
            alt="CircleTel"
            width={120}
            height={120}
            className="h-16 w-16 object-contain"
          />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5831F]">
              Prototype — not production
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{d.title}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Generated {d.generatedAtLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 px-10 py-6 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Site</p>
          <p className="mt-1 text-lg font-semibold">{d.siteName}</p>
          <p className="text-[#6B7280]">
            {d.siteCode} · {d.accountName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Report period
          </p>
          <p className="mt-1 text-lg font-semibold">{d.periodLabel}</p>
          <p className="text-[#6B7280]">
            {d.periodRangeLabel} · {d.timezoneShort}
          </p>
          <p className="text-xs text-[#9CA3AF]">
            {d.periodType} · {d.timezone}
          </p>
        </div>
      </div>

      <div className="mx-10 grid grid-cols-4 gap-3 border-y border-[#E5E7EB] py-4">
        {[
          ['Downloaded', fmtGb(d.coreTraffic.downloadGb)],
          ['Uploaded', fmtGb(d.coreTraffic.uploadGb)],
          ['Avg DL', `${d.coreTraffic.avgDownKbps} Kbps`],
          ['Peak bucket', `${d.coreTraffic.peakBucketMb} MB`],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-wider text-[#6B7280]">{label}</p>
            <p className="mt-1 text-base font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="px-10 py-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Core site traffic</h2>
          <p className="text-xs text-[#6B7280]">Primary: {d.primarySource}</p>
        </div>
        <p className="mb-3 text-xs text-[#6B7280]">{d.coreTraffic.note}</p>
        <div className="rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2 pb-2 pt-3">
          <div className="flex h-24 items-end gap-[2px]">
            {d.dailyDownloadGb.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[#F5831F]/60"
                style={{ height: `${Math.max(8, (v / maxDay) * 100)}%` }}
                title={`${dayOfMonth(i)} Jun: ${v} GB`}
              />
            ))}
          </div>
          {/* Day-of-month ticks (every day; emphasise week starts) */}
          <div className="mt-1 flex gap-[2px] border-t border-[#E5E7EB] pt-1">
            {d.dailyDownloadGb.map((_, i) => {
              const day = dayOfMonth(i);
              const weekStart = i % 7 === 0;
              return (
                <div
                  key={i}
                  className={`flex-1 text-center font-mono leading-none ${
                    weekStart
                      ? 'text-[8px] font-semibold text-[#374151]'
                      : 'text-[7px] text-[#9CA3AF]'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          {/* Week bands */}
          <div className="mt-1 flex gap-[2px]">
            {Array.from({ length: Math.ceil(dayCount / 7) }, (_, w) => {
              const start = w * 7;
              const span = Math.min(7, dayCount - start);
              return (
                <div
                  key={w}
                  className="text-center text-[8px] font-medium uppercase tracking-wide text-[#6B7280]"
                  style={{ flex: span }}
                >
                  Week {weekOfPeriod(start)}
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-[#9CA3AF]">
          Daily download (GB) · day of month + week · {d.periodRangeLabel}
        </p>
      </div>

      <div className="mx-10 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-xs">
        <p className="font-semibold">Device identity</p>
        <p className="mt-1 text-[#374151]">
          {d.device.name} · {d.device.model} · SN {d.device.serial} · Group {d.device.group} ·{' '}
          {d.device.status}
        </p>
      </div>

      <div className="space-y-4 px-10 py-5">
        <h2 className="text-sm font-semibold">
          Unjani Wi-Fi breakdown{' '}
          <span className="font-normal text-[#6B7280]">(separate sources — do not sum)</span>
        </h2>

        <section className="rounded border-2 border-[#F5831F] bg-amber-50 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-800">
              Staff Wi-Fi — not displaying (critical gap)
            </h3>
            <p className="text-xs text-amber-700">SSID: {d.staffWifi.ssids.join(', ')}</p>
          </div>
          <p className="mt-2 text-sm font-medium text-amber-900">{d.staffWifi.whyCritical}</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Why this section is empty
          </p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-[11px] text-amber-950/80">
            {d.staffWifi.whyMissing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Unlock checklist
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-amber-950/80">
            {d.staffWifi.unlockChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-[#E5E7EB] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">Patient Free Wi-Fi</h3>
            <p className="text-xs text-[#6B7280]">{d.patientWifi.source}</p>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-[#6B7280]">Unique users</dt>
              <dd className="mt-1 font-semibold">
                {d.patientWifi.uniqueUsers.toLocaleString('en-ZA')}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-[#6B7280]">Login sessions</dt>
              <dd className="mt-1 font-semibold">
                {d.patientWifi.loginSessions.toLocaleString('en-ZA')}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-[#6B7280]">Download</dt>
              <dd className="mt-1 font-semibold">{fmtGb(d.patientWifi.downloadGb)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[10px] leading-relaxed text-[#9CA3AF]">{d.patientWifi.footnote}</p>
          <p className="mt-2 text-[11px] font-medium text-amber-800">
            Patient figures alone cannot explain Staff load — Staff instrumentation above is
            required to compare the two.
          </p>
        </section>
      </div>

      <footer className="mt-auto border-t border-[#E5E7EB] px-10 py-4 text-[10px] text-[#9CA3AF]">
        CircleTel · {d.siteCode} · Generated {d.generatedAtLabel} · Do not sum Patient + Staff + BNG
        · Page 1 of 1
      </footer>
    </article>
  );
}

export default VariantA;
