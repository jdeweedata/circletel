
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingHero from '@/components/pricing/PricingHero';
import PricingTables from '@/components/pricing/PricingTables';
import PricingComparison from '@/components/pricing/PricingComparison';
import PricingFAQ from '@/components/pricing/PricingFAQ';
import PricingCTA from '@/components/pricing/PricingCTA';

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <PricingHero />
        <PricingTables />
        <PricingComparison />
        <PricingFAQ />
        <PricingCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
