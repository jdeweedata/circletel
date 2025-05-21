
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Server, Cloud, Laptop, ShieldCheck } from 'lucide-react';

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Pain Point Statistics Banner */}
        <div className="bg-circleTel-orange bg-opacity-10 rounded-lg p-4 mb-8 text-center">
          <p className="text-circleTel-darkNeutral font-semibold">
            <span className="text-circleTel-orange font-bold">72% of SMEs</span> struggle with IT management — let us take that burden off your shoulders.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Text Content */}
          <div className="w-full md:w-1/2 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-circleTel-darkNeutral">
              We're Here to Make IT Simple and Affordable for Your Business
            </h1>
            <p className="text-xl md:text-2xl text-circleTel-secondaryNeutral mb-5 max-w-xl font-semibold">
              You Grow Your Business, We'll Handle Your Tech
            </p>
            
            {/* Service Highlights */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Server size={20} className="text-circleTel-orange mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">Managed IT</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Laptop size={20} className="text-circleTel-orange mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">WaaS</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Cloud size={20} className="text-circleTel-orange mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">Cloud/Hosting</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <ShieldCheck size={20} className="text-circleTel-orange mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">Fast Support</span>
              </div>
            </div>
            
            <p className="text-lg text-circleTel-secondaryNeutral mb-8 max-w-xl">
              No tech jargon, no hidden costs — just reliable IT solutions that work for your business needs. Let's simplify your tech journey together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="primary-button bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold">
                <Link to="/resources/it-health">Get a Free IT Health Check</Link>
              </Button>
              <Button asChild variant="outline" className="outline-button">
                <Link to="/services">Explore Our IT Solutions</Link>
              </Button>
            </div>
          </div>

          {/* Business Image & Recipe Card Illustration */}
          <div className="w-full md:w-1/2 flex justify-center animate-scale-in">
            <div className="relative">
              {/* South African Business Setting Image */}
              <div className="absolute -z-10 w-full h-full rounded-lg overflow-hidden">
                <div className="w-full h-full bg-circleTel-secondaryNeutral opacity-10"></div>
              </div>
              
              {/* Recipe Card Illustration */}
              <div className="recipe-card w-full max-w-md relative z-10 shadow-xl border-2 bg-white">
                <div className="absolute top-0 right-0 bg-circleTel-orange text-white text-sm font-space-mono py-1 px-3 rounded-bl-lg">
                  SECURE IT RECIPE
                </div>
                
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-6 mb-2">Essential Security Recipe</h3>
                <div className="bg-circleTel-lightNeutral h-1 w-20 mb-4"></div>
                
                <div className="mb-6">
                  <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Ingredients</h4>
                  <ul className="text-circleTel-secondaryNeutral font-space-mono text-sm space-y-3">
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>Next-gen Firewall Protection</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>24/7 Monitoring Services</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>Regular Security Updates</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>Employee Training Program</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-circleTel-lightNeutral p-4 rounded-md">
                  <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Chef's Notes</h4>
                  <p className="text-circleTel-secondaryNeutral font-space-mono text-sm">
                    Perfect for small to mid-sized businesses looking to establish a robust security foundation with minimal hassle.
                  </p>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-5 right-5 -z-10 h-full w-full bg-circleTel-orange opacity-5 rounded-lg transform rotate-3"></div>
              <div className="absolute -bottom-5 -left-5 -z-10 h-full w-full border-2 border-circleTel-orange border-dashed rounded-lg transform -rotate-2"></div>
              
              {/* Network Nodes */}
              <div className="absolute -left-4 top-1/4 h-8 w-8 bg-circleTel-orange rounded-full opacity-70 animate-pulse"></div>
              <div className="absolute -right-4 bottom-1/4 h-6 w-6 bg-circleTel-orange rounded-full opacity-70 animate-pulse"></div>
              <div className="absolute left-1/2 -bottom-4 h-10 w-10 bg-circleTel-orange rounded-full opacity-50 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
