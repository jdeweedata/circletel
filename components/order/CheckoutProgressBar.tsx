'use client';

import React from 'react';
import { PiCheckBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';

export type CheckoutStage = 'packages' | 'checkout';

interface CheckoutProgressBarProps {
  currentStage: CheckoutStage;
  className?: string;
  variant?: 'default' | 'hero';
}

const STEPS: { id: CheckoutStage; label: string }[] = [
  { id: 'packages', label: 'Choose Plan' },
  { id: 'checkout', label: 'Account & Pay' },
];

// Map old numeric step to new stage names for backwards compatibility
export function stepNumberToStage(step: number): CheckoutStage {
  const mapping: Record<number, CheckoutStage> = { 1: 'packages', 2: 'checkout', 3: 'checkout' };
  return mapping[step] || 'packages';
}

export function CheckoutProgressBar({ currentStage, className, variant = 'default' }: CheckoutProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStage);
  const isHero = variant === 'hero';

  return (
    <nav className={cn('flex items-center justify-center gap-3', className)}>
      {STEPS.map((step, index) => {
        const completed = index < currentIndex;
        const active = index === currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2.5">
              {/* Step number dot */}
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold flex-shrink-0 transition-colors',
                  isHero
                    ? completed || active
                      ? 'bg-white/30 text-white'
                      : 'bg-white/20 text-white/50'
                    : completed || active
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {completed ? <PiCheckBold className="w-3.5 h-3.5" /> : index + 1}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  'text-sm whitespace-nowrap transition-colors',
                  isHero
                    ? active
                      ? 'font-semibold text-white'
                      : completed
                      ? 'font-medium text-white/70'
                      : 'font-normal text-white/50'
                    : active
                    ? 'font-semibold text-gray-900'
                    : completed
                    ? 'font-medium text-gray-400'
                    : 'font-normal text-gray-300'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Breadcrumb separator */}
            {index < STEPS.length - 1 && (
              <span className={cn('text-base select-none', isHero ? 'text-white/40' : 'text-gray-300')}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default CheckoutProgressBar;
