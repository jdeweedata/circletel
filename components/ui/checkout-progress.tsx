'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type CheckoutStep = 'package' | 'account' | 'payment';

export interface CheckoutProgressProps {
  currentStep: CheckoutStep;
  steps?: {
    id: CheckoutStep;
    label: string;
    completed?: boolean;
  }[];
  className?: string;
  onStepClick?: (step: CheckoutStep) => void;
  allowNavigation?: boolean;
}

const defaultSteps = [
  { id: 'package' as CheckoutStep, label: 'Choose Package' },
  { id: 'account' as CheckoutStep, label: 'Create Account' },
  { id: 'payment' as CheckoutStep, label: 'Secure Checkout' },
];

/**
 * CheckoutProgress Component
 *
 * Step indicator for multi-step checkout process.
 * Based on WebAfrica's 3-step progress pattern.
 *
 * Features:
 * - Visual step indicators with connecting lines
 * - Active, completed, and pending states
 * - Checkmarks for completed steps
 * - Optional click navigation (if allowNavigation=true)
 * - Responsive design (stacks on mobile)
 * - Accessibility with ARIA labels
 *
 * @example
 * ```tsx
 * <CheckoutProgress
 *   currentStep="account"
 *   onStepClick={(step) => navigateTo(step)}
 *   allowNavigation={true}
 * />
 * ```
 */
export function CheckoutProgress({
  currentStep,
  steps = defaultSteps,
  className,
  onStepClick,
  allowNavigation = false,
}: CheckoutProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const isStepCompleted = (stepIndex: number) => {
    return stepIndex < currentStepIndex || steps[stepIndex].completed;
  };

  const isStepActive = (stepIndex: number) => {
    return stepIndex === currentStepIndex;
  };

  const isStepClickable = (stepIndex: number) => {
    return allowNavigation && (isStepCompleted(stepIndex) || isStepActive(stepIndex));
  };

  return (
    <nav
      className={cn('w-full', className)}
      aria-label="Checkout progress"
      role="navigation"
    >
      <ol className="flex items-center justify-center gap-2 md:gap-4">
        {steps.map((step, index) => {
          const completed = isStepCompleted(index);
          const active = isStepActive(index);
          const clickable = isStepClickable(index);

          return (
            <li key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => clickable && onStepClick?.(step.id)}
                  disabled={!clickable}
                  className={cn(
                    'flex items-center gap-2 transition-all',
                    clickable && 'cursor-pointer hover:opacity-80',
                    !clickable && 'cursor-default'
                  )}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Step ${index + 1}: ${step.label}${
                    completed ? ' (completed)' : active ? ' (current)' : ''
                  }`}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all',
                      // Completed state
                      completed &&
                        'bg-green-600 text-white shadow-md',
                      // Active state
                      active &&
                        !completed &&
                        'bg-circleTel-orange text-white shadow-lg ring-4 ring-circleTel-orange/20',
                      // Pending state
                      !completed &&
                        !active &&
                        'bg-gray-200 text-gray-600'
                    )}
                  >
                    {completed ? (
                      <Check className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors hidden md:inline',
                      active && 'text-circleTel-darkNeutral font-semibold',
                      completed && 'text-green-700',
                      !completed && !active && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-8 md:w-16 h-1 mx-2 transition-all',
                    completed
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile Step Labels (Below circles) */}
      <div className="flex justify-center gap-4 mt-3 md:hidden">
        {steps.map((step, index) => {
          const completed = isStepCompleted(index);
          const active = isStepActive(index);

          return (
            <div
              key={`${step.id}-label`}
              className={cn(
                'text-xs font-medium text-center transition-colors',
                active && 'text-circleTel-darkNeutral font-semibold',
                completed && 'text-green-700',
                !completed && !active && 'text-gray-500'
              )}
            >
              {step.label}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * CompactCheckoutProgress Component
 *
 * Minimal version with just step numbers and connecting lines.
 * Useful for space-constrained layouts.
 *
 * @example
 * ```tsx
 * <CompactCheckoutProgress currentStep="payment" />
 * ```
 */
export function CompactCheckoutProgress({
  currentStep,
  steps = defaultSteps,
  className,
}: Pick<CheckoutProgressProps, 'currentStep' | 'steps' | 'className'>) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="navigation"
      aria-label="Checkout progress"
    >
      {steps.map((step, index) => {
        const completed = index < currentStepIndex;
        const active = index === currentStepIndex;

        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                completed && 'bg-green-600 text-white',
                active && 'bg-circleTel-orange text-white ring-2 ring-circleTel-orange/20',
                !completed && !active && 'bg-gray-300 text-gray-600'
              )}
              aria-label={`Step ${index + 1}`}
              aria-current={active ? 'step' : undefined}
            >
              {completed ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-6 h-0.5 transition-all',
                  completed ? 'bg-green-600' : 'bg-gray-300'
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * VerticalCheckoutProgress Component
 *
 * Vertical step indicator for sidebar placement.
 * Shows step details in a vertical list format.
 *
 * @example
 * ```tsx
 * <VerticalCheckoutProgress
 *   currentStep="account"
 *   steps={[
 *     { id: 'package', label: 'Choose Package', description: 'Select your fibre package' },
 *     { id: 'account', label: 'Create Account', description: 'Enter your details' },
 *     { id: 'payment', label: 'Secure Checkout', description: 'Complete payment' },
 *   ]}
 * />
 * ```
 */
interface VerticalStepWithDescription extends Omit<CheckoutProgressProps['steps'][0], 'id'> {
  id: CheckoutStep;
  description?: string;
}

interface VerticalCheckoutProgressProps extends Omit<CheckoutProgressProps, 'steps'> {
  steps?: VerticalStepWithDescription[];
}

export function VerticalCheckoutProgress({
  currentStep,
  steps = defaultSteps as VerticalStepWithDescription[],
  className,
  onStepClick,
  allowNavigation = false,
}: VerticalCheckoutProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const isStepCompleted = (stepIndex: number) => {
    return stepIndex < currentStepIndex || steps[stepIndex].completed;
  };

  const isStepActive = (stepIndex: number) => {
    return stepIndex === currentStepIndex;
  };

  const isStepClickable = (stepIndex: number) => {
    return allowNavigation && (isStepCompleted(stepIndex) || isStepActive(stepIndex));
  };

  return (
    <nav
      className={cn('space-y-4', className)}
      aria-label="Checkout progress"
      role="navigation"
    >
      {steps.map((step, index) => {
        const completed = isStepCompleted(index);
        const active = isStepActive(index);
        const clickable = isStepClickable(index);

        return (
          <div key={step.id} className="relative">
            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'absolute left-5 top-12 w-0.5 h-8 transition-all',
                  completed ? 'bg-green-600' : 'bg-gray-300'
                )}
                aria-hidden="true"
              />
            )}

            <button
              type="button"
              onClick={() => clickable && onStepClick?.(step.id)}
              disabled={!clickable}
              className={cn(
                'flex items-start gap-4 w-full text-left transition-all',
                clickable && 'cursor-pointer hover:bg-gray-50 p-2 rounded-lg',
                !clickable && 'cursor-default'
              )}
              aria-current={active ? 'step' : undefined}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all',
                  completed && 'bg-green-600 text-white',
                  active && !completed && 'bg-circleTel-orange text-white ring-4 ring-circleTel-orange/20',
                  !completed && !active && 'bg-gray-200 text-gray-600'
                )}
              >
                {completed ? (
                  <Check className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <div
                  className={cn(
                    'font-semibold transition-colors',
                    active && 'text-circleTel-darkNeutral',
                    completed && 'text-green-700',
                    !completed && !active && 'text-gray-500'
                  )}
                >
                  {step.label}
                </div>
                {'description' in step && step.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
