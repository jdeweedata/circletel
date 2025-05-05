
import React from 'react';
import { Link } from 'react-router-dom';
import { WifiHigh } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConnectivityHero = () => {
  return (
    <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-circleTel-darkNeutral mb-4">
              Cook Up Seamless Connectivity with CircleTel
            </h1>
            <p className="text-lg md:text-xl text-circleTel-secondaryNeutral mb-8">
              Wi-Fi as a Service, Fixed Wireless, and Fibre solutions tailored for your business
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => {
                  document.getElementById('recipes-section')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                variant="outline" 
                className="outline-button"
              >
                Explore Connectivity Recipes
              </Button>
              <Button asChild className="primary-button">
                <Link to="/resources/it-health">Get a Free Connectivity Assessment</Link>
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-circleTel-lightNeutral rounded-lg p-6 md:p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-circleTel-orange rounded-full p-3 mr-3 text-white">
                  <WifiHigh size={24} />
                </div>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral">Wi-Fi as a Service Recipe</h3>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-circleTel-orange rounded-full mr-2"></span>
                  <p className="text-circleTel-secondaryNeutral">Cloud-managed infrastructure</p>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-circleTel-orange rounded-full mr-2"></span>
                  <p className="text-circleTel-secondaryNeutral">Enterprise-grade security</p>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-circleTel-orange rounded-full mr-2"></span>
                  <p className="text-circleTel-secondaryNeutral">24/7 proactive monitoring</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-space-mono text-sm text-circleTel-secondaryNeutral">From</p>
                  <p className="font-bold text-circleTel-darkNeutral">ZAR 2,000/month</p>
                </div>
                <div className="flex bg-circleTel-orange text-white rounded-full h-16 w-16 items-center justify-center">
                  <span className="font-space-mono text-sm">1Gbps</span>
                </div>
              </div>
            </div>
            
            {/* Network node illustrations */}
            <div className="absolute -z-10 top-10 -right-10 h-20 w-20 bg-circleTel-orange rounded-full opacity-10"></div>
            <div className="absolute -z-10 -bottom-6 -left-6 h-16 w-16 bg-circleTel-orange rounded-full opacity-20"></div>
            <div className="absolute -z-10 top-1/2 -right-4 h-12 w-12 bg-circleTel-orange rounded-full opacity-15"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConnectivityHero;
