import { Wifi, ArrowUpDown, Building2, Shield, Receipt, Zap } from 'lucide-react';
import Link from 'next/link';
import { BizMobilePlanCard } from './BizMobilePlanCard';
import { CONTACT } from '@/lib/constants/contact';

const PLANS = [
  {
    dataLabel: '30GB',
    contractMonths: 38,
    planName: 'MTN Business Broadband LTE',
    price: 129,
    features: [
      '30GB LTE data per month',
      'Shared across all devices',
      'No lock-in on data rollover',
      'Priority business support',
    ],
  },
  {
    dataLabel: 'Uncapped',
    contractMonths: 36,
    planName: 'Made For Business S+',
    price: 169,
    badge: 'Most Popular',
    featured: true,
    features: [
      'Uncapped LTE at 10Mbps',
      'Uncapped voice & data',
      'Multi-SIM enabled',
      'Business priority network access',
      'Available on 24 or 36-month terms',
    ],
  },
  {
    dataLabel: 'Uncapped',
    contractMonths: 24,
    planName: 'MTN Business Uncapped 10Mbps',
    price: 449,
    features: [
      'Uncapped LTE at 10Mbps',
      'Fixed-speed business broadband',
      'Single static APN',
      '24-month contract term',
    ],
  },
];

const WHY_FEATURES = [
  {
    icon: Zap,
    title: 'MTN Enterprise Network',
    body: "Priority access on South Africa's leading business LTE & 5G network.",
  },
  {
    icon: ArrowUpDown,
    title: 'Multi-SIM Ready',
    body: 'Add multiple lines on a single business account — perfect for teams.',
  },
  {
    icon: Building2,
    title: 'Dedicated Business Support',
    body: 'Mon–Fri 8am–5pm SAST. Escalate directly via your account manager.',
  },
  {
    icon: Receipt,
    title: 'Single Monthly Bill',
    body: 'All your devices and plans consolidated on one invoice.',
  },
  {
    icon: Shield,
    title: 'No Hidden Fees',
    body: 'All prices quoted are VAT-inclusive. What you see is what you pay.',
  },
];

const DEVICES = [
  {
    name: 'Apple iPhone 17',
    spec: '256GB',
    contractPrice: 169,
    contractPlan: 'Business S+ × 36mo',
    outrightPrice: 21359,
    badge: 'Limited Stock',
  },
  {
    name: 'Samsung Galaxy S26 Ultra',
    spec: '256GB',
    contractPrice: 169,
    contractPlan: 'Business S+ × 36mo',
    outrightPrice: 28769,
    badge: 'Coming Soon',
  },
  {
    name: 'Huawei Mate 80 Pro',
    spec: '',
    contractPrice: 169,
    contractPlan: 'Business S+ × 36mo',
    outrightPrice: 27329,
    badge: 'Limited Stock',
  },
  {
    name: 'Huawei MatePad SE 11"',
    spec: '128GB LTE',
    contractPrice: 129,
    contractPlan: 'Broadband LTE × 36mo',
    outrightPrice: 6669,
    badge: 'Limited Stock',
  },
  {
    name: 'Tozed ZLT X100 Pro 5G CPE',
    spec: '',
    contractPrice: null,
    contractPlan: null,
    outrightPrice: 1729,
    badge: null,
  },
  {
    name: 'Huawei E5576-321',
    spec: '4G MiFi',
    contractPrice: null,
    contractPlan: null,
    outrightPrice: 459,
    badge: 'Limited Stock',
  },
];

const MIFI_OPTIONS = [
  {
    name: 'Huawei E5576-321',
    tagline: '4G MiFi — connect up to 16 devices',
    price: 459,
    icon: Wifi,
  },
  {
    name: 'Tozed ZLT M36',
    tagline: '4G MiFi — compact & portable',
    price: 199,
    icon: Wifi,
  },
];

export function BizMobilePageLayout() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-12">
      {/* Top Banner */}
      <div className="bg-[#F5831F] px-6 py-4 flex flex-wrap items-center gap-6">
        <div className="flex flex-col border-r border-white/30 pr-6">
          <span className="text-[10px] font-[900] text-white uppercase tracking-widest">
            MTN Enterprise
          </span>
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter italic -mt-1">
            April 2026 Deals
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white uppercase tracking-tight leading-none">
            Valid until 6 May 2026 · All plans also available on
          </span>
          <span className="text-2xl font-[900] text-white tracking-tighter leading-none -mt-0.5">
            Contract or Month-to-Month
          </span>
        </div>
        <span className="ml-auto text-[10px] font-bold text-white/80 uppercase tracking-widest hidden md:block">
          Incl. VAT
        </span>
      </div>

      {/* Hero */}
      <div className="bg-[#1E293B] text-white px-6 py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-[900] text-[#F5831F] uppercase tracking-[0.2em] mb-4">
            MTN Enterprise · April 2026 Deals
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-[900] text-white leading-[0.85] tracking-[-0.04em] mb-6">
            Built for <br />
            South Africa.
          </h1>
          <p className="text-slate-400 text-sm md:text-base mb-8 max-w-lg">
            Contract plans from{' '}
            <span className="text-white font-bold">R129/mo</span> · Outright devices from{' '}
            <span className="text-white font-bold">R199</span> · All prices incl. 15% VAT
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#plans"
              className="inline-flex items-center gap-2 bg-[#F5831F] hover:bg-[#e0721a] text-white font-[800] px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Check Coverage &amp; Get a Deal →
            </Link>
            <Link
              href={CONTACT.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              <Wifi size={16} />
              WhatsApp Us
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {/* Plans + Why Choose Grid */}
        <div id="plans" className="grid lg:grid-cols-4 gap-6 items-stretch mb-16">
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <BizMobilePlanCard key={plan.price} {...plan} />
            ))}
          </div>

          {/* Why Choose */}
          <div className="bg-[#1E293B] text-white p-6 rounded-lg space-y-5 flex flex-col justify-center">
            <h2 className="text-sm font-[900] uppercase tracking-widest text-[#F5831F]">
              Why choose a business plan?
            </h2>
            {WHY_FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="shrink-0 p-1.5 bg-white/10 rounded text-[#F5831F] mt-0.5">
                  <f.icon size={14} />
                </div>
                <div>
                  <p className="text-[12px] font-[800] text-white leading-none mb-1">{f.title}</p>
                  <p className="text-[11px] text-white/60 leading-snug">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Devices */}
        <div className="mb-16">
          <h2 className="text-2xl font-[900] text-[#1E293B] tracking-tight mb-1">
            Featured devices
          </h2>
          <p className="text-[12px] text-slate-500 mb-6">
            Contract pricing shown is the minimum plan rate. Final repayment depends on device,
            plan, and term.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DEVICES.map((d) => (
              <div
                key={d.name}
                className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3 hover:border-[#F5831F] hover:shadow-sm transition-all"
              >
                {d.badge && (
                  <span
                    className={`text-[9px] font-[900] uppercase tracking-widest px-2 py-0.5 rounded self-start ${
                      d.badge === 'Coming Soon'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-orange-50 text-[#F5831F]'
                    }`}
                  >
                    {d.badge}
                  </span>
                )}
                {!d.badge && <div className="h-5" />}

                {/* Device placeholder */}
                <div className="h-20 bg-slate-50 rounded flex items-center justify-center">
                  <Wifi className="text-slate-200" size={28} strokeWidth={1} />
                </div>

                <div>
                  <p className="text-[11px] font-[800] text-[#1E293B] leading-tight">
                    {d.name}
                  </p>
                  {d.spec && (
                    <p className="text-[10px] text-slate-400 font-medium">{d.spec}</p>
                  )}
                </div>

                {d.contractPrice && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Contract from
                    </p>
                    <p className="text-base font-[900] text-[#1E293B] tracking-tighter">
                      R{d.contractPrice}
                      <span className="text-[10px] font-medium text-slate-400">/mo</span>
                    </p>
                    <p className="text-[9px] text-slate-400">{d.contractPlan}</p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    {d.contractPrice ? 'Or buy outright' : 'Buy outright'}
                  </p>
                  <p className="text-base font-[900] text-[#1E293B] tracking-tighter">
                    R{d.outrightPrice.toLocaleString()}
                  </p>
                </div>

                <Link
                  href="/business/mobile#contact"
                  className={`mt-auto block w-full py-2 rounded text-center text-[10px] font-[900] uppercase tracking-widest transition-colors ${
                    d.badge === 'Coming Soon'
                      ? 'bg-slate-100 text-slate-400 cursor-default pointer-events-none'
                      : 'bg-[#F5831F] text-white hover:bg-[#e0721a]'
                  }`}
                >
                  {d.badge === 'Coming Soon' ? 'Coming Soon' : 'Get This Deal'}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* MiFi Add-on Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8 mb-10 shadow-sm">
          <h2 className="text-lg font-[900] text-[#1E293B] tracking-tight mb-6">
            Add a MiFi router to your business deal
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {MIFI_OPTIONS.map((router, idx) => (
              <div key={router.name} className="flex-1 flex items-center gap-5 w-full">
                <div className="w-24 h-28 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm gap-2 shrink-0 transition-transform hover:scale-105">
                  <router.icon className="text-[#F5831F]" size={30} strokeWidth={1.5} />
                  <span className="text-[9px] font-[900] text-slate-400 uppercase tracking-widest text-center px-1">
                    {router.name.split(' ').slice(-1)[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-[900] text-[#1E293B] text-base leading-tight">{router.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{router.tagline}</p>
                  <p className="mt-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Outright{' '}
                    </span>
                    <span className="text-xl font-[900] text-[#F5831F] tracking-tighter">
                      R{router.price}
                    </span>
                  </p>
                </div>
                {idx < MIFI_OPTIONS.length - 1 && (
                  <span className="font-[900] text-slate-200 italic text-3xl tracking-tighter hidden md:block">
                    OR
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-[#1E293B] rounded-xl p-10 md:p-14 text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-[900] text-white tracking-tight mb-3">
            Ready to connect your team?
          </h2>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
            Deals valid until 6 May 2026. MTN credit vetting required for contract deals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="#plans"
              className="inline-flex items-center gap-2 bg-[#F5831F] hover:bg-[#e0721a] text-white font-[800] px-7 py-3 rounded-lg transition-colors text-sm"
            >
              Check Coverage &amp; Get a Deal →
            </Link>
            <Link
              href={CONTACT.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-sm"
            >
              WhatsApp Us
            </Link>
            <Link
              href="/business/mobile"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-sm"
            >
              View Full Catalogue
            </Link>
          </div>
        </div>

        {/* Fine Print */}
        <footer className="text-[10px] text-slate-400 font-medium leading-relaxed space-y-3 border-t border-slate-100 pt-10">
          <p className="max-w-4xl">
            <strong className="text-slate-500">Pricing &amp; Validity:</strong> All prices are
            inclusive of 15% VAT. Contract deals are valid from 6 April 2026 to 6 May 2026 and are
            subject to change without notice. Outright (EBU cash) prices are effective 6 April – 6
            May 2026.
          </p>
          <p className="max-w-4xl">
            <strong className="text-slate-500">Contract terms:</strong> Monthly prices shown are
            the minimum plan fee on the specified term. Final monthly repayment depends on device
            selection, chosen plan, and term length (24 or 36 months). Contract deals are subject
            to MTN credit vetting and approval.
          </p>
          <p className="max-w-4xl">
            <strong className="text-slate-500">Stock:</strong> "Limited Stock" items are subject to
            availability. "Coming Soon" devices are listed for pre-order inquiry only. CircleTel
            reserves the right to substitute an equivalent product if a listed SKU becomes
            unavailable.
          </p>
          <p className="max-w-4xl">
            <strong className="text-slate-500">Network:</strong> LTE and 5G signal subject to
            availability at your location. Speeds quoted are maximum theoretical speeds and may vary
            based on signal strength, congestion, and device capability. CircleTel is an authorised
            MTN Enterprise Business reseller. MTN and related trademarks are the property of MTN
            Group Ltd. E&amp;OE.
          </p>
        </footer>
      </main>
    </div>
  );
}
