import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PromoBanner } from '@/components/business-mobile-deals/PromoBanner'
import { BusinessDealsHero } from '@/components/business-mobile-deals/BusinessDealsHero'
import { PlanTiles } from '@/components/business-mobile-deals/PlanTiles'
import { PlanFeaturePanel } from '@/components/business-mobile-deals/PlanFeaturePanel'
import { FeaturedDeviceGrid } from '@/components/business-mobile-deals/FeaturedDeviceGrid'
import { HardwareAddOnStrip } from '@/components/business-mobile-deals/HardwareAddOnStrip'
import { BusinessDealsCTA } from '@/components/business-mobile-deals/BusinessDealsCTA'
import { TermsFootnote } from '@/components/business-mobile-deals/TermsFootnote'

export const metadata: Metadata = {
  title: 'Business Mobile & LTE Deals | April 2026 | CircleTel',
  description:
    'MTN Enterprise mobile, LTE and hardware deals from CircleTel. Featured iPhone 17, Galaxy S26 Ultra, Huawei Mate 80 Pro and more. Contract from R129/mo or buy outright. Valid until 6 May 2026.',
  openGraph: {
    title: 'Business Mobile & LTE Deals | April 2026 | CircleTel',
    description:
      'MTN Enterprise mobile, LTE and hardware deals from CircleTel. Contract from R129/mo or buy outright. Valid until 6 May 2026.',
    images: ['/images/business-deals/og-image.jpg'],
  },
}

export default function BusinessMobileDealsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PromoBanner />
        <BusinessDealsHero />
        <section className="container mx-auto max-w-5xl px-4 py-10">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <PlanTiles />
            </div>
            <div className="lg:col-span-1">
              <PlanFeaturePanel />
            </div>
          </div>
        </section>
        <FeaturedDeviceGrid />
        <HardwareAddOnStrip />
        <BusinessDealsCTA />
        <TermsFootnote />
      </main>
      <Footer />
    </div>
  )
}
