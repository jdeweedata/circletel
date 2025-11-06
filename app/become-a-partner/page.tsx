import { Metadata } from 'next';
import { HeroSection } from '@/components/partner-landing/HeroSection';
import { BenefitCards } from '@/components/partner-landing/BenefitCards';
import { HowItWorks } from '@/components/partner-landing/HowItWorks';
import { CommissionStructure } from '@/components/partner-landing/CommissionStructure';
import { PartnerTestimonials } from '@/components/partner-landing/PartnerTestimonials';
import { SuccessMetrics } from '@/components/partner-landing/SuccessMetrics';
import { FAQSection } from '@/components/partner-landing/FAQSection';
import { FinalCTA } from '@/components/partner-landing/FinalCTA';

export const metadata: Metadata = {
  title: 'Join CircleTel Partner Network | Now Hiring | Earn Up To 30% Commission',
  description: 'We are actively recruiting partners across South Africa! Earn up to 30% recurring commission selling premium connectivity. Fast-track approval, zero upfront costs, full training included. Apply now and start earning within 7 days.',
  keywords: 'CircleTel partner programme, ISP partner South Africa, fibre reseller, now hiring partners, telecom agent commission, earn commission selling fibre, partner recruitment',
};

export default function BecomeAPartnerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Key Benefits */}
      <BenefitCards />

      {/* How It Works */}
      <HowItWorks />

      {/* Success Metrics */}
      <SuccessMetrics />

      {/* Commission Structure Table */}
      <CommissionStructure />

      {/* Partner Testimonials */}
      <PartnerTestimonials />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}
