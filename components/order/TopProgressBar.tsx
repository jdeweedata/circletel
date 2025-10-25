'use client';

import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  completed: boolean;
  current: boolean;
}

interface TopProgressBarProps {
  currentStep: number;
}

export function TopProgressBar({ currentStep }: TopProgressBarProps) {
  const steps: Step[] = [
    {
      id: 1,
      label: 'Create Account',
      completed: currentStep > 1,
      current: currentStep === 1,
    },
    {
      id: 2,
      label: 'Service Address',
      completed: currentStep > 2,
      current: currentStep === 2,
    },
    {
      id: 3,
      label: 'Payment',
      completed: currentStep > 3,
      current: currentStep === 3,
    },
    {
      id: 4,
      label: 'Order Confirmation',
      completed: currentStep > 4,
      current: currentStep === 4,
    },
  ];

  return (
    <div className="bg-circleTel-orange text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-4 max-w-screen-2xl mx-auto">
          {/* Progress Steps - Desktop */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3 xl:space-x-4 flex-1 justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2 lg:gap-3">
                  {/* Step Number */}
                  <div className={`
                    flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-full font-bold text-sm
                    transition-all duration-200
                    ${step.completed
                      ? 'bg-white text-circleTel-orange'
                      : step.current
                      ? 'bg-white text-circleTel-orange ring-2 ring-white/50'
                      : 'bg-white/20 text-white/70'
                    }
                  `}>
                    {step.id}
                  </div>

                  {/* Step Label */}
                  <span className={`text-xs md:text-sm lg:text-base transition-all duration-200 whitespace-nowrap ${
                    step.current ? 'font-bold' : 'font-medium'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white/60 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Progress Steps - Mobile (simplified) */}
          <div className="flex md:hidden items-center gap-2 flex-1 max-w-xs">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-2 flex-1"
              >
                <div className={`
                  flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs
                  ${step.completed || step.current ? 'bg-white text-circleTel-orange' : 'bg-white/20 text-white/70'}
                `}>
                  {step.id}
                </div>
                {step.current && (
                  <span className="text-xs font-medium truncate">{step.label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Secure Checkout Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full flex-shrink-0">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Secure Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
