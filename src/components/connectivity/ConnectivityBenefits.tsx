
import React from 'react';
import { WifiHigh, Shield, CircleArrowUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const BenefitCard = ({ icon, title, description }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) => {
  return (
    <Card className="border-circleTel-orange hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6 text-center">
        <div className="mb-4 mx-auto bg-circleTel-lightNeutral rounded-full p-4 w-16 h-16 flex items-center justify-center text-circleTel-orange">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">{title}</h3>
        <p className="text-circleTel-secondaryNeutral font-space-mono text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};

const ConnectivityBenefits = () => {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral text-center mb-8">
          Why Choose CircleTel Connectivity?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <BenefitCard 
            icon={<CircleArrowUp size={28} />}
            title="Scalability" 
            description="Grow from 10 to 1000 devices with ease. Our solutions scale with your business needs without requiring complete infrastructure overhauls."
          />
          <BenefitCard 
            icon={<WifiHigh size={28} />}
            title="Reliability" 
            description="99.9% uptime guaranteed with proactive monitoring. We ensure your connectivity is always available when you need it most."
          />
          <BenefitCard 
            icon={<Shield size={28} />}
            title="Security" 
            description="Advanced firewalls and encryption for all solutions. Your network traffic is protected against modern threats and vulnerabilities."
          />
        </div>
        
        {/* Network illustration */}
        <div className="mt-16 relative">
          <div className="absolute w-full h-full flex justify-around items-center opacity-10 -z-10">
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} className="bg-circleTel-orange rounded-full h-6 w-6"></div>
            ))}
          </div>
          
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-center">
              <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">
                Expert Management & Monitoring
              </h3>
              <p className="text-circleTel-secondaryNeutral mb-6">
                All our connectivity solutions come with expert management and monitoring. 
                We handle the technical details, so you can focus on your business.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-circleTel-lightNeutral p-4">
                  <p className="font-space-mono text-sm text-circleTel-secondaryNeutral">Network Uptime</p>
                  <p className="text-2xl font-bold text-circleTel-darkNeutral">99.9%</p>
                </div>
                <div className="rounded-lg bg-circleTel-lightNeutral p-4">
                  <p className="font-space-mono text-sm text-circleTel-secondaryNeutral">Response Time</p>
                  <p className="text-2xl font-bold text-circleTel-darkNeutral">&lt;15 min</p>
                </div>
                <div className="rounded-lg bg-circleTel-lightNeutral p-4">
                  <p className="font-space-mono text-sm text-circleTel-secondaryNeutral">Support</p>
                  <p className="text-2xl font-bold text-circleTel-darkNeutral">24/7/365</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConnectivityBenefits;
