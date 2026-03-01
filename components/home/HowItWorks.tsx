'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Package, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: MapPin,
    title: 'Check your address',
    description: 'Enter your address to see which plans are available in your area.',
  },
  {
    number: 2,
    icon: Package,
    title: 'Choose your plan',
    description: 'Pick the plan that fits your household or office. No contracts.',
  },
  {
    number: 3,
    icon: Wifi,
    title: 'We install, you connect',
    description: 'Free professional installation within 7 days. Plug in and go.',
  },
];

export function HowItWorks() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="bg-circleTel-grey200 py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-12 md:mb-16">
          Get connected in 3 simple steps
        </h2>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Connecting line - desktop only */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-gray-300" />

            {STEPS.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="w-12 h-12 mb-4 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-circleTel-orange" />
                  </div>

                  {/* Number Circle */}
                  <div className="w-12 h-12 bg-circleTel-orange rounded-full flex items-center justify-center mb-4 z-10">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-circleTel-navy mb-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-sm md:text-base text-circleTel-grey600 max-w-xs">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Button
            onClick={scrollToTop}
            className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg"
          >
            Check Availability
          </Button>
        </div>
      </div>
    </section>
  );
}
