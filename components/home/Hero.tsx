'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Server, Battery } from 'lucide-react';
import { CoverageChecker } from '@/components/coverage/CoverageChecker';

export function Hero() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Text Content */}
          <div className="w-full md:w-1/2 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-circleTel-darkNeutral">
              Empowering SMEs, SOHOs, and Homes with Reliable Tech
            </h1>
            <p className="text-xl md:text-2xl text-circleTel-secondaryNeutral mb-5 max-w-xl font-semibold">
              High-Speed Wireless and Fibre Internet, Proactive IT, and Data Resilience
            </p>

            <p className="text-lg text-circleTel-secondaryNeutral mb-8 max-w-xl">
              No tech jargon, no hidden costs — just reliable IT solutions that work for South African businesses.
              <strong> Serving urban and rural communities across South Africa.</strong>
            </p>

            {/* Single Primary CTA */}
            <div className="flex justify-center md:justify-start">
              <Button
                asChild
                size="lg"
                className="primary-button bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold text-lg px-8"
              >
                <a href="#coverage-check">Check Coverage Now</a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-circleTel-secondaryNeutral">
              <div className="flex items-center">
                <ShieldCheck size={16} className="text-green-500 mr-1" />
                <span>POPIA Compliant</span>
              </div>
              <div className="flex items-center">
                <Server size={16} className="text-blue-500 mr-1" />
                <span>Reliable Network Partners</span>
              </div>
              <div className="flex items-center">
                <Battery size={16} className="text-circleTel-orange mr-1" />
                <span>Power Outage Ready</span>
              </div>
            </div>
          </div>

          {/* Coverage Checker */}
          <div id="coverage-check" className="w-full md:w-1/2 flex justify-center animate-scale-in scroll-mt-20">
            <div className="relative w-full max-w-md">
              <CoverageChecker
                className="relative z-10 shadow-xl border-2 bg-white rounded-lg"
                onCoverageFound={(services) => {
                  console.log('Services available:', services);
                  // Navigate to packages page with leadId
                  if (services.leadId) {
                    window.location.href = `/packages/${services.leadId}`;
                  } else {
                    window.location.href = '/bundles';
                  }
                }}
                onNoCoverage={() => {
                  console.log('No coverage - capture lead');
                  // Could show a lead capture modal here
                }}
              />

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
}