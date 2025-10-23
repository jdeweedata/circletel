'use client';

import { cn } from '@/lib/utils';
import { Lock, CheckCircle2 } from 'lucide-react';

export type SecureSignupStep = 'coverage' | 'package' | 'account';

export interface SecureSignupProgressStep {
  id: SecureSignupStep;
  label: string;
  number: number;
}

export interface SecureSignupProgressProps {
  currentStep: SecureSignupStep;
  steps?: SecureSignupProgressStep[];
  className?: string;
  variant?: 'full' | 'compact' | 'progress-bar' | 'subtle';
  showSecureBadge?: boolean;
}

const defaultSteps: SecureSignupProgressStep[] = [
  { id: 'coverage', label: 'Coverage', number: 1 },
  { id: 'package', label: 'Package', number: 2 },
  { id: 'account', label: 'Account', number: 3 },
];

export function SecureSignupProgress({
  currentStep,
  steps = defaultSteps,
  className,
  variant = 'full',
  showSecureBadge = true,
}: SecureSignupProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  if (variant === 'progress-bar') {
    const progress = ((currentStepIndex + 1) / steps.length) * 100;
    return (
      <div className={cn('w-full', className)}>
        {showSecureBadge && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700 tracking-wide">
              SECURE SIGNUP
            </span>
          </div>
        )}
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-circleTel-orange transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            {steps.map((step) => (
              <span
                key={step.id}
                className={cn(
                  step.id === currentStep && 'font-semibold text-circleTel-orange'
                )}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        {showSecureBadge && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
            <Lock className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700 tracking-wide">
              SECURE
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-all',
                  index < currentStepIndex &&
                    'bg-green-600 border-green-600 text-white',
                  index === currentStepIndex &&
                    'bg-circleTel-orange border-circleTel-orange text-white scale-110',
                  index > currentStepIndex &&
                    'bg-white border-gray-300 text-gray-400'
                )}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5',
                    index < currentStepIndex ? 'bg-green-600' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Subtle variant (like the image - minimal and clean)
  if (variant === 'subtle') {
    return (
      <div className={cn('w-full max-w-2xl mx-auto', className)}>
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: 0 }} />

          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative" style={{ zIndex: 1 }}>
              {/* Circle */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all',
                  'w-10 h-10 text-sm font-medium',
                  index < currentStepIndex &&
                    'bg-green-600 text-white',
                  index === currentStepIndex &&
                    'bg-blue-600 text-white ring-4 ring-blue-100',
                  index > currentStepIndex &&
                    'bg-gray-300 text-gray-600'
                )}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium whitespace-nowrap',
                  index === currentStepIndex
                    ? 'text-gray-900 font-semibold'
                    : index < currentStepIndex
                    ? 'text-green-600'
                    : 'text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={cn('w-full', className)}>
      {showSecureBadge && (
        <div className="flex items-center justify-center gap-2 mb-8">
          <Lock className="h-5 w-5 text-green-600" />
          <span className="text-base font-semibold text-gray-700 tracking-wide">
            SECURE SIGNUP
          </span>
        </div>
      )}
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-4 font-bold transition-all',
                  'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl',
                  index < currentStepIndex &&
                    'bg-green-600 border-green-600 text-white',
                  index === currentStepIndex &&
                    'bg-circleTel-orange border-circleTel-orange text-white shadow-lg scale-110',
                  index > currentStepIndex &&
                    'bg-white border-gray-300 text-gray-400'
                )}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  'mt-3 text-sm md:text-base font-medium',
                  index === currentStepIndex
                    ? 'text-circleTel-orange font-semibold'
                    : index < currentStepIndex
                    ? 'text-green-600'
                    : 'text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-16 md:w-24 lg:w-32 h-1 mx-2 md:mx-4 border-t-2 border-dashed',
                  index < currentStepIndex
                    ? 'border-green-600'
                    : 'border-gray-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
