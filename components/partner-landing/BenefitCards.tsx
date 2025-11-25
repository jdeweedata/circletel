'use client';

import { Banknote, Wifi, Smartphone, Users, Headphones, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Banknote,
    title: 'High Commissions',
    stat: '30%',
    description: 'recurring commission on every customer you refer.',
  },
  {
    icon: Wifi,
    title: 'Full Product Range',
    stat: 'Fibre • LTE • 5G',
    description: 'home, business, and rural connectivity solutions.',
  },
  {
    icon: Smartphone,
    title: 'Work From Anywhere',
    stat: '100%',
    description: 'remote. Share links via WhatsApp, social media, or in person.',
  },
  {
    icon: Users,
    title: 'Dedicated Support',
    stat: '1-on-1',
    description: 'partner manager to help you close deals faster.',
  },
  {
    icon: Headphones,
    title: 'Local Support',
    stat: '24/7',
    description: 'South African support team. No overseas call centres.',
  },
  {
    icon: Zap,
    title: 'Fast Onboarding',
    stat: '5 min',
    description: 'to sign up and get your unique referral link.',
  },
];

export function BenefitCards() {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
            Why Partner With CircleTel?
          </h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Everything you need to start earning from day one.
          </p>
        </div>

        {/* Benefits Grid - Matching home page card style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 relative transition-all duration-300 hover:shadow-xl"
              >
                {/* Circular accent in top right */}
                <div className="absolute -top-4 -right-4 bg-circleTel-lightNeutral rounded-full h-12 w-12 flex items-center justify-center border-4 border-white">
                  <span className="text-circleTel-orange font-bold">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-circleTel-orange bg-opacity-10 flex items-center justify-center mb-4">
                  <Icon className="h-7 w-7 text-circleTel-orange" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">
                  {benefit.title}
                </h3>

                {/* Stat */}
                <div className="text-3xl font-bold text-circleTel-orange mb-3">
                  {benefit.stat}
                </div>

                {/* Description */}
                <p className="text-circleTel-secondaryNeutral">
                  {benefit.description}
                </p>

                {/* Network-themed decoration */}
                <div className="absolute bottom-0 right-0 w-16 h-16 opacity-10">
                  <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-circleTel-orange rounded-full"></div>
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
                  <div className="absolute top-3/4 left-3/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
