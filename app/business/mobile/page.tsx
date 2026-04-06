import type { Metadata } from 'next';
import {
  BizMobileHero,
  BizMobileBundleGrid,
  BizMobileTrustStrip,
  BizMobileComparisonTable,
  BizMobileQuoteForm,
  BizMobileTestimonials,
  BizMobileCTABanner,
  BizMobilePromoBanner,
} from '@/components/business-mobile';

export const metadata: Metadata = {
  title: 'Business Mobile Plans | CircleTel — One Invoice. All Your Connectivity.',
  description:
    'Business mobile plans managed entirely by CircleTel. BusinessMobile, OfficeConnect, WorkConnect Mobile, and FleetConnect — zero CAPEX, one invoice, delivered to your door.',
  openGraph: {
    title: 'Business Mobile Plans | CircleTel',
    description:
      'Skip the telecom queue. Get all your business mobile plans managed by CircleTel — one account, one invoice, delivered to your office.',
    url: 'https://www.circletel.co.za/business/mobile',
  },
};

// Set promoEndsAt to an ISO date string to activate the promo banner,
// or leave undefined to hide it. e.g. '2026-04-30T23:59:00+02:00'
const PROMO_ENDS_AT: string | undefined = undefined;

export default function BusinessMobilePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Promo urgency bar — only renders when PROMO_ENDS_AT is set and in the future */}
      <BizMobilePromoBanner
        promoEndsAt={PROMO_ENDS_AT}
        message="Limited-time pricing active — lock in your rate today."
      />

      {/* 1. Hero — price visible, dual CTA (quote + WhatsApp) */}
      <BizMobileHero />

      {/* 2. Bundle cards — 4 products with pricing above fold */}
      <div id="bundles">
        <BizMobileBundleGrid />
      </div>

      {/* 3. Trust strip — coverage, ICASA, one invoice */}
      <BizMobileTrustStrip />

      {/* 4. Comparison — CircleTel-Managed vs DIY (strongest objection handler) */}
      <BizMobileComparisonTable />

      {/* 5. Lead capture — 3-field form, opens WhatsApp pre-filled */}
      <BizMobileQuoteForm />

      {/* 6. Social proof — 3 customer testimonials near CTA */}
      <BizMobileTestimonials />

      {/* 7. Final CTA — WhatsApp + email */}
      <BizMobileCTABanner />
    </main>
  );
}
