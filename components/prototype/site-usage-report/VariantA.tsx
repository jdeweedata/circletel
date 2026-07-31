/**
 * PROTOTYPE Variant A — Classic document (invoice-like hierarchy).
 * Question: does a traditional branded PDF feel right for monthly site usage?
 */
import Image from 'next/image';
import { MOCK_SITE_USAGE_REPORT as d } from './mock-data';

function fmtGb(n: number) {
  return `${n.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} GB`;
}

export function VariantA() {
  const maxDay = Math.max(...d.dailyDownloadGb);
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
            <p className="mt-1 text-sm text-[#6B7280]">Generated {d.generatedAt}</p>
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Period</p>
          <p className="mt-1 text-lg font-semibold">{d.periodLabel}</p>
          <p className="text-[#6B7280]">
            {d.periodStart} → {d.periodEnd} ({d.timezone})
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
        <div className="flex h-24 items-end gap-[2px] rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2">
          {d.dailyDownloadGb.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-[#F5831F]/60"
              style={{ height: `${Math.max(8, (v / maxDay) * 100)}%` }}
              title={`Day ${i + 1}: ${v} GB`}
            />
          ))}
        </div>
        <p className="mt-1 text-[10px] text-[#9CA3AF]">Daily download (GB) — placeholder series</p>
      </div>

      <div className="mx-10 rounded border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-xs">
        <p className="font-semibold">Device identity</p>
        <p className="mt-1 text-[#374151]">
          {d.device.name} · {d.device.model} · SN {d.device.serial} · Group {d.device.group} ·{' '}
          {d.device.status}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 px-10 py-5">
        <section className="rounded border border-dashed border-[#D1D5DB] p-4">
          <h3 className="text-sm font-semibold">Staff Wi-Fi</h3>
          <p className="mt-2 text-sm font-medium text-[#B45309]">{d.staffWifi.statusLabel}</p>
          <p className="mt-1 text-xs text-[#6B7280]">SSID: {d.staffWifi.ssids.join(', ')}</p>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-[11px] text-[#6B7280]">
            {d.staffWifi.unlockChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-[#9CA3AF]">
            Source: CircleTel radio (SSID period bytes) — not available for this period.
          </p>
        </section>

        <section className="rounded border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-semibold">Patient Free Wi-Fi</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#6B7280]">Unique users</dt>
              <dd className="font-semibold">{d.patientWifi.uniqueUsers.toLocaleString('en-ZA')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#6B7280]">Login sessions</dt>
              <dd className="font-semibold">{d.patientWifi.loginSessions.toLocaleString('en-ZA')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#6B7280]">Download</dt>
              <dd className="font-semibold">{fmtGb(d.patientWifi.downloadGb)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[10px] leading-relaxed text-[#9CA3AF]">{d.patientWifi.footnote}</p>
        </section>
      </div>

      <footer className="mt-auto border-t border-[#E5E7EB] px-10 py-4 text-[10px] text-[#9CA3AF]">
        CircleTel · Admin Site Network Usage Report · {d.siteCode} · Do not sum Patient + Staff + BNG
        layers · Page 1 of 1
      </footer>
    </article>
  );
}

export default VariantA;
