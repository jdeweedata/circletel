import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PiArrowRightBold,
  PiCheckCircleFill,
  PiWifiHighBold,
  PiSimCardBold,
  PiLockKeyBold,
  PiDesktopBold,
  PiReceiptBold,
  PiWrenchBold,
  PiFlagBold,
  PiCalendarCheckBold,
} from 'react-icons/pi';
import { FAQAccordion } from '@/components/business-complete';

export const metadata: Metadata = {
  title: 'Business Complete — Fixed Wireless + 5G Failover + Voice | CircleTel',
  description:
    'One bundle. SkyFibre fixed wireless broadband, automatic MTN 5G failover, and business voice — from R1,798/mo excl. VAT. Free installation on 24-month contracts.',
  openGraph: {
    title: 'Business Complete — CircleTel',
    description:
      'Fixed wireless broadband + 5G auto-failover + voice. From R1,798/mo. Free install on 24 months.',
  },
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    className={className ?? 'w-3 h-3'}
    aria-hidden
  >
    <path
      d="M10 3L5 9L2 6"
      stroke="#12B76A"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DashIcon = () => (
  <span className="inline-block w-3 text-center text-[#98A2B3] font-bold">–</span>
);

export default function BusinessCompletePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#101828]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative bg-[#1B2A4A] overflow-hidden py-24 md:py-32 px-4 text-center">
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Orange glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,122,30,.12) 0%, transparent 100%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-semibold border border-[rgba(232,122,30,.35)] bg-[rgba(232,122,30,.1)] text-[#FDB981] mb-6">
            Business Complete Bundle
          </span>

          <h1 className="font-display text-[clamp(2.125rem,5vw,3.5rem)] font-bold text-white leading-[1.1] tracking-[-0.025em] mb-5">
            Fixed wireless, 5G failover,<br />
            and voice — <em className="text-[#E87A1E] not-italic">one bill.</em>
          </h1>

          <p className="text-[1.0625rem] leading-7 text-white/65 max-w-lg mx-auto mb-10">
            SkyFibre FWB primary link with automatic MTN 5G failover in under 30 seconds. Add voice lines, IoT SIMs, and fleet tracking as your business grows.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/#coverage"
              className="inline-flex items-center gap-2 bg-[#E87A1E] hover:bg-[#C45A30] text-white font-semibold text-[15px] px-6 py-3 rounded-xl transition-colors shadow-sm"
            >
              Check Coverage
              <PiArrowRightBold className="w-4 h-4" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white/90 font-semibold text-[15px] px-6 py-3 rounded-xl transition-colors"
            >
              See Plans & Pricing
            </Link>
            <a
              href="https://wa.me/27824873900"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold text-[15px] px-6 py-3 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center mt-14 pt-8 border-t border-white/8">
            {[
              { num: '<30s', accent: '30s', label: 'Auto failover time' },
              { num: '99.9%', accent: '9%', label: 'Enterprise uptime SLA' },
              { num: 'R0', accent: 'R0', label: 'Installation (24-mo contract)' },
              { num: '1 bill', accent: 'bill', label: 'Fibre + backup + voice' },
            ].map((s) => (
              <div key={s.label} className="flex-1 min-w-[120px] px-5 py-1 text-center border-r border-white/8 last:border-r-0">
                <span className="block font-display text-[1.875rem] font-bold text-white leading-none mb-1">
                  {s.num.replace(s.accent, '')}<span className="text-[#E87A1E]">{s.accent}</span>
                </span>
                <span className="text-[11px] text-white/50 leading-snug">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────── */}
      <div className="bg-white border-y border-[#EAECF0] py-3">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-2">
          {[
            'Free installation on 24-month contracts',
            'Static IP included — no add-on fee',
            'No FUP on primary connection',
            'Month-to-month available — no lock-in',
            'Single South African support team',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px] text-[#344054] font-medium">
              <CheckIcon className="w-3 h-3 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FDF2E9] text-[#AE5B16] text-[12px] font-semibold tracking-wide uppercase mb-3">
              Pricing
            </span>
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold text-[#101828] leading-[1.2] tracking-tight mb-3">
              Choose your bundle
            </h2>
            <p className="text-[#475467] text-[1.0625rem] max-w-lg mx-auto">
              Three tiers built around your team size and uptime requirements. Auto failover and static IP on every plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Essential */}
            <PricingCard
              name="Essential"
              price="1,798"
              vatPrice="2,068"
              speed="50 Mbps fixed wireless"
              cta="Get started"
              ctaVariant="outline"
              features={[
                { text: 'SkyFibre Business 50 (50/12.5 Mbps)', included: true },
                { text: 'MTN 5G backup — auto-failover <30s', included: true },
                { text: 'Static IP address included', included: true },
                { text: 'Business-grade MikroTik router', included: true },
                { text: 'Tarana CPE installed free', included: true },
                { text: 'Voice services', included: false },
                { text: 'Weekend support', included: false },
                { text: 'SLA uptime guarantee', included: false },
              ]}
            />

            {/* Professional — featured */}
            <PricingCard
              name="Professional"
              price="2,547"
              vatPrice="2,929"
              speed="100 Mbps fixed wireless"
              cta="Get started"
              ctaVariant="fill"
              featured
              features={[
                { text: 'SkyFibre Business 100 (100/25 Mbps)', included: true },
                { text: 'MTN 5G backup — auto-failover <30s', included: true },
                { text: 'Static IP address included', included: true },
                { text: 'Business-grade MikroTik router', included: true },
                { text: 'Tarana CPE installed free', included: true },
                { text: 'MTN Voice Standard (1 line)', included: true },
                { text: '99.5% uptime SLA + service credits', included: true },
                { text: 'Mon–Sat 7am–7pm · 4-hour response', included: true },
              ]}
            />

            {/* Enterprise */}
            <PricingCard
              name="Enterprise"
              price="3,822"
              vatPrice="4,395"
              speed="200 Mbps fixed wireless"
              cta="Get started"
              ctaVariant="outline"
              features={[
                { text: 'SkyFibre Business 200 (200/50 Mbps)', included: true },
                { text: 'MTN 5G Enterprise backup (100+ Mbps)', included: true },
                { text: 'Static IP address included', included: true },
                { text: 'Business-grade MikroTik router', included: true },
                { text: 'Tarana CPE installed free', included: true },
                { text: 'MTN Voice Premium (multi-line)', included: true },
                { text: '99.9% uptime SLA + 15%/hr credits', included: true },
                { text: '24/7 support · 2-hour response · Named AM', included: true },
              ]}
            />
          </div>

          <p className="text-center text-[13px] text-[#667085] mt-6">
            All prices in ZAR excl. VAT.{' '}
            <strong className="text-[#344054]">Free installation</strong> on 24-month contracts (saves R2,000). Month-to-month available at 10% premium.
          </p>
        </div>
      </section>

      {/* ── EVERY PLAN INCLUDES ──────────────────────────────────── */}
      <section className="bg-white border-y border-[#EAECF0] py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Eyebrow>Every plan includes</Eyebrow>
            <SectionTitle>Everything your office needs from day one</SectionTitle>
            <SectionSub>No hidden add-ons. No surprises on your first invoice. These come standard.</SectionSub>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: PiWifiHighBold, title: 'Fixed Wireless Broadband', desc: 'Tarana G1 FWB technology. Uncapped, no fair-use policy. Sub-20ms latency for cloud tools and VoIP.' },
              { Icon: PiSimCardBold, title: 'Auto 5G Failover', desc: 'MTN 5G/LTE backup activates automatically in under 30 seconds. Your team won\'t notice the switch.' },
              { Icon: PiLockKeyBold, title: 'Static IP Address', desc: 'Required for VPNs, POS systems, and remote desktop access. Included on every tier — no extras.' },
              { Icon: PiDesktopBold, title: 'Hardware & Install', desc: 'MikroTik router + Tarana CPE supplied and professionally installed. Free on 24-month contracts.' },
              { Icon: PiReceiptBold, title: 'Single Monthly Invoice', desc: 'Connectivity, backup, and voice on one line item. One account manager. One support number.' },
              { Icon: PiWrenchBold, title: 'Remote Monitoring', desc: 'We monitor both links 24/7. If something fails, we know before you do and start working immediately.' },
              { Icon: PiFlagBold, title: 'South African Support', desc: 'Local team. No overseas call centres. Your technician knows your setup and your area.' },
              { Icon: PiCalendarCheckBold, title: 'Month-to-Month Option', desc: 'Not ready to commit to 24 months? MTM is available at a 10% premium. No lock-in required.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FDF2E9] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#E87A1E]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#101828] text-[15px] mb-1">{title}</h4>
                  <p className="text-[13px] text-[#475467] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTO FAILOVER ────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Eyebrow>Auto Failover</Eyebrow>
              <h2 className="font-display text-[1.875rem] md:text-[2.25rem] font-bold text-[#101828] leading-[1.2] tracking-tight mt-2 mb-4">
                Your office never goes offline
              </h2>
              <p className="text-[#667085] text-[1.0625rem] leading-7 mb-6">
                When the primary fixed wireless link has an issue, your 5G backup connection takes over automatically — in under 30 seconds. No manual intervention. No downtime.
              </p>
              <ul className="space-y-3">
                {[
                  'Both connections are active simultaneously — no delay when switching',
                  'VoIP calls and VPNs stay connected through a failover event',
                  'Monitored remotely — we know before you do and act immediately',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[#344054] text-[15px]">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#ECFDF3] flex items-center justify-center shrink-0">
                      <CheckIcon />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Failover diagram */}
            <div className="bg-white border border-[#EAECF0] rounded-2xl p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-[#F2F4F7] rounded-xl p-4">
                  <div className="text-[13px] font-semibold text-[#101828] mb-0.5">🗼 Tarana FWB</div>
                  <div className="text-[11px] text-[#667085]">Primary — 50–200 Mbps</div>
                </div>
                <span className="text-[#98A2B3] text-lg">→</span>
                <div className="flex-1 bg-[#FDF2E9] rounded-xl p-4">
                  <div className="text-[13px] font-semibold text-[#101828] mb-0.5">🔀 Smart Router</div>
                  <div className="text-[11px] text-[#667085]">Detects &amp; switches</div>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ECFDF3] text-[#027A48] text-[12px] font-semibold">
                  <CheckIcon className="w-3 h-3" />
                  Failover in &lt;30 seconds
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-[#F2F4F7] rounded-xl p-4">
                  <div className="text-[13px] font-semibold text-[#101828] mb-0.5">📡 MTN 5G Network</div>
                  <div className="text-[11px] text-[#667085]">Backup — always active</div>
                </div>
                <span className="text-[#98A2B3] text-lg">→</span>
                <div className="flex-1 bg-[#EEF4FF] rounded-xl p-4">
                  <div className="text-[13px] font-semibold text-[#101828] mb-0.5">🏢 Your Office</div>
                  <div className="text-[11px] text-[#667085]">Always connected</div>
                </div>
              </div>

              <p className="text-center text-[11px] text-[#98A2B3]">
                Primary SkyFibre + MTN 5G backup running in parallel at all times
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-white border-y border-[#EAECF0] py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Eyebrow>Setup</Eyebrow>
            <SectionTitle>Up and running in under a week</SectionTitle>
            <SectionSub>From coverage check to live internet — our team handles everything. No IT contractor required.</SectionSub>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Check Coverage',
                desc: 'Enter your business address. We verify Tarana FWB signal availability at your exact location in real time.',
                time: '2 minutes',
              },
              {
                num: '02',
                title: 'Choose & Order',
                desc: 'Select your tier, sign the contract online. Installation is scheduled within 5 business days of approval.',
                time: 'Same day',
              },
              {
                num: '03',
                title: 'Go Live',
                desc: 'Our tech installs the Tarana CPE, configures the MikroTik router with 5G failover, and hands over in ~2.5 hours.',
                time: '~2.5 hours on site',
              },
            ].map((step) => (
              <div key={step.num} className="bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl p-6">
                <span className="inline-block font-display text-[13px] font-bold text-[#E87A1E] tracking-widest mb-3">
                  {step.num}
                </span>
                <h3 className="font-display text-[1.125rem] font-semibold text-[#101828] mb-2">{step.title}</h3>
                <p className="text-[13px] text-[#475467] leading-relaxed mb-4">{step.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#667085] bg-white border border-[#EAECF0] px-3 py-1 rounded-full">
                  ⏱ {step.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH SPECS ───────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <Eyebrow>Technical</Eyebrow>
            <SectionTitle>Network specifications</SectionTitle>
            <SectionSub>What's running under the hood on every Business Complete installation.</SectionSub>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Primary */}
            <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 bg-[#F9FAFB] border-b border-[#EAECF0] px-5 py-4">
                <span className="text-lg">🌐</span>
                <h3 className="font-display font-semibold text-[15px] text-[#101828]">Primary — SkyFibre Fixed Wireless</h3>
              </div>
              <table className="w-full text-[13px]">
                <tbody>
                  {[
                    ['Technology', 'Tarana G1 FWB'],
                    ['Speed profile', 'Asymmetric 4:1 (down/up)'],
                    ['Latency', '<20ms typical'],
                    ['Data cap', 'Uncapped — no FUP'],
                    ['Contention', '4:1'],
                    ['Essential tier', '50 Mbps / 12.5 Mbps'],
                    ['Professional tier', '100 Mbps / 25 Mbps'],
                    ['Enterprise tier', '200 Mbps / 50 Mbps'],
                  ].map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                      <td className="px-5 py-2.5 text-[#667085]">{label}</td>
                      <td className="px-5 py-2.5 text-[#101828] font-medium text-right">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Backup */}
            <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 bg-[#F9FAFB] border-b border-[#EAECF0] px-5 py-4">
                <span className="text-lg">📡</span>
                <h3 className="font-display font-semibold text-[15px] text-[#101828]">Backup — MTN 5G / LTE</h3>
              </div>
              <table className="w-full text-[13px]">
                <tbody>
                  {[
                    ['Technology', 'MTN 5G / LTE'],
                    ['Speed', 'Best effort'],
                    ['Latency', '<30ms typical'],
                    ['Failover time', '<30 seconds'],
                    ['Data cap', '500 GB – 1.5 TB FUP'],
                    ['Essential', '35 Mbps (5G Essential)'],
                    ['Professional', '35 Mbps (5G Essential)'],
                    ['Enterprise', '100+ Mbps (5G Enterprise)'],
                  ].map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                      <td className="px-5 py-2.5 text-[#667085]">{label}</td>
                      <td className="px-5 py-2.5 text-[#101828] font-medium text-right">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── ADD-ONS ──────────────────────────────────────────────── */}
      <section id="addons" className="bg-white border-y border-[#EAECF0] py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <Eyebrow>Add-on Modules</Eyebrow>
            <SectionTitle>Customise your bundle</SectionTitle>
            <SectionSub>Bolt on exactly what your business needs. Available on any tier, activated on your next bill.</SectionSub>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🚗', title: 'Fleet M2M SIM', desc: 'Vehicle tracking SIM. Plug into your GPS fleet management system.', price: 'R199' },
              { icon: '📞', title: 'Additional Voice Line', desc: 'Extra MTN business voice line for growing teams and reception desks.', price: 'R349' },
              { icon: '🔌', title: 'IoT Sensor Pack', desc: '5× IoT SIMs for smart devices, alarms, environmental sensors.', price: 'R399' },
              { icon: '🔒', title: 'Static IP on MTN Backup', desc: 'Dedicated static IP on your backup line — for VPNs and remote desktop.', price: 'R149' },
              { icon: '🛡️', title: 'Enhanced SLA', desc: '99.5% uptime guarantee with service credits if we fall short.', price: 'R249' },
              { icon: '⚡', title: 'Premium SLA', desc: '99.9% uptime + 24/7 support + 15%/hr service credits. Enterprise-grade.', price: 'R499' },
            ].map(({ icon, title, desc, price }) => (
              <div key={title} className="flex gap-4 bg-[#F9FAFB] border border-[#EAECF0] rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#EAECF0] flex items-center justify-center shrink-0 text-lg shadow-[0_1px_2px_rgba(16,24,40,.05)]">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[14px] text-[#101828] mb-1">{title}</h4>
                  <p className="text-[12px] text-[#667085] leading-relaxed mb-2">{desc}</p>
                  <span className="text-[13px] font-bold text-[#101828]">
                    {price}<span className="text-[#98A2B3] font-normal">/mo</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SLA TABLE ────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <Eyebrow>SLA & Support</Eyebrow>
            <SectionTitle>Service level comparison</SectionTitle>
            <SectionSub>Know exactly what you're buying before you sign.</SectionSub>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-[#EAECF0] rounded-2xl overflow-hidden text-[13px] bg-white shadow-sm">
              <thead>
                <tr className="bg-[#F9FAFB] text-[#344054] text-[13px] font-semibold">
                  <th className="text-left px-5 py-3.5 border-b border-[#EAECF0]">Parameter</th>
                  <th className="text-center px-4 py-3.5 border-b border-[#EAECF0]">Essential</th>
                  <th className="text-center px-4 py-3.5 border-b border-[#EAECF0] bg-[#1B2A4A] text-white">Professional</th>
                  <th className="text-center px-4 py-3.5 border-b border-[#EAECF0]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Uptime guarantee', essential: 'Best effort', professional: '99.5%', enterprise: '99.9%', enterpriseBold: true },
                  { label: 'Support hours', essential: 'Mon–Fri 8am–5pm', professional: 'Mon–Sat 7am–7pm', enterprise: '24 / 7', enterpriseBold: true },
                  { label: 'Response time', essential: '8 hours', professional: '4 hours', enterprise: '2 hours', enterpriseBold: true },
                  { label: 'Service credits', essential: null, professional: 'check', enterprise: 'check' },
                  { label: 'Credit rate', essential: null, professional: '10%/hr downtime', enterprise: '15%/hr downtime', enterpriseBold: true },
                  { label: 'Voice included', essential: null, professional: '1 line standard', enterprise: 'Multi-line premium', enterpriseBold: true },
                  { label: 'Named account manager', essential: null, professional: null, enterprise: 'check' },
                  { label: '5G backup tier', essential: 'Essential (35 Mbps)', professional: 'Essential (35 Mbps)', enterprise: 'Enterprise (100+ Mbps)', enterpriseBold: true },
                ].map(({ label, essential, professional, enterprise, enterpriseBold }, i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                    <td className="px-5 py-3 text-[#475467]">{label}</td>
                    <td className="px-4 py-3 text-center text-[#475467]">
                      {essential === null ? <DashIcon /> : essential}
                    </td>
                    <td className="px-4 py-3 text-center bg-[#1B2A4A]/5 border-x border-[#1B2A4A]/8">
                      {professional === null
                        ? <DashIcon />
                        : professional === 'check'
                        ? <span className="flex justify-center"><CheckIcon /></span>
                        : <span className="font-medium text-[#1B2A4A]">{professional}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {enterprise === null
                        ? <DashIcon />
                        : enterprise === 'check'
                        ? <span className="flex justify-center"><CheckIcon /></span>
                        : <span className={enterpriseBold ? 'font-semibold text-[#101828]' : 'text-[#475467]'}>{enterprise}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── COMPETITIVE COMPARISON ───────────────────────────────── */}
      <section className="bg-white border-y border-[#EAECF0] py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <Eyebrow>Why CircleTel</Eyebrow>
            <SectionTitle>How we compare</SectionTitle>
            <SectionSub>Professional tier vs comparable offerings from Vox and Afrihost.</SectionSub>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-[#EAECF0] rounded-2xl overflow-hidden text-[13px] shadow-sm">
              <thead>
                <tr className="bg-[#F9FAFB] text-[#344054] font-semibold">
                  <th className="text-left px-5 py-3.5 border-b border-[#EAECF0]">Feature</th>
                  <th className="text-center px-4 py-3.5 border-b border-[#EAECF0] bg-[#1B2A4A] text-white">CircleTel Professional</th>
                  <th className="text-center px-4 py-3.5 border-b border-[#EAECF0] bg-white">Vox Business</th>
                  <th className="text-center px-4 py-3.5 border-b border-[#EAECF0] bg-white">Afrihost Business</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: 'Monthly price (excl. VAT)',
                    us: 'R2,547',
                    vox: 'R2,447',
                    af: 'R1,947',
                    usCheck: true,
                  },
                  {
                    label: 'Auto failover (5G backup)',
                    us: 'Included',
                    vox: 'Add-on',
                    af: '✕ Not available',
                    usCheck: true,
                    afLose: true,
                  },
                  {
                    label: 'Static IP',
                    us: 'Included free',
                    vox: 'R50/mo extra',
                    af: 'R75/mo extra',
                    usCheck: true,
                  },
                  {
                    label: 'Voice lines',
                    us: 'Included on Pro+',
                    vox: 'Add-on',
                    af: 'Separate provider',
                    usCheck: true,
                    afLose: true,
                  },
                  {
                    label: 'Month-to-month option',
                    us: 'Available (+10%)',
                    vox: '24-mo lock-in',
                    af: '24-mo lock-in',
                    usCheck: true,
                  },
                  {
                    label: 'Single vendor invoice',
                    us: 'Yes',
                    vox: 'Multiple',
                    af: 'Multiple',
                    usCheck: true,
                    voxLose: true,
                    afLose: true,
                  },
                ].map(({ label, us, vox, af, usCheck, voxLose, afLose }, i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                    <td className="px-5 py-3 text-[#475467]">{label}</td>
                    <td className="px-4 py-3 text-center bg-[#1B2A4A]/5 border-x border-[#1B2A4A]/8">
                      {usCheck ? (
                        <span className="inline-flex items-center justify-center gap-1 font-medium text-[#027A48]">
                          <CheckIcon /> {us}
                        </span>
                      ) : us}
                    </td>
                    <td className={`px-4 py-3 text-center ${voxLose ? 'text-[#F04438]' : 'text-[#475467]'}`}>{vox}</td>
                    <td className={`px-4 py-3 text-center ${afLose ? 'text-[#F04438]' : 'text-[#475467]'}`}>{af}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-[#98A2B3] mt-4">
            * Pricing sourced from public rate cards. Vox and Afrihost prices exclude 5G backup which is quoted separately.
          </p>
        </div>
      </section>

      {/* ── TARGET VERTICALS ─────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <Eyebrow>Who it&apos;s for</Eyebrow>
            <SectionTitle>Built for South African SMEs</SectionTitle>
            <SectionSub>Designed around the connectivity needs of offices that can&apos;t afford downtime.</SectionSub>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#344054" strokeWidth="1.75" aria-hidden>
                    <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                ),
                title: 'Professional Services',
                desc: 'Law firms, accounting practices, and consultancies depend on always-on connectivity for cloud tools, client portals, and video calls.',
                badge: 'Essential · Professional',
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#344054" strokeWidth="1.75" aria-hidden>
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: 'Healthcare',
                desc: 'Clinics, pharmacies, and medical practices need stable, low-latency connections for patient systems and remote consultations.',
                badge: 'Professional · Enterprise',
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#344054" strokeWidth="1.75" aria-hidden>
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                ),
                title: 'Retail & Hospitality',
                desc: 'Static IP and failover keep POS systems and online ordering platforms running through loadshedding and network disruptions.',
                badge: 'Essential · Professional',
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#344054" strokeWidth="1.75" aria-hidden>
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                title: 'Light Industrial',
                desc: 'IoT sensors, ERP systems, and remote equipment monitoring need reliable primary and backup connectivity.',
                badge: 'Professional · Enterprise',
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#344054" strokeWidth="1.75" aria-hidden>
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                ),
                title: 'Education',
                desc: 'Schools and training centres with multiple active users benefit from the higher-throughput Professional and Enterprise tiers.',
                badge: 'Professional · Enterprise',
              },
              {
                icon: (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#344054" strokeWidth="1.75" aria-hidden>
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
                title: 'Mixed-Use Office',
                desc: 'Buildings with multiple tenants or co-working spaces can be served across different tiers from a single Tarana installation.',
                badge: 'All tiers',
              },
            ].map(({ icon, title, desc, badge }) => (
              <div key={title} className="bg-white border border-[#EAECF0] rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h4 className="font-semibold text-[15px] text-[#101828] mb-1.5">{title}</h4>
                <p className="text-[13px] text-[#475467] leading-relaxed mb-4">{desc}</p>
                <span className="inline-block bg-[#F2F4F7] text-[#344054] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-[#EAECF0] py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <Eyebrow>FAQ</Eyebrow>
            <SectionTitle>Frequently asked questions</SectionTitle>
            <p className="text-[#475467] text-[1.0625rem] mt-2">
              Still unsure?{' '}
              <a
                href="https://wa.me/27824873900"
                className="text-[#AE5B16] font-semibold hover:underline"
              >
                WhatsApp us
              </a>{' '}
              and we'll answer in plain English.
            </p>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── COVERAGE CTA ─────────────────────────────────────────── */}
      <section id="coverage" className="bg-[#1B2A4A] py-20 md:py-28 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-[rgba(232,122,30,.15)] text-[#FDB981] text-[12px] font-semibold tracking-wide uppercase mb-4">
            Coverage Check
          </span>
          <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold text-white leading-[1.2] tracking-tight mb-3">
            Does your area qualify<br />
            <em className="text-[#E87A1E] not-italic">for Business Complete?</em>
          </h2>
          <p className="text-white/60 text-[1.0625rem] mb-8">
            Enter your business address. We'll confirm Tarana FWB availability and the right tier for your building.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-xl p-1.5 shadow-[0_24px_48px_-12px_rgba(16,24,40,.35)]">
            <input
              type="text"
              placeholder="Your business address…"
              className="flex-1 px-4 py-3 rounded-lg text-[#101828] text-[15px] placeholder:text-[#98A2B3] outline-none bg-transparent"
            />
            <Link
              href="/#coverage"
              className="inline-flex items-center justify-center gap-2 bg-[#E87A1E] hover:bg-[#C45A30] text-white font-semibold text-[15px] px-5 py-3 rounded-lg transition-colors shrink-0"
            >
              Check Coverage
              <PiArrowRightBold className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-5 text-white/40 text-[13px]">
            Or chat with us directly —{' '}
            <a
              href="https://wa.me/27824873900"
              className="text-[#FDB981] hover:underline font-medium"
            >
              WhatsApp 082 487 3900
            </a>
          </p>
        </div>
      </section>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full bg-[#FDF2E9] text-[#AE5B16] text-[12px] font-semibold tracking-wide uppercase mb-2">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[1.875rem] md:text-[2.25rem] font-bold text-[#101828] leading-[1.2] tracking-tight mt-1 mb-2">
      {children}
    </h2>
  );
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#475467] text-[1.0625rem] max-w-2xl">
      {children}
    </p>
  );
}

type PricingFeature = { text: string; included: boolean };

function PricingCard({
  name,
  price,
  vatPrice,
  speed,
  features,
  cta,
  ctaVariant,
  featured = false,
}: {
  name: string;
  price: string;
  vatPrice: string;
  speed: string;
  features: PricingFeature[];
  cta: string;
  ctaVariant: 'fill' | 'outline';
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-7 ${
        featured
          ? 'bg-[#1B2A4A] text-white shadow-[0_24px_48px_-12px_rgba(16,24,40,.3)] scale-[1.02]'
          : 'bg-white border border-[#EAECF0] shadow-sm'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block bg-[#E87A1E] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          Most popular
        </span>
      )}

      <div className={`text-[13px] font-bold tracking-wide uppercase mb-4 ${featured ? 'text-[#FDB981]' : 'text-[#667085]'}`}>
        {name}
      </div>

      <div className="flex items-end gap-1 mb-0.5">
        <span className={`text-[1.125rem] font-semibold ${featured ? 'text-white/60' : 'text-[#667085]'}`}>R</span>
        <span className={`font-display text-[2.75rem] font-bold leading-none ${featured ? 'text-white' : 'text-[#101828]'}`}>
          {price}
        </span>
      </div>
      <div className={`text-[13px] mb-1 ${featured ? 'text-white/50' : 'text-[#98A2B3]'}`}>/month excl. VAT</div>
      <div className={`text-[12px] mb-4 ${featured ? 'text-white/40' : 'text-[#B8C0CC]'}`}>R{vatPrice} incl. VAT</div>

      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full self-start mb-5 ${
        featured ? 'bg-white/10 text-white/70' : 'bg-[#F2F4F7] text-[#475467]'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
        {speed}
      </span>

      <hr className={`mb-5 ${featured ? 'border-white/10' : 'border-[#EAECF0]'}`} />

      <ul className="space-y-2.5 flex-1">
        {features.map(({ text, included }) => (
          <li key={text} className="flex items-start gap-2.5 text-[13px]">
            {included ? (
              <>
                <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-[#ECFDF3] flex items-center justify-center">
                  <CheckIcon />
                </span>
                <span className={featured ? 'text-white/80' : 'text-[#344054]'}>{text}</span>
              </>
            ) : (
              <>
                <span className="mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center">
                  <DashIcon />
                </span>
                <span className={featured ? 'text-white/30' : 'text-[#98A2B3]'}>{text}</span>
              </>
            )}
          </li>
        ))}
      </ul>

      <Link
        href="#coverage"
        className={`mt-7 block text-center font-semibold text-[14px] py-3 rounded-xl transition-colors ${
          ctaVariant === 'fill'
            ? 'bg-[#E87A1E] hover:bg-[#C45A30] text-white'
            : featured
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            : 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
