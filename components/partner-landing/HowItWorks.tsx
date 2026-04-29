'use client';
import { PiLinkBold, PiMoneyBold, PiShareBold } from 'react-icons/pi';

const steps = [
  {
    number: 1,
    icon: PiLinkBold,
    title: 'Get your unique link',
    description: 'Sign up and get your personal referral link that tracks every customer you bring in.',
  },
  {
    number: 2,
    icon: PiShareBold,
    title: 'Share it everywhere',
    description: 'WhatsApp, Facebook, in person—the more people who click, the more you earn.',
  },
  {
    number: 3,
    icon: PiMoneyBold,
    title: 'Earn monthly commission',
    description: 'Get paid every month for as long as your referrals stay connected. Passive income, sorted.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-circleTel-grey200">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-navy mb-4">
            How It Works
          </h2>
          <p className="text-circleTel-grey600 max-w-2xl mx-auto">
            Three simple steps to start earning
          </p>
        </div>

        {/* Steps - Horizontal Flow */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-circleTel-orange/30" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative text-center">
                  {/* Step Number Circle */}
                  <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-full bg-circleTel-orange text-white font-bold text-xl mb-6 shadow-lg">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 mx-auto mb-4 text-circleTel-navy">
                    <Icon className="w-full h-full" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-circleTel-navy mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-circleTel-grey600 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
