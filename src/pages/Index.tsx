import React from 'react';
import Hero from '@/components/wifi/Hero';
import TrustStrip from '@/components/wifi/TrustStrip';
import WhyMesh from '@/components/wifi/WhyMesh';
import Packages from '@/components/wifi/Packages';
import HowItWorks from '@/components/wifi/HowItWorks';
import SocialProof from '@/components/wifi/SocialProof';
import Faq from '@/components/wifi/Faq';
import LeadForm from '@/components/wifi/LeadForm';
import Footer from '@/components/layout/Footer';

const Index = () => {
  return (
    <>
      <Hero />
      <TrustStrip />
      <WhyMesh />
      <Packages />
      <HowItWorks />
      <SocialProof />
      <Faq />
      <LeadForm />
      <Footer />
    </>
  );
};

export default Index;
