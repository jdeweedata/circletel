'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PartnerHero } from '@/components/partner-landing/PartnerHero';
import { WhatIsSection } from '@/components/partner-landing/WhatIsSection';
import { BenefitCards } from '@/components/partner-landing/BenefitCards';
import { HowItWorks } from '@/components/partner-landing/HowItWorks';
import { Leaderboard } from '@/components/partner-landing/Leaderboard';
import { CommissionCalculator } from '@/components/partner-landing/CommissionCalculator';
import { FAQSection } from '@/components/partner-landing/FAQSection';
import { FinalCTA } from '@/components/partner-landing/FinalCTA';
import { PartnerTestimonials } from '@/components/partner-landing/PartnerTestimonials';

export default function BecomeAPartnerPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero Section - Matching home page style */}
        <PartnerHero />

        {/* What is the Programme */}
        <WhatIsSection />

        {/* Benefits of Joining - Card style matching home */}
        <BenefitCards />

        {/* How It Works */}
        <HowItWorks />

        {/* Commission Calculator */}
        <CommissionCalculator />

        {/* 2025 Leaderboard */}
        <Leaderboard />

        {/* Partner Testimonials */}
        <PartnerTestimonials />

        {/* FAQ Section */}
        <FAQSection />

        {/* Ready to Join CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
