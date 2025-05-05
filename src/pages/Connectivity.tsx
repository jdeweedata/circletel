
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ConnectivityHero from '../components/connectivity/ConnectivityHero';
import ConnectivityRecipes from '../components/connectivity/ConnectivityRecipes';
import ConnectivityBenefits from '../components/connectivity/ConnectivityBenefits';
import ConnectivityTool from '../components/connectivity/ConnectivityTool';
import ConnectivityTestimonials from '../components/connectivity/ConnectivityTestimonials';
import ConnectivityComparison from '../components/connectivity/ConnectivityComparison';

const Connectivity = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <ConnectivityHero />
        <ConnectivityRecipes />
        <ConnectivityComparison />
        <ConnectivityBenefits />
        <ConnectivityTool />
        <ConnectivityTestimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Connectivity;
