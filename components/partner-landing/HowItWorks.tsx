'use client';

import Link from 'next/link';
import { Link2, Share2, Banknote, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: 1,
    icon: Link2,
    title: 'Get your unique link',
    description: 'Sign up and get your personal referral link that tracks every customer you bring in.',
  },
  {
    number: 2,
    icon: Share2,
    title: 'Share it everywhere',
    description: 'WhatsApp, Facebook, in person—the more people who click, the more you earn.',
  },
  {
    number: 3,
    icon: Banknote,
    title: 'Earn monthly commission',
    description: 'Get paid every month for as long as your referrals stay connected. Passive income, sorted.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-gradient-to-br from-circleTel-darkNeutral via-purple-900 to-circleTel-darkNeutral text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Three simple steps to start earning
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-circleTel-orange text-white font-bold text-xl mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-400 flex items-center justify-center">
                  <Icon className="h-8 w-8 text-gray-900" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-white/80 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/partner/onboarding">
            <Button
              size="lg"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start earning today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
