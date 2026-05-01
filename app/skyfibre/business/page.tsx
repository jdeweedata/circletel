import Link from 'next/link';
import { Syne } from 'next/font/google';
import {
  PiCheckBold,
  PiLightningBold,
  PiWifiHighBold,
  PiClipboardTextBold,
  PiLockOpenBold,
  PiLightningABold,
  PiReceiptBold,
} from 'react-icons/pi';
import type { Metadata } from 'next';
import InstallAccordion from './InstallAccordion';
import FAQList from './FAQList';
import CoverageForm from './CoverageForm';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'SkyFibre Business | CircleTel — Broadband Built for SMMEs',
  description:
    'Business-grade fixed wireless broadband for South African SMMEs. Truly uncapped, static IP included, no lock-in contracts. From R1,299/mo ex-VAT.',
};

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const PLANS = [
  {
    id: 'skyfibre-smb-50',
    name: 'Business 50',
    speed: '50',
    uploadSpeed: '12.5',
    price: 1299,
    popular: false,
    features: [
      'Static IP address',
      'Truly uncapped — no FUP',
      'Business SLA support',
      'Month-to-month',
      'Business-grade router',
    ],
    href: '/order/coverage?product=skyfibre-smb&tier=50',
  },
  {
    id: 'skyfibre-smb-100',
    name: 'Business 100',
    speed: '100',
    uploadSpeed: '25',
    price: 1499,
    popular: true,
    features: [
      'Static IP address',
      'Truly uncapped — no FUP',
      'Priority business support',
      'Month-to-month',
      'Wi-Fi 6 router included',
    ],
    href: '/order/coverage?product=skyfibre-smb&tier=100',
  },
  {
    id: 'skyfibre-smb-200',
    name: 'Business 200',
    speed: '200',
    uploadSpeed: '50',
    price: 1899,
    popular: false,
    features: [
      'Static IP address',
      'Truly uncapped — no FUP',
      'Priority + named manager',
      'Month-to-month',
      'Whole-office mesh Wi-Fi',
    ],
    href: '/order/coverage?product=skyfibre-smb&tier=200',
  },
] as const;

const TRUST_ITEMS = [
  'No throttling. Ever.',
  'Static IP included',
  'Month-to-month',
  'Named account manager',
  'Fast installation',
];

const PAIN_POINTS = [
  {
    emoji: '📉',
    title: 'The midday slowdown',
    body: 'Your ISP throttles speeds during peak hours. Meetings freeze. Cloud backups stall. File uploads to clients drag on for hours.',
    resolve: 'SkyFibre Business: truly uncapped, no fair-use policy.',
  },
  {
    emoji: '🔒',
    title: "Can't access the office remotely",
    body: 'Your IP changes every reboot. Your VPN connection breaks. Your CCTV is unreachable. You need a fixed address the internet can find.',
    resolve: 'SkyFibre Business: static IP included on every plan.',
  },
  {
    emoji: '📞',
    title: 'No-one picks up',
    body: 'Consumer-grade support means long queues, scripted responses, and engineers who can\'t actually help. You need a named contact.',
    resolve: 'SkyFibre Business: dedicated account manager, direct line.',
  },
];

const SPECS = [
  { label: 'Technology', value: 'MTN Tarana G1 Fixed Wireless' },
  { label: 'Spectrum', value: 'Licensed (MTN managed)' },
  { label: 'Typical latency', value: '< 5 ms' },
  { label: 'Contention ratio', value: '8:1 (business grade)' },
  { label: 'IP address', value: 'Public static — all plans' },
  { label: 'Data cap', value: 'Uncapped — no fair-use policy' },
  { label: 'Coverage', value: '6 million+ homes nationally' },
  { label: 'Contract', value: 'Month-to-month' },
];

const USE_CASES = [
  'Run VoIP calls without jitter or lag',
  'Back up to the cloud reliably overnight',
  'Host your own server or NAS securely',
  'Connect remote staff via stable VPN',
  'Accept card payments without interruption',
];

const FEATURES = [
  {
    Icon: PiLightningBold,
    title: 'No throttling. No FUP.',
    body: 'Your speeds stay consistent all month — peak hours, month-end, or streaming a training session to 20 staff simultaneously. What you pay for is what you get.',
  },
  {
    Icon: PiWifiHighBold,
    title: 'Static IP included',
    body: 'A fixed public IP address lets you host services, run VPNs, access your CCTV remotely, and point domain records directly at your office. Included free — not an add-on.',
  },
  {
    Icon: PiClipboardTextBold,
    title: 'Business SLA',
    body: 'We guarantee a <4-hour fault response and 99.9% uptime. If we miss it, you get a credit. Named account managers mean you call a person, not a queue.',
  },
  {
    Icon: PiLockOpenBold,
    title: 'No lock-in contracts',
    body: "Month-to-month on all plans. If your business moves, grows out of the tier, or closes — you're not stuck. 30 days' notice and you're done.",
  },
  {
    Icon: PiLightningABold,
    title: 'Fast installation',
    body: 'Fixed wireless means no trenching, no civil works, no weeks of waiting. Our engineers install a compact rooftop unit and connect your office within 3–5 business days.',
  },
  {
    Icon: PiReceiptBold,
    title: 'Clean monthly invoicing',
    body: 'One invoice per month, VAT-compliant and emailed automatically. POPI-compliant data handling, debit order billing, and an online portal for your finance team.',
  },
];

const WhatsAppIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function SkyFibreBusinessPage() {
  return (
    <div className={`${syne.variable} bg-[#F8F8F4] text-[#0D1724] antialiased`}>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0D1724] border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="text-[22px] font-black text-white tracking-[-0.04em] uppercase">
            Circle<span className="text-[#E87A1E]">Tel</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Home', href: '/' },
              { label: 'Connectivity', href: '/connectivity' },
              { label: 'Coverage', href: '/coverage' },
              { label: 'Support', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[13px] font-medium text-white/65 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/coverage"
              className="bg-[#E87A1E] hover:bg-[#C96A10] text-white text-xs font-bold tracking-[0.12em] uppercase px-5 py-[10px] transition-colors"
            >
              Check Coverage
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-[72px]">

        {/* Hero */}
        <section className="bg-[#1B2A4A] pt-[140px] pb-24 px-6 border-b border-white/20">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 lg:gap-20 items-center">

            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#E87A1E]/15 border border-[#E87A1E]/35 px-[14px] py-[6px] rounded-full mb-7">
                <span className="w-[7px] h-[7px] rounded-full bg-[#E87A1E] animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#E87A1E]">
                  SkyFibre Business — Built for SMMEs
                </span>
              </div>
              <h1
                className="font-black text-white leading-none tracking-[-0.04em] mb-6"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(38px, 5.5vw, 70px)' }}
              >
                Internet That{' '}
                <span className="text-[#E87A1E]">Shows Up</span>{' '}
                for Work.
              </h1>
              <p className="text-[17px] text-[#8A95A8] leading-relaxed max-w-[500px] mb-9">
                Business-grade fixed wireless broadband with static IP, no throttling, and a real SLA.
                Because when your connection drops, so does everything else.
              </p>
              <p className="text-[13px] text-white/45 mb-9 tracking-[0.02em]">
                Business plans from{' '}
                <strong className="text-white/90 font-bold">R1,299/mo</strong>{' '}
                excluding VAT — no lock-in contracts.
              </p>
              <div className="flex flex-wrap gap-[14px]">
                <a
                  href="#packages"
                  className="inline-flex items-center gap-2 bg-[#E87A1E] hover:bg-[#C96A10] text-white text-[13px] font-bold tracking-[0.1em] uppercase px-7 py-[14px] transition-colors"
                >
                  View Packages
                  <ArrowRightIcon />
                </a>
                <a
                  href="https://wa.me/27824873900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/25 hover:bg-white/[0.06] hover:border-white/50 text-white text-[13px] font-semibold tracking-[0.06em] px-7 py-[14px] transition-colors"
                >
                  <WhatsAppIcon />
                  Chat to Sales
                </a>
              </div>
            </div>

            {/* Stats panel */}
            <div className="bg-[#0D1724] border border-white/12 p-9">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#8A95A8] mb-7">
                SkyFibre Business — Live network stats
              </p>
              {/* Stat rows */}
              <div className="border border-white/12 flex mb-3">
                <div className="flex-1 p-[18px_20px] border-r border-white/12">
                  <div className="text-[28px] font-black tracking-[-0.04em] text-white leading-none">
                    99<span className="text-[#E87A1E]">.9%</span>
                  </div>
                  <div className="text-[11px] text-[#8A95A8] mt-1">Network uptime SLA</div>
                </div>
                <div className="flex-1 p-[18px_20px]">
                  <div className="text-[28px] font-black tracking-[-0.04em] text-white leading-none">
                    &lt;<span className="text-[#E87A1E]">5ms</span>
                  </div>
                  <div className="text-[11px] text-[#8A95A8] mt-1">Typical latency</div>
                </div>
              </div>
              <div className="border border-white/12 flex mb-5">
                <div className="flex-1 p-[18px_20px] border-r border-white/12">
                  <div className="text-[28px] font-black tracking-[-0.04em] text-white leading-none">
                    <span className="text-[#E87A1E]">&lt;</span>4h
                  </div>
                  <div className="text-[11px] text-[#8A95A8] mt-1">Fault response SLA</div>
                </div>
                <div className="flex-1 p-[18px_20px]">
                  <div className="text-[28px] font-black tracking-[-0.04em] text-white leading-none">
                    8<span className="text-[#E87A1E]">:1</span>
                  </div>
                  <div className="text-[11px] text-[#8A95A8] mt-1">Business contention ratio</div>
                </div>
              </div>
              <div className="pt-5 border-t border-white/12 text-[12px] text-[#8A95A8] leading-relaxed">
                <strong className="text-white/80">Powered by MTN Tarana G1</strong> fixed wireless on
                licensed spectrum. Managed end-to-end by CircleTel&rsquo;s local engineering team.
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <div className="bg-[#E87A1E] py-5 px-6">
          <div className="max-w-[1200px] mx-auto flex flex-wrap gap-8 justify-center items-center">
            {TRUST_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-[10px] text-[13px] font-bold text-white tracking-[0.04em]">
                <span className="text-lg">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Pain points */}
        <section className="bg-[#0D1724] py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-4">
              Sound familiar?
            </p>
            <h2
              className="text-white font-black leading-tight tracking-[-0.03em] mb-4"
              style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px, 4vw, 46px)' }}
            >
              Your internet is costing you more than you think.
            </h2>
            <p className="text-[16px] text-[#8A95A8] max-w-[540px] mb-14">
              Slow uploads, random dropouts, and no-one to call — these aren&rsquo;t just frustrations.
              They&rsquo;re lost revenue.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px]">
              {PAIN_POINTS.map((p) => (
                <div
                  key={p.title}
                  className="relative bg-[#243660] px-8 py-9 overflow-hidden before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full before:bg-[#E87A1E]"
                >
                  <span className="text-[32px] mb-5 block">{p.emoji}</span>
                  <h3 className="text-[16px] font-extrabold text-white mb-[10px] tracking-[-0.01em]">
                    {p.title}
                  </h3>
                  <p className="text-[14px] text-[#8A95A8] leading-[1.7]">{p.body}</p>
                  <p className="mt-4 pt-4 border-t border-white/[0.08] text-[13px] font-semibold text-[#E87A1E]">
                    → {p.resolve}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="bg-[#F8F8F4] py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-[52px]">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-3">
                Choose your plan
              </p>
              <h2
                className="font-black leading-tight tracking-[-0.03em] text-[#1B2A4A] mb-3"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px, 4vw, 46px)' }}
              >
                Business broadband, priced fairly.
              </h2>
              <p className="text-[16px] text-[#8A95A8] max-w-[480px]">
                All plans include static IP, truly uncapped data, business SLA, and month-to-month billing.
              </p>
              <p className="text-[12px] text-[#8A95A8] mt-2 italic">
                All prices exclude VAT. Installation included.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border border-[#1B2A4A]/15 overflow-hidden">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col px-8 py-10 border-r border-[#1B2A4A]/15 last:border-r-0 ${
                    plan.popular ? 'bg-[#1B2A4A]' : 'bg-white'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#E87A1E] text-white text-[10px] font-bold tracking-[0.14em] uppercase px-4 py-[5px] rounded-b whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <p className={`text-[12px] font-bold tracking-[0.12em] uppercase mb-2 mt-4 ${plan.popular ? 'text-white/55' : 'text-[#8A95A8]'}`}>
                    {plan.name}
                  </p>
                  <div className={`text-[42px] font-black leading-none tracking-[-0.05em] ${plan.popular ? 'text-white' : 'text-[#1B2A4A]'}`}>
                    {plan.speed}
                  </div>
                  <p className={`text-[13px] mt-1 mb-5 ${plan.popular ? 'text-white/50' : 'text-[#8A95A8]'}`}>
                    Mbps download · {plan.uploadSpeed} Mbps upload
                  </p>
                  <div className={`h-px mb-5 ${plan.popular ? 'bg-white/12' : 'bg-[#1B2A4A]/10'}`} />
                  <div className="text-[32px] font-black tracking-[-0.04em] text-[#E87A1E] mb-1">
                    R{plan.price.toLocaleString()}
                  </div>
                  <p className={`text-[12px] mb-7 ${plan.popular ? 'text-white/45' : 'text-[#8A95A8]'}`}>
                    per month, ex-VAT
                  </p>
                  <ul className="flex-1 flex flex-col gap-[11px] mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-[10px] text-[14px] ${plan.popular ? 'text-white/85' : 'text-[#0D1724]'}`}>
                        <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 mt-[1px] ${plan.popular ? 'bg-[#E87A1E]/25' : 'bg-[#E87A1E]/15'}`}>
                          <PiCheckBold className="text-[#E87A1E] text-[9px]" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`block text-center text-[12px] font-bold tracking-[0.1em] uppercase px-5 py-[14px] transition-colors mt-auto ${
                      plan.popular
                        ? 'bg-[#E87A1E] hover:bg-[#C96A10] text-white'
                        : 'border-2 border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[12px] text-[#8A95A8] text-center italic">
              Not sure which plan is right?{' '}
              <a
                href="https://wa.me/27824873900"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E87A1E] font-semibold not-italic"
              >
                Chat to our team on WhatsApp
              </a>{' '}
              — we&rsquo;ll size it for your team.
            </p>
          </div>
        </section>

        {/* Specs */}
        <section className="bg-[#1B2A4A] py-20 px-6">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-20 items-start">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-8">
                Under the hood
              </p>
              <h2
                className="font-black text-white leading-tight tracking-[-0.03em] mb-8"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(24px, 3vw, 36px)' }}
              >
                Enterprise-grade infrastructure. SMME pricing.
              </h2>
              <table className="w-full border-collapse">
                <tbody>
                  {SPECS.map(({ label, value }) => (
                    <tr key={label} className="border-b border-white/[0.08] last:border-b-0">
                      <td className="py-4 text-[14px] text-[#8A95A8] font-medium w-[48%] pr-4 align-top">
                        {label}
                      </td>
                      <td className="py-4 text-[14px] text-white/90 font-semibold align-top">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-5">
                Why it matters for your business
              </p>
              <h3
                className="font-black text-white leading-tight tracking-[-0.03em] mb-4"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(22px, 2.5vw, 28px)' }}
              >
                The only internet your business actually needs.
              </h3>
              <p className="text-[15px] text-[#8A95A8] leading-[1.7] mb-8">
                Most consumer ISPs oversell bandwidth and throttle during peaks. SkyFibre Business uses a
                dedicated business contention ratio and licensed spectrum — so your connection is stable
                when your team needs it most.
              </p>
              <ul className="flex flex-col gap-3">
                {USE_CASES.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] text-white/80">
                    <span className="w-[6px] h-[6px] bg-[#E87A1E] rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Why CircleTel */}
        <section className="bg-[#F8F8F4] py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-14">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-3">
                What you get
              </p>
              <h2
                className="font-black leading-tight tracking-[-0.03em] text-[#1B2A4A] mb-3"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px, 4vw, 46px)' }}
              >
                Everything a growing business needs.
              </h2>
              <p className="text-[16px] text-[#8A95A8] max-w-[480px]">
                No upsells, no hidden charges. These are standard on every SkyFibre Business plan.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2px]">
              {FEATURES.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="bg-white border border-[#1B2A4A]/15 px-8 py-9 hover:border-[#E87A1E] hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-[#FEF0E0] flex items-center justify-center mb-5">
                    <Icon className="text-[#E87A1E] text-[22px]" />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-[#1B2A4A] mb-[10px] tracking-[-0.01em]">
                    {title}
                  </h3>
                  <p className="text-[14px] text-[#5A6474] leading-[1.7]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Installation */}
        <section className="bg-white py-24 px-6">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-[100px]">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-4">
                How it works
              </p>
              <h2
                className="font-black leading-tight tracking-[-0.03em] text-[#1B2A4A] mb-4"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(24px, 3vw, 36px)' }}
              >
                Up and running in 3–5 days.
              </h2>
              <p className="text-[16px] text-[#8A95A8] mb-7">
                No downtime, no disruption. We work around your business hours.
              </p>
              <div className="bg-[#FEF0E0] border border-[#E87A1E]/25 px-6 py-5">
                <strong className="block text-[15px] font-extrabold text-[#1B2A4A] mb-1">
                  Zero disruption guarantee
                </strong>
                <span className="text-[13px] text-[#5A6474]">
                  We install the outdoor unit in under 2 hours. Your existing internet stays live until
                  we&rsquo;ve confirmed your new connection is stable.
                </span>
              </div>
            </div>
            <InstallAccordion />
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#F8F8F4] py-24 px-6">
          <div className="max-w-[860px] mx-auto">
            <div className="mb-12">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-3">
                Common questions
              </p>
              <h2
                className="font-black leading-tight tracking-[-0.03em] text-[#1B2A4A] mb-3"
                style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(28px, 4vw, 46px)' }}
              >
                Answers for business owners.
              </h2>
              <p className="text-[16px] text-[#8A95A8]">
                No jargon. Just straight answers about what matters to your business.
              </p>
            </div>
            <FAQList />
          </div>
        </section>

        {/* Coverage CTA */}
        <section id="coverage" className="bg-[#1B2A4A] py-24 px-6">
          <div className="max-w-[700px] mx-auto text-center">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#E87A1E] mb-5">
              Check availability
            </p>
            <h2
              className="font-black text-white leading-tight tracking-[-0.03em] mb-4"
              style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(30px, 4vw, 48px)' }}
            >
              Is SkyFibre Business at your address?
            </h2>
            <p className="text-[16px] text-[#8A95A8] mb-10">
              Enter your business address below. We&rsquo;ll tell you immediately which plans are
              available, with no sign-up required.
            </p>
            <CoverageForm />
            <p className="text-[14px] text-[#8A95A8]">
              Prefer to talk first?{' '}
              <a
                href="https://wa.me/27824873900"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 font-semibold hover:text-[#E87A1E] transition-colors"
              >
                WhatsApp us on 082 487 3900
              </a>
              {' '}·{' '}
              <a
                href="mailto:contactus@circletel.co.za"
                className="text-white/70 font-semibold hover:text-[#E87A1E] transition-colors"
              >
                contactus@circletel.co.za
              </a>
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#0D1724] border-t border-white/10 py-12 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 flex-wrap">
          <div>
            <div className="text-[18px] font-black text-white tracking-[-0.04em] uppercase mb-1">
              Circle<span className="text-[#E87A1E]">Tel</span>
            </div>
            <p className="text-[11px] text-white/30">
              © {new Date().getFullYear()} CircleTel. Imagine House, 2 Mellis Road, Rivonia, Sandton.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              { label: 'Terms', href: '/terms-of-service' },
              { label: 'Privacy', href: '/privacy-policy' },
              { label: 'Coverage', href: '/coverage' },
              { label: 'Support', href: '/contact' },
              { label: 'All Products', href: '/connectivity' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[11px] font-semibold tracking-[0.1em] uppercase text-white/40 hover:text-[#E87A1E] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
