import { Metadata } from 'next';
import { HeroSection } from '@/components/partner-landing/HeroSection';
import { BenefitCards } from '@/components/partner-landing/BenefitCards';
import { HowItWorks } from '@/components/partner-landing/HowItWorks';
import { PartnershipModels } from '@/components/partner-landing/PartnershipModels';
import { CommissionStructure } from '@/components/partner-landing/CommissionStructure';
import { PartnerTestimonials } from '@/components/partner-landing/PartnerTestimonials';
import { SuccessMetrics } from '@/components/partner-landing/SuccessMetrics';
import { FAQSection } from '@/components/partner-landing/FAQSection';
import { FinalCTA } from '@/components/partner-landing/FinalCTA';

export const metadata: Metadata = {
  title: 'Partner With CircleTel | Digital Service Provider | Build Solutions Together',
  description: 'Partner with a DSP that actually listens. We build digital solutions for underserved markets based on real partner feedback. Join 200+ partners co-creating products that customers need. Blue ocean positioning, 30% recurring commission, real influence on our roadmap.',
  keywords: 'CircleTel partner programme, digital service provider, DSP partner South Africa, blue ocean strategy, partner collaboration, co-create products, underserved markets, telecom partnership',
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

      {/* Partnership Models */}
      <PartnershipModels />

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
