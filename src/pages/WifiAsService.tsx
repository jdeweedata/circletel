
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import WifiHero from '../components/wifi/WifiHero';
import WifiDescription from '../components/wifi/WifiDescription';
import WifiFeatures from '../components/wifi/WifiFeatures';
import WifiBenefits from '../components/wifi/WifiBenefits';
import WifiProcess from '../components/wifi/WifiProcess';

const WifiAsService = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <WifiHero />
        <WifiDescription />
        <WifiFeatures />
        <WifiBenefits />
        <WifiProcess />
      </main>
      <Footer />
    </div>
  );
};

export default WifiAsService;
