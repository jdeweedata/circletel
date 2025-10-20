'use client';

import React from 'react';
import { CheckoutProgress, CheckoutStep } from '@/components/ui/checkout-progress';

interface ProgressIndicatorProps {
  currentStage: number;
  totalStages: number;
  stageNames: string[];
}

/**
 * ProgressIndicator Component (Legacy Wrapper)
 *
 * Wraps the new CheckoutProgress component for backward compatibility
 * with the existing OrderWizard system.
 *
 * Maps old stage numbers (1-5) to new checkout steps:
 * - Stage 1 (Coverage) → "package"
 * - Stage 2 (Account) → "account"
 * - Stage 3+ (Contact/Payment/Confirmation) → "payment"
 */
export function ProgressIndicator({
  currentStage,
  totalStages,
  stageNames
}: ProgressIndicatorProps) {
  // Map stage numbers to CheckoutStep
  const getCheckoutStep = (): CheckoutStep => {
    if (currentStage <= 1) return 'package';
    if (currentStage === 2) return 'account';
    return 'payment';
  };

  // Map stage names to checkout step labels
  const steps = [
    { id: 'package' as CheckoutStep, label: stageNames[0] || 'Choose Package' },
    { id: 'account' as CheckoutStep, label: stageNames[1] || 'Create Account' },
    { id: 'payment' as CheckoutStep, label: stageNames[2] || 'Payment' },
  ];

  return (
    <div className="w-full py-6">
      <CheckoutProgress
        currentStep={getCheckoutStep()}
        steps={steps}
      />
    </div>
  );
}