
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Server, Cloud, Laptop, ShieldCheck, Wifi, Battery } from 'lucide-react';

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral overflow-hidden">
      <div className="container mx-auto px-4">
        {/* South African SME-Focused Pain Point Banner */}
        <div className="bg-gradient-to-r from-circleTel-orange/10 to-orange-100 rounded-lg p-4 mb-8 text-center border border-circleTel-orange/20">
          <p className="text-circleTel-darkNeutral font-semibold">
            <span className="text-circleTel-orange font-bold">Affordable, Uninterrupted Business & Home Tech for South Africa:</span>
          </p>
          <p className="text-circleTel-secondaryNeutral mt-1">
            FWA, IT, and Resilience Solutions for Urban & Rural Communities
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Text Content */}
          <div className="w-full md:w-1/2 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-circleTel-darkNeutral">
              Empowering SMEs, SOHOs, and Homes with Reliable Tech
            </h1>
            <p className="text-xl md:text-2xl text-circleTel-secondaryNeutral mb-5 max-w-xl font-semibold">
              MTN-Powered FWA, Proactive IT, and Data Resilience
            </p>
            
            {/* Service Highlights - Updated to focus on bundles */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Link to="/bundles/business-connect" className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm hover:bg-circleTel-lightNeutral border border-circleTel-orange/20">
                <Server size={20} className="text-circleTel-orange mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">Business Connect</span>
              </Link>
              <Link to="/bundles/business-pro" className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm hover:bg-circleTel-lightNeutral border border-circleTel-orange/20">
                <Wifi size={20} className="text-circleTel-orange mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">Business Pro</span>
              </Link>
              <Link to="/bundles/home-soho-resilience" className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm hover:bg-circleTel-lightNeutral border border-blue-500/20">
                <Cloud size={20} className="text-blue-500 mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">Home & SOHO</span>
              </Link>
              <Link to="/resources/power-backup" className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm hover:bg-circleTel-lightNeutral border border-circleTel-orange/20">
                <Battery size={20} className="text-circleTel-orange mr-2" />
                <span className="text-circleTel-secondaryNeutral font-medium">Load Shedding Solutions</span>
              </Link>
            </div>
            
            <p className="text-lg text-circleTel-secondaryNeutral mb-8 max-w-xl">
              No tech jargon, no hidden costs — just reliable IT solutions that work for South African businesses. 
              <strong> Serving urban and rural communities across Gauteng, KZN, and Western Cape.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="primary-button bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold">
                <Link to="/resources/it-health">Get Your Free Resilience Assessment</Link>
              </Button>
              <Button asChild variant="outline" className="outline-button">
                <Link to="/bundles">Explore Our Bundles</Link>
              </Button>
            </div>
            
            {/* Added trust indicators */}
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-circleTel-secondaryNeutral">
              <div className="flex items-center">
                <ShieldCheck size={16} className="text-green-500 mr-1" />
                <span>POPIA Compliant</span>
              </div>
              <div className="flex items-center">
                <Server size={16} className="text-blue-500 mr-1" />
                <span>MTN FWA Partner</span>
              </div>
              <div className="flex items-center">
                <Battery size={16} className="text-circleTel-orange mr-1" />
                <span>Load Shedding Ready</span>
              </div>
            </div>
          </div>

          {/* Business Image & Recipe Card Illustration */}
          <div className="w-full md:w-1/2 flex justify-center animate-scale-in">
            <div className="relative">
              {/* Recipe Card Illustration - Updated for South African market */}
              <div className="recipe-card w-full max-w-md relative z-10 shadow-xl border-2 bg-white">
                <div className="absolute top-0 right-0 bg-circleTel-orange text-white text-sm font-space-mono py-1 px-3 rounded-bl-lg">
                  SOUTH AFRICA READY
                </div>
                
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mt-6 mb-2">Business Pro Bundle Recipe</h3>
                <div className="bg-circleTel-lightNeutral h-1 w-20 mb-4"></div>
                
                <div className="mb-6">
                  <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Ingredients</h4>
                  <ul className="text-circleTel-secondaryNeutral font-space-mono text-sm space-y-3">
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>100Mbps MTN Fixed Wireless</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>Managed UPS for Load Shedding</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>Proactive IT Monitoring</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-3 w-3 bg-circleTel-orange rounded-full mr-2"></div>
                      <span>2GB Acronis Cloud Backup</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-circleTel-lightNeutral p-4 rounded-md">
                  <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Chef's Notes</h4>
                  <p className="text-circleTel-secondaryNeutral font-space-mono text-sm">
                    Perfect for South African businesses dealing with power outages and connectivity challenges. 
                    Keeps your business running during electrical disruptions. R1,999/month.
                  </p>
                </div>
                
                <div className="mt-4 text-center">
                  <Button asChild size="sm" className="primary-button">
                    <Link to="/bundles/business-pro">Learn More</Link>
                  </Button>
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
