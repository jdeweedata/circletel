'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TierSelectionStep } from './steps/TierSelectionStep';
import { M365ConfigStep } from './steps/M365ConfigStep';
import { AddOnsStep } from './steps/AddOnsStep';
import { PricingStep } from './steps/PricingStep';
import { CustomerDetailsStep } from './steps/CustomerDetailsStep';
import { ReviewSubmitStep } from './steps/ReviewSubmitStep';
import { useMITSTiers } from '@/lib/mits-cpq/hooks';
import { MITS_WIZARD_STEPS, MITS_STEP_LABELS } from '@/lib/mits-cpq/types';
import { validateStep } from '@/lib/mits-cpq/validation';
import type { MITSWizardStep, MITSStepData, MITSTierSelectionData, MITSM365ConfigData, MITSAddOnsData, MITSPricingData, MITSCustomerData } from '@/lib/mits-cpq/types';

interface MITSCPQWizardProps {
  sessionId: string;
  initialData?: MITSStepData;
  isAdmin?: boolean;
  onComplete?: (quoteRef: string) => void;
}

export function MITSCPQWizard({
  sessionId,
  initialData,
  isAdmin = false,
  onComplete,
}: MITSCPQWizardProps) {
  const { tiers } = useMITSTiers();

  // Current step and step data
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState<MITSStepData>(initialData ?? {});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = MITS_WIZARD_STEPS[currentStepIndex];
  const selectedTierCode = stepData.tier_selection?.selected_tier_code;

  // Handle step updates
  const handleStepUpdate = (updates: Partial<MITSStepData>) => {
    setStepData((prev) => ({ ...prev, ...updates }));
    setValidationErrors([]); // Clear errors on update
  };

  // Update individual step data
  const updateTierSelection = (data: MITSTierSelectionData) => {
    handleStepUpdate({ tier_selection: data });
  };

  const updateM365Config = (data: MITSM365ConfigData) => {
    handleStepUpdate({ m365_config: data });
  };

  const updateAddOns = (data: MITSAddOnsData) => {
    handleStepUpdate({ add_ons: data });
  };

  const updatePricing = (data: MITSPricingData) => {
    handleStepUpdate({ pricing: data });
  };

  const updateCustomer = (data: MITSCustomerData) => {
    handleStepUpdate({ customer: data });
  };

  // Advance to next step with validation
  const handleNext = () => {
    const validation = validateStep(currentStep, stepData, tiers);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    if (currentStepIndex < MITS_WIZARD_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setValidationErrors([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setValidationErrors([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit review and create quote
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/mits-cpq/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          stepData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create quote: ${response.status} ${response.statusText}`);
      }

      const json = await response.json() as { quoteRef?: string; error?: string };
      if (json.error) {
        throw new Error(json.error);
      }

      // Call completion callback if provided
      if (json.quoteRef && onComplete) {
        onComplete(json.quoteRef);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setValidationErrors([message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStepIndex === MITS_WIZARD_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {MITS_WIZARD_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
                idx < currentStepIndex
                  ? 'bg-orange' // Completed
                  : idx === currentStepIndex
                    ? 'bg-orange' // Current
                    : 'bg-slate-200' // Remaining
              }`}
            />
          ))}
        </div>
        <p className="text-xs font-medium text-slate-600">
          Step {currentStepIndex + 1} of {MITS_WIZARD_STEPS.length}
        </p>
      </div>

      {/* Step Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {MITS_STEP_LABELS[currentStep]}
        </h2>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">
            Please fix the following issues:
          </p>
          <ul className="space-y-1">
            {validationErrors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-600">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8">
        {currentStep === 'tier_selection' && (
          <TierSelectionStep
            data={stepData.tier_selection}
            onUpdate={updateTierSelection}
          />
        )}

        {currentStep === 'm365_config' && selectedTierCode && (
          <M365ConfigStep
            tierCode={selectedTierCode}
            data={stepData.m365_config}
            onUpdate={updateM365Config}
          />
        )}

        {currentStep === 'add_ons' && selectedTierCode && (
          <AddOnsStep
            tierCode={selectedTierCode}
            data={stepData.add_ons}
            onUpdate={updateAddOns}
          />
        )}

        {currentStep === 'pricing' && (
          <PricingStep
            stepData={stepData}
            isAdmin={isAdmin}
            onUpdate={updatePricing}
          />
        )}

        {currentStep === 'customer' && (
          <CustomerDetailsStep
            data={stepData.customer}
            onUpdate={updateCustomer}
          />
        )}

        {currentStep === 'review' && (
          <ReviewSubmitStep
            stepData={stepData}
            sessionId={sessionId}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {!isLastStep && (
          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-orange text-white hover:bg-orange/90"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {isLastStep && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-orange text-white hover:bg-orange/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quote'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
