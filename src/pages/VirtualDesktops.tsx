
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import VirtualDesktopsHero from '../components/virtual-desktops/VirtualDesktopsHero';
import VirtualDesktopsFeatures from '../components/virtual-desktops/VirtualDesktopsFeatures';
import VirtualDesktopsBenefits from '../components/virtual-desktops/VirtualDesktopsBenefits';
import VirtualDesktopsPricing from '../components/virtual-desktops/VirtualDesktopsPricing';
import VirtualDesktopsCTA from '../components/virtual-desktops/VirtualDesktopsCTA';

const VirtualDesktops = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <VirtualDesktopsHero />
        <VirtualDesktopsFeatures />
        <VirtualDesktopsBenefits />
        <VirtualDesktopsPricing />
        <VirtualDesktopsCTA />
      </main>
      <Footer />
    </div>
  );
};

export default VirtualDesktops;
