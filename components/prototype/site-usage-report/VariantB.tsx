/**
 * PROTOTYPE Variant B — Executive dashboard sheet.
 * Question: should KPIs and the chart dominate, with Unjani dual-source as a bottom strip?
 */
import Image from 'next/image';
import { MOCK_SITE_USAGE_REPORT as d } from './mock-data';

function fmtGb(n: number) {
  return `${n.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} GB`;
}

export function VariantB() {
  const maxDay = Math.max(...d.dailyDownloadGb);
  return (
    <article className="mx-auto w-[210mm] min-h-[297mm] bg-[#111827] text-white shadow-xl print:shadow-none">
      <header className="flex items-center justify-between px-10 pb-6 pt-8">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-white p-2">
            <Image
              src="/images/circletel-enclosed-logo.png"
              alt="CircleTel"
              width={56}
              height={56}
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5831F]">
              Usage · {d.corporateCode}
            </p>
            <h1 className="text-2xl font-bold">{d.siteName}</h1>
          </div>
        </div>
        <div className="text-right text-sm text-gray-300">
          <p className="text-base font-semibold text-white">{d.periodLabel}</p>
          <p className="text-xs text-gray-400">{d.periodRangeLabel} · {d.timezoneShort}</p>
          <p>Generated {d.generatedAtLabel}</p>
          <p className="text-[10px] text-[#F5831F]">PROTOTYPE — not production</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 px-10">
        {[
          { label: 'Downloaded', value: fmtGb(d.coreTraffic.downloadGb), sub: d.primarySource },
          { label: 'Uploaded', value: fmtGb(d.coreTraffic.uploadGb), sub: 'BNG aggregate' },
          {
            label: 'Avg rate',
            value: `${d.coreTraffic.avgDownKbps} / ${d.coreTraffic.avgUpKbps}`,
            sub: 'Kbps down / up',
          },
          {
            label: 'Busiest bucket',
            value: `${d.coreTraffic.peakBucketMb} MB`,
            sub: 'Peak interval download',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-[#1F2937] px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">{kpi.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{kpi.value}</p>
            <p className="mt-1 text-xs text-gray-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <section className="px-10 py-6">
        <div className="rounded-xl bg-[#1F2937] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Device traffic shape — period</h2>
            <p className="text-xs text-gray-400">
              {d.device.name} · {d.device.serial}
            </p>
          </div>
          <div className="flex h-36 items-end gap-1">
            {d.dailyDownloadGb.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-[#F5831F] to-[#FBBF24]"
                style={{ height: `${Math.max(6, (v / maxDay) * 100)}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">{d.coreTraffic.note}</p>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_1.2fr] gap-3 px-10 pb-8">
        <div className="rounded-xl border border-white/10 bg-[#1F2937] p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#F5831F]">Staff Wi-Fi</p>
          <p className="mt-2 text-3xl font-semibold text-white">{fmtGb(d.staffWifi.totalGb)}</p>
          <p className="mt-1 text-xs text-gray-400">
            ↓ {fmtGb(d.staffWifi.downloadGb)} · ↑ {fmtGb(d.staffWifi.uploadGb)}
          </p>
          <p className="mt-3 text-[10px] leading-relaxed text-gray-500">{d.staffWifi.footnote}</p>
        </div>
        <div className="rounded-xl bg-[#1F2937] p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#F5831F]">Patient Free Wi-Fi</p>
          <div className="mt-3 flex gap-6">
            <div>
              <p className="text-2xl font-semibold">{d.patientWifi.uniqueUsers.toLocaleString('en-ZA')}</p>
              <p className="text-xs text-gray-400">users</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {d.patientWifi.loginSessions.toLocaleString('en-ZA')}
              </p>
              <p className="text-xs text-gray-400">sessions</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{fmtGb(d.patientWifi.downloadGb)}</p>
              <p className="text-xs text-gray-400">download</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-gray-500">{d.patientWifi.footnote}</p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-10 py-4 text-[10px] text-gray-500">
        CircleTel branded usage sheet · {d.siteCode} · layers are separate sources · Page 1 of 1
      </footer>
    </article>
  );
}

export default VariantB;
