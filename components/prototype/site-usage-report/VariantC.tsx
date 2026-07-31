/**
 * PROTOTYPE Variant C — Dual-source narrative.
 * Question: should Unjani Staff/Patient framing lead, with BNG core traffic as supporting proof?
 */
import Image from 'next/image';
import { MOCK_SITE_USAGE_REPORT as d } from './mock-data';

function fmtGb(n: number) {
  return `${n.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} GB`;
}

export function VariantC() {
  return (
    <article className="mx-auto w-[210mm] min-h-[297mm] bg-[#FAFAF8] text-[#1C1917] shadow-xl print:shadow-none">
      <div className="bg-[#1C1917] px-10 py-8 text-[#FAFAF8]">
        <div className="flex items-start justify-between">
          <Image
            src="/images/circletel-logo-white.png"
            alt="CircleTel"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
          />
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#F5831F]">
            Prototype sample
          </p>
        </div>
        <h1 className="mt-6 max-w-md font-serif text-3xl leading-tight tracking-tight">
          {d.siteName}
        </h1>
        <p className="mt-2 text-sm text-stone-300">
          Site Network Usage Report · {d.periodLabel} · {d.timezone}
        </p>
        <p className="mt-1 text-xs text-stone-500">Generated {d.generatedAt}</p>
      </div>

      <section className="border-b border-stone-200 px-10 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          How to read this report
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
          CircleTel core connectivity, Staff Wi-Fi, and Patient Free Wi-Fi are separate sources.
          Numbers must not be added together. Patient figures come from a TDX export when available;
          Staff period GB stays unavailable until SSID session-byte instrumentation ships.
        </p>
      </section>

      <section className="px-10 py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl">1. Patient Free Wi-Fi</h2>
          <span className="text-xs text-stone-500">{d.patientWifi.source}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-6 border-y border-stone-200 py-5">
          <div>
            <p className="font-serif text-4xl">{d.patientWifi.uniqueUsers.toLocaleString('en-ZA')}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">Unique users</p>
          </div>
          <div>
            <p className="font-serif text-4xl">
              {d.patientWifi.loginSessions.toLocaleString('en-ZA')}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">Login sessions</p>
          </div>
          <div>
            <p className="font-serif text-4xl">{fmtGb(d.patientWifi.downloadGb)}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">Download</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">{d.patientWifi.footnote}</p>
      </section>

      <section className="px-10 py-6">
        <h2 className="font-serif text-xl">2. Staff Wi-Fi</h2>
        <div className="mt-3 border-l-4 border-[#F5831F] bg-white px-5 py-4">
          <p className="text-base font-semibold">{d.staffWifi.statusLabel}</p>
          <p className="mt-2 text-sm text-stone-600">
            Target SSID: <span className="font-medium">{d.staffWifi.ssids[0]}</span>. Live client
            rates on the AP are not period usage.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-stone-500">
            {d.staffWifi.unlockChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-10 py-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl">3. Core site connectivity</h2>
          <span className="text-xs text-stone-500">Primary: {d.primarySource}</span>
        </div>
        <table className="mt-4 w-full text-left text-sm">
          <tbody>
            {[
              ['Download', fmtGb(d.coreTraffic.downloadGb)],
              ['Upload', fmtGb(d.coreTraffic.uploadGb)],
              ['Average rate', `${d.coreTraffic.avgDownKbps} / ${d.coreTraffic.avgUpKbps} Kbps`],
              ['Peak download bucket', `${d.coreTraffic.peakBucketMb} MB`],
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-stone-200">
                <th className="py-2 font-normal text-stone-500">{k}</th>
                <td className="py-2 text-right font-medium">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-stone-500">{d.coreTraffic.note}</p>
        <p className="mt-4 text-xs text-stone-600">
          Device: {d.device.name} · {d.device.model} · SN {d.device.serial} · {d.device.group}
        </p>
      </section>

      <footer className="mt-4 border-t border-stone-200 px-10 py-4 text-[10px] text-stone-400">
        {d.siteCode} · {d.accountName} · CircleTel admin report · Page 1 of 1
      </footer>
    </article>
  );
}

export default VariantC;
