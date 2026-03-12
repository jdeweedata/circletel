'use client';

import {
  PiMapPinBold,
  PiListChecksBold,
  PiWifiHighBold,
} from 'react-icons/pi';

const steps = [
  {
    number: '01',
    title: 'Check Coverage',
    description:
      'Enter your address to see which services are available at your location. Takes just 30 seconds.',
    icon: PiMapPinBold,
  },
  {
    number: '02',
    title: 'Choose Your Plan',
    description:
      'Select the speed and package that fits your needs. No hidden fees, no surprises.',
    icon: PiListChecksBold,
  },
  {
    number: '03',
    title: 'Get Connected',
    description:
      'Our team handles the installation. Most orders are live within 3-5 business days.',
    icon: PiWifiHighBold,
  },
];

interface ProductHowItWorksProps {
  productSlug?: string;
}

export function ProductHowItWorks({ productSlug }: ProductHowItWorksProps) {
  const coverageLink = productSlug
    ? `/order/coverage?product=${productSlug}`
    : '/order/coverage';

  return (
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            How to Get Started
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Getting connected with CircleTel is simple. Three steps and
            you&apos;re online.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
                )}

                <div className="group bg-white rounded-2xl p-8 text-center border border-slate-200 hover:border-[#F5831F]/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  {/* Step number + Icon combined */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {/* Icon circle */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5831F]/15 to-[#F5831F]/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-10 h-10 text-[#F5831F]" />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#F5831F] text-white text-sm font-bold flex items-center justify-center shadow-md">
                        {step.number}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href={coverageLink}
            className="inline-flex items-center justify-center px-8 py-3 bg-[#F5831F] text-white font-medium rounded-lg hover:bg-[#e0721a] hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Check Your Coverage
          </a>
        </div>
      </div>
    </section>
  );
}
