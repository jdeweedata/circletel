'use client';

import { FileText, CheckCircle2, GraduationCap, Rocket } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: FileText,
    title: 'Apply',
    description: 'Complete online application',
    detail: '10 minutes to fill in business details and upload FICA documents',
    time: '10 min',
  },
  {
    number: '2',
    icon: CheckCircle2,
    title: 'Get Approved',
    description: 'Compliance verification',
    detail: 'We verify your documents and assign your partner number',
    time: '5-7 days',
  },
  {
    number: '3',
    icon: GraduationCap,
    title: 'Complete Training',
    description: 'Online training modules',
    detail: 'Product knowledge, sales techniques, and portal walkthrough',
    time: '2 hours',
  },
  {
    number: '4',
    icon: Rocket,
    title: 'Start Earning',
    description: 'Access portal and sell',
    detail: 'Generate leads, close deals, and earn monthly commissions',
    time: 'Ongoing',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            How It Works
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            Get started in 4 simple steps and start earning commissions
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-circleTel-orange via-circleTel-orange to-circleTel-orange transform -translate-y-1/2" style={{ width: 'calc(100% - 8rem)', marginLeft: '4rem' }} />

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Mobile Connector */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden absolute left-8 top-20 bottom-0 w-1 bg-circleTel-orange/30 -mb-8" />
                  )}

                  {/* Step Card */}
                  <div className="relative bg-white rounded-2xl p-6 text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100 hover:border-circleTel-orange/30">
                    {/* Step Number Circle */}
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-circleTel-orange to-orange-600 text-white font-bold text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 z-10">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="mb-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-circleTel-orange/10 group-hover:bg-circleTel-orange/20 transition-colors duration-300">
                        <Icon className="h-6 w-6 text-circleTel-orange" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm font-semibold text-circleTel-orange mb-3">
                      {step.description}
                    </p>
                    <p className="text-sm text-circleTel-secondaryNeutral leading-relaxed mb-3">
                      {step.detail}
                    </p>

                    {/* Time Badge */}
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-circleTel-secondaryNeutral">
                      ⏱️ {step.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Below Timeline */}
        <div className="text-center mt-12">
          <p className="text-circleTel-secondaryNeutral mb-6">
            Join 200+ partners already earning with CircleTel
          </p>
          <a
            href="/partner/onboarding"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-circleTel-orange rounded-lg shadow-lg hover:bg-circleTel-orange/90 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Your Application
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
