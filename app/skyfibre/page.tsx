import { Syne } from 'next/font/google';
import Link from 'next/link';
import {
  PiLightningBold,
  PiHeadsetBold,
  PiCalendarBlankBold,
  PiShieldCheckBold,
  PiCheckBold,
} from 'react-icons/pi';
import { WhyCircleTel } from '@/components/products/WhyCircleTel';
import CoverageCheckClient from './CoverageCheckClient';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'SkyFibre | CircleTel — Fibre That Doesn\'t Flinch',
  description:
    'Uncapped, unshaped fixed wireless internet across South Africa. Month-to-month. No contracts.',
};

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const PLANS = [
  {
    id: 'skyfibre-home-plus',
    speed: '50 Mbps',
    label: 'Download / Upload',
    price: 899,
    popular: false,
    features: ['Free router', 'Free installation', 'No contracts', 'Uncapped data'],
    href: '/packages?plan=skyfibre-home-plus',
  },
  {
    id: 'skyfibre-home-max',
    speed: '100 Mbps',
    label: 'Download / Upload',
    price: 999,
    popular: true,
    features: [
      'Wi-Fi 6 router',
      'Free installation',
      'No contracts',
      'Priority support',
    ],
    href: '/packages?plan=skyfibre-home-max',
  },
  {
    id: 'skyfibre-home-ultra',
    speed: '200 Mbps',
    label: 'Download / Upload',
    price: 1299,
    popular: false,
    features: ['Wi-Fi 6 router', 'Free installation', 'No contracts', 'Whole-home coverage'],
    href: '/packages?plan=skyfibre-home-ultra',
  },
] as const;

const FEATURES = [
  {
    Icon: PiLightningBold,
    heading: 'NO THROTTLING',
    body: 'Consistent speeds regardless of usage. Truly unshaped data — always.',
  },
  {
    Icon: PiHeadsetBold,
    heading: '24/7 SUPPORT',
    body: 'Local engineering team available around the clock. Real humans, every time.',
  },
  {
    Icon: PiCalendarBlankBold,
    heading: 'MONTH-TO-MONTH',
    body: 'No long-term commitments. Cancel any time with 30 days\' notice.',
  },
  {
    Icon: PiShieldCheckBold,
    heading: '99.9% UPTIME',
    body: 'Enterprise-grade infrastructure engineered for maximum reliability.',
  },
] as const;

export default function SkyFibrePage() {
  return (
    <div className={`${syne.variable} bg-[#F8F8F4] text-[#0D1724] antialiased`}>
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-neutral-950 border-b border-white/10">
        <div className="flex items-center justify-between h-20 px-6 lg:px-8 max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-2xl font-black text-white tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            CircleTel
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-neutral-300 text-sm font-medium hover:text-[#E87A1E] transition-colors">
              Home
            </Link>
            <Link href="/connectivity" className="text-neutral-300 text-sm font-medium hover:text-[#E87A1E] transition-colors">
              Connectivity
            </Link>
            <Link href="/coverage" className="text-neutral-300 text-sm font-medium hover:text-[#E87A1E] transition-colors">
              Coverage
            </Link>
            <Link href="/contact" className="text-neutral-300 text-sm font-medium hover:text-[#E87A1E] transition-colors">
              Support
            </Link>
          </div>
          <Link
            href="/coverage"
            className="bg-[#E87A1E] text-white text-xs font-bold tracking-widest uppercase px-5 py-3 hover:bg-[#d06d17] transition-colors"
          >
            Check Availability
          </Link>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero */}
        <section className="bg-[#1B2A4A] text-white py-24 px-6 lg:px-8 border-b border-white/20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] leading-none tracking-[-0.04em] font-extrabold text-white"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                Fibre That Doesn&rsquo;t Flinch.
              </h1>
              <p className="text-lg text-[#8A95A8] max-w-lg leading-relaxed">
                Uncapped. Unshaped. Unmatched fixed wireless speeds across South Africa.
                Engineered for precision and unshakeable connectivity.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#coverage"
                  className="bg-[#E87A1E] text-white text-xs font-bold tracking-widest uppercase px-6 py-4 hover:bg-[#d06d17] transition-colors"
                >
                  GET CONNECTED
                </a>
                <a
                  href="#plans"
                  className="border border-white/30 text-white text-xs font-bold tracking-widest uppercase px-6 py-4 hover:bg-white/5 transition-colors"
                >
                  VIEW PLANS
                </a>
              </div>
            </div>
            {/* Abstract visual — geometric SVG, no external image dependency */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square border border-white/20 bg-[#0D1724]">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 400 400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Geometric fibre-optic cross-section abstraction */}
                  <line x1="0" y1="200" x2="400" y2="200" stroke="#E87A1E" strokeWidth="1" strokeOpacity="0.3" />
                  <line x1="200" y1="0" x2="200" y2="400" stroke="#E87A1E" strokeWidth="1" strokeOpacity="0.3" />
                  <line x1="0" y1="0" x2="400" y2="400" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
                  <line x1="400" y1="0" x2="0" y2="400" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />

                  <rect x="120" y="120" width="160" height="160" stroke="#E87A1E" strokeWidth="1.5" />
                  <rect x="140" y="140" width="120" height="120" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
                  <rect x="160" y="160" width="80" height="80" stroke="#E87A1E" strokeWidth="1" strokeOpacity="0.6" />
                  <rect x="180" y="180" width="40" height="40" fill="#E87A1E" fillOpacity="0.15" stroke="#E87A1E" strokeWidth="1" />

                  <circle cx="200" cy="200" r="90" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
                  <circle cx="200" cy="200" r="60" stroke="#E87A1E" strokeWidth="0.5" strokeOpacity="0.4" />

                  <line x1="50" y1="50" x2="200" y2="200" stroke="#E87A1E" strokeWidth="1.5" />
                  <line x1="350" y1="50" x2="200" y2="200" stroke="#E87A1E" strokeWidth="1.5" />
                  <line x1="50" y1="350" x2="200" y2="200" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
                  <line x1="350" y1="350" x2="200" y2="200" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />

                  <circle cx="200" cy="200" r="6" fill="#E87A1E" />
                  <circle cx="50" cy="50" r="3" fill="#E87A1E" fillOpacity="0.6" />
                  <circle cx="350" cy="50" r="3" fill="#E87A1E" fillOpacity="0.6" />
                  <circle cx="50" cy="350" r="3" fill="white" fillOpacity="0.3" />
                  <circle cx="350" cy="350" r="3" fill="white" fillOpacity="0.3" />
                </svg>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#8A95A8] uppercase">
                    Fixed Wireless Network
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Speed Tier Cards */}
        <section id="plans" className="py-24 px-6 lg:px-8 bg-[#F8F8F4]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="text-4xl lg:text-5xl font-bold leading-none tracking-[-0.02em] text-[#1B2A4A] mb-4"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                Pick Your Speed
              </h2>
              <p className="text-base text-[#8A95A8]">
                Symmetrical speeds. No contracts. No nonsense.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {PLANS.map((plan) =>
                plan.popular ? (
                  /* Featured card — inverted */
                  <div
                    key={plan.id}
                    className="relative bg-[#1B2A4A] border border-[#E87A1E] p-8 flex flex-col md:-mt-4 md:mb-0"
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#E87A1E] text-white text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 whitespace-nowrap">
                      MOST POPULAR
                    </div>
                    <div className="mt-4 mb-6">
                      <span className="block text-3xl font-bold text-white leading-none mb-1">
                        {plan.speed}
                      </span>
                      <span className="block text-xs text-[#8A95A8] tracking-widest uppercase mb-5">
                        {plan.label}
                      </span>
                      <div className="h-px bg-white/10 mb-5" />
                      <span className="block text-2xl font-bold text-[#E87A1E]">
                        R{plan.price.toLocaleString()}/mo
                      </span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-white">
                          <PiCheckBold className="text-[#E87A1E] flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      className="block w-full bg-[#E87A1E] text-white text-xs font-bold tracking-widest uppercase text-center px-6 py-4 hover:bg-[#d06d17] transition-colors mt-auto"
                    >
                      SELECT PLAN
                    </Link>
                  </div>
                ) : (
                  /* Standard card */
                  <div
                    key={plan.id}
                    className="bg-[#F8F8F4] border border-[#1B2A4A]/20 p-8 flex flex-col hover:border-[#E87A1E] transition-colors"
                  >
                    <div className="mb-6">
                      <span className="block text-2xl font-bold text-[#0D1724] leading-none mb-1">
                        {plan.speed}
                      </span>
                      <span className="block text-xs text-[#8A95A8] tracking-widest uppercase mb-5">
                        {plan.label}
                      </span>
                      <div className="h-px bg-[#1B2A4A]/10 mb-5" />
                      <span className="block text-2xl font-bold text-[#E87A1E]">
                        R{plan.price.toLocaleString()}/mo
                      </span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[#0D1724]">
                          <PiCheckBold className="text-[#E87A1E] flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      className="block w-full border border-[#1B2A4A] text-[#0D1724] text-xs font-bold tracking-widest uppercase text-center px-6 py-4 hover:bg-[#1B2A4A] hover:text-white transition-colors mt-auto"
                    >
                      SELECT PLAN
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Feature Strip */}
        <section className="bg-[#1B2A4A] py-16 px-6 lg:px-8 border-y border-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {FEATURES.map(({ Icon, heading, body }) => (
              <div key={heading} className="flex flex-col items-start">
                <Icon className="text-[#E87A1E] mb-4 text-3xl flex-shrink-0" />
                <h3 className="text-[10px] font-bold tracking-[0.15em] text-white uppercase mb-2">
                  {heading}
                </h3>
                <p className="text-sm text-[#8A95A8] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage Check */}
        <section id="coverage" className="py-24 px-6 lg:px-8 bg-[#F8F8F4]">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-4xl lg:text-5xl font-bold leading-none tracking-[-0.02em] text-[#1B2A4A] mb-6"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Is CircleTel in your area?
            </h2>
            <p className="text-base text-[#8A95A8] mb-10">
              Enter your address to see which SkyFibre plans are available at your location.
            </p>
            <div className="text-left">
              <CoverageCheckClient />
            </div>
          </div>
        </section>

        {/* Why CircleTel */}
        <WhyCircleTel />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span
              className="block text-xl font-bold text-white mb-1"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              CircleTel
            </span>
            <p className="text-[10px] tracking-widest uppercase text-neutral-500">
              © {new Date().getFullYear()} CircleTel. Engineered Precision.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { label: 'Terms', href: '/terms-of-service' },
              { label: 'Privacy', href: '/privacy-policy' },
              { label: 'Coverage', href: '/coverage' },
              { label: 'Support', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[10px] tracking-widest uppercase text-neutral-500 hover:text-[#E87A1E] transition-colors"
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
