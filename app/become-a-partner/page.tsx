'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerHero } from '@/components/partner-landing/PartnerHero';
import { CommissionCalculator } from '@/components/partner-landing/CommissionCalculator';
import { BenefitCards } from '@/components/partner-landing/BenefitCards';
import { NetworkCredibility } from '@/components/partner-landing/NetworkCredibility';
import { HowItWorks } from '@/components/partner-landing/HowItWorks';
import { Leaderboard } from '@/components/partner-landing/Leaderboard';
import { PartnerTestimonials } from '@/components/partner-landing/PartnerTestimonials';
import { FAQSection } from '@/components/partner-landing/FAQSection';
import { FinalCTA } from '@/components/partner-landing/FinalCTA';

export default function BecomeAPartnerPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* 1. Hero - Hook with headline + dual CTAs */}
        <PartnerHero />

        {/* 2. Calculator - Emotional hook (moved up from section 4) */}
        <CommissionCalculator />

        {/* 3. Benefits - Why partner with CircleTel */}
        <BenefitCards />

        {/* 4. Network Credibility - Infrastructure trust signals */}
        <NetworkCredibility />

        {/* 5. How It Works - 3 simple steps */}
        <HowItWorks />

        {/* 5. Leaderboard - Social proof (real earnings) */}
        <Leaderboard />

        {/* 6. Testimonials - Partner stories */}
        <PartnerTestimonials />

        {/* 7. FAQ - Objection handling */}
        <FAQSection />

        {/* 8. Final CTA - Close with dual CTAs */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
