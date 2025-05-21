
import React from 'react';
import { WifiHigh, MessageSquarePlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const WifiHero = () => {
  return (
    <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-circleTel-darkNeutral mb-4">
              Fast, secure Wi-Fi without the setup stress
            </h1>
            <p className="text-lg md:text-xl text-circleTel-secondaryNeutral mb-6">
              Enterprise-grade Wi-Fi that boosts productivity with reliable connectivity. Hardware, installation, management, and monitoring in one monthly fee.
            </p>
            <div className="bg-circleTel-lightNeutral rounded-lg p-4 mb-6">
              <p className="font-space-mono text-sm text-circleTel-secondaryNeutral mb-1">Starting from</p>
              <p className="text-3xl font-bold text-circleTel-darkNeutral">R1,200/month</p>
              <p className="font-space-mono text-xs text-circleTel-secondaryNeutral">(10 devices)</p>
            </div>
            <Button asChild className="primary-button flex items-center gap-2 mb-8 md:mb-0">
              <Link to="/contact">
                <MessageSquarePlus size={18} />
                Get a Custom Wi-Fi Plan
              </Link>
            </Button>
          </div>
          
          <div className="relative bg-white rounded-lg p-6 shadow-lg border border-circleTel-orange mt-8 md:mt-0">
            <div className="flex items-center mb-4">
              <div className="bg-circleTel-orange rounded-full p-3 mr-3 text-white">
                <WifiHigh size={24} />
              </div>
              <h3 className="text-xl font-bold text-circleTel-darkNeutral">Perfect For</h3>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                <span className="text-circleTel-secondaryNeutral">Retail stores requiring reliable guest Wi-Fi</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                <span className="text-circleTel-secondaryNeutral">Multi-location businesses needing consistent Wi-Fi</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                <span className="text-circleTel-secondaryNeutral">Growing companies that need scalable solutions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-circleTel-orange mr-2 mt-1" size={18} />
                <span className="text-circleTel-secondaryNeutral">Businesses without dedicated IT staff</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WifiHero;
