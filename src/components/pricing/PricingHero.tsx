
import React from 'react';
import { Button } from '@/components/ui/button';

const PricingHero = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
            Transparent IT Pricing for Your Business
          </h1>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-2xl mb-8">
            Choose a recipe or build your own—clear costs, no surprises. Our pricing is designed to scale with your business needs.
          </p>
          <Button 
            size="lg"
            className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white rounded-full"
            onClick={() => document.getElementById('custom-quote')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Request a Custom Quote
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingHero;
