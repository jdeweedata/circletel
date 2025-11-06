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
  title: 'CircleTel Partner Programme | Earn Recurring Commission | Join Today',
  description: 'Become a CircleTel partner and earn 25-30% recurring commission selling South Africa\'s best connectivity. Full training, marketing support, and dedicated account manager. Apply online in 10 minutes.',
  keywords: 'CircleTel partner programme, ISP partner South Africa, fibre reseller, telecom agent commission, earn commission selling fibre',
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
