'use client';
import { PiCheckBold, PiLockBold } from 'react-icons/pi';

import React from 'react';
import { cn } from '@/lib/utils';

export type CheckoutStage =
  | 'coverage'
  | 'packages'
  | 'checkout';

interface Step {
  id: CheckoutStage;
  label: string;
  shortLabel: string;
}

interface CheckoutProgressBarProps {
  currentStage: CheckoutStage;
  className?: string;
}

// 3-step checkout flow: Location -> Choose Plan -> Account & Pay
const CHECKOUT_STEPS: Step[] = [
  { id: 'coverage', label: 'Location', shortLabel: 'Location' },
  { id: 'packages', label: 'Choose Plan', shortLabel: 'Plan' },
  { id: 'checkout', label: 'Account & Pay', shortLabel: 'Pay' },
];

const STAGE_MAPPING: Record<CheckoutStage, CheckoutStage> = {
  coverage: 'coverage',
  packages: 'packages',
  checkout: 'checkout',
};

// Map old numeric step to new stage names for backwards compatibility
export function stepNumberToStage(step: number): CheckoutStage {
  const mapping: Record<number, CheckoutStage> = {
    1: 'packages',
    2: 'checkout',
    3: 'checkout',
  };
  return mapping[step] || 'coverage';
}

export function CheckoutProgressBar({
  currentStage,
  className,
}: CheckoutProgressBarProps) {
  // Map stage to visual stage (e.g., 'verify' -> 'account')
  const visualStage = STAGE_MAPPING[currentStage] || currentStage;
  const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === visualStage);
  const steps = CHECKOUT_STEPS.map((step, index) => ({
    ...step,
    completed: index < currentIndex,
    current: index === currentIndex,
  }));

  return (
    <div className={cn('w-full bg-gradient-to-r from-circleTel-orange via-orange-500 to-circleTel-orange', className)}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Desktop Progress */}
          <div className="hidden md:flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3 relative">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'relative flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300',
                      step.completed
                        ? 'bg-white text-circleTel-orange shadow-md'
                        : step.current
                        ? 'bg-white text-circleTel-orange shadow-lg ring-4 ring-white/30'
                        : 'bg-white/30 text-white/80'
                    )}
                  >
                    {step.completed ? (
                      <PiCheckBold className="w-5 h-5" strokeWidth={3} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        'text-sm font-semibold whitespace-nowrap',
                        step.current || step.completed ? 'text-white' : 'text-white/70'
                      )}
                    >
                      {step.label}
                    </span>
                    {step.current && (
                      <span className="text-xs text-white/80 font-medium">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 relative min-w-[40px]">
                    <div className="absolute inset-0 bg-white/30 rounded-full" />
                    <div
                      className={cn(
                        'absolute inset-0 bg-white rounded-full transition-all duration-500',
                        step.completed ? 'w-full' : 'w-0'
                      )}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Progress */}
          <div className="flex md:hidden items-center justify-between relative">
            {/* Progress Bar Background */}
            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-white/30 -translate-y-1/2">
              <div
                className="h-full bg-white transition-all duration-500 rounded-full"
                style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Step Dots */}
            {steps.map((step, index) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-all duration-300',
                    step.completed
                      ? 'bg-white text-circleTel-orange shadow-md'
                      : step.current
                      ? 'bg-white text-circleTel-orange shadow-lg ring-2 ring-white/30'
                      : 'bg-white/30 text-white/80'
                  )}
                >
                  {step.completed ? (
                    <PiCheckBold className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    step.current || step.completed ? 'text-white' : 'text-white/70'
                  )}
                >
                  {step.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secure Badge - Desktop Only */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <PiLockBold className="w-4 h-4 text-white" />
        <span className="text-sm font-semibold text-white">Secure</span>
      </div>
    </div>
  );
}

export default CheckoutProgressBar;
