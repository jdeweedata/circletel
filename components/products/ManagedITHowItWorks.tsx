'use client';

import {
    PiMagnifyingGlassBold,
    PiHandshakeBold,
    PiRocketLaunchBold,
} from 'react-icons/pi';
import { ConsultationForm } from './ConsultationForm';

const steps = [
    {
        number: '01',
        title: 'Discovery & Audit',
        description:
            'We assess your current IT environment, identify vulnerabilities, and map out your specific business requirements.',
        icon: PiMagnifyingGlassBold,
    },
    {
        number: '02',
        title: 'Custom Proposal',
        description:
            'You receive a tailored plan covering connectivity, security, Microsoft 365, and support—all structured into one predictable monthly cost.',
        icon: PiHandshakeBold,
    },
    {
        number: '03',
        title: 'Onboarding & Migration',
        description:
            'Our Microsoft-certified team handles the entire technical transition with zero downtime for your business operations.',
        icon: PiRocketLaunchBold,
    },
];

interface ManagedITHowItWorksProps {
    productSlug?: string;
}

export function ManagedITHowItWorks({ productSlug }: ManagedITHowItWorksProps) {
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
                        Partnering with CircleTel for Managed IT is simple. Three steps to
                        secure, worry-free technology.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, index) => {
                        const IconComponent = step.icon;
                        return (
                            <div key={step.number} className="relative">
                                {/* Connector line (desktop only) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#F5831F]/30 to-[#F5831F]/10" />
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
                    <ConsultationForm>
                        <button
                            className="inline-flex items-center justify-center px-8 py-3 bg-[#F5831F] text-white font-medium rounded-lg hover:bg-[#e0721a] hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Request a Consultation
                        </button>
                    </ConsultationForm>
                </div>
            </div>
        </section>
    );
}
