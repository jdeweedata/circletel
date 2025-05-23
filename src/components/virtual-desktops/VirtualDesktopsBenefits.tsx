
import React from 'react';
import { TrendingDown, Settings, Users, Clock } from 'lucide-react';

const VirtualDesktopsBenefits = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Business Benefits</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Virtual desktops deliver significant advantages for South African businesses looking to optimize their IT infrastructure.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="bg-circleTel-lightNeutral rounded-full p-4 inline-flex mb-4">
              <TrendingDown className="text-circleTel-orange h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-2">Cost Reduction</h3>
            <p className="text-circleTel-secondaryNeutral">
              Lower hardware costs as employees can use less expensive devices. Extend the life of existing hardware.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-circleTel-lightNeutral rounded-full p-4 inline-flex mb-4">
              <Settings className="text-circleTel-orange h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-2">Simplified Management</h3>
            <p className="text-circleTel-secondaryNeutral">
              Deploy, maintain, and troubleshoot from a central location. Reduce the IT burden on your team.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-circleTel-lightNeutral rounded-full p-4 inline-flex mb-4">
              <Users className="text-circleTel-orange h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-2">Enhanced Collaboration</h3>
            <p className="text-circleTel-secondaryNeutral">
              Improve team productivity with consistent tools and seamless access to shared resources.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-circleTel-lightNeutral rounded-full p-4 inline-flex mb-4">
              <Clock className="text-circleTel-orange h-8 w-8" />
            </div>
            <h3 className="font-bold text-xl mb-2">Business Continuity</h3>
            <p className="text-circleTel-secondaryNeutral">
              Maintain operations during disruptions like load shedding or office closures with anytime, anywhere access.
            </p>
          </div>
        </div>
        
        <div className="mt-12 bg-circleTel-lightNeutral p-6 rounded-lg">
          <h3 className="font-bold text-xl mb-3 text-center">Perfect For South African Businesses</h3>
          <p className="text-center text-circleTel-secondaryNeutral mb-6">
            Our virtual desktop solutions are specifically optimized for South African business conditions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-center mb-2">Load Shedding Resilience</h4>
              <p className="text-sm text-center">
                Continue working during power outages by accessing your desktop from any location with power and internet.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-center mb-2">Bandwidth Optimized</h4>
              <p className="text-sm text-center">
                Designed to work efficiently with South African internet connections, minimizing data usage.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-center mb-2">Local Support</h4>
              <p className="text-sm text-center">
                24/7 support from our South African team who understand local business challenges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VirtualDesktopsBenefits;
