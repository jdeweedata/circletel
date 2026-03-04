'use client';
import { PiCaretLeftBold, PiCaretRightBold, PiCheckCircleBold, PiClipboardTextBold, PiCurrencyDollarBold, PiFileTextBold, PiFloppyDiskBold, PiGearBold, PiMapPinBold, PiPackageBold, PiSpinnerBold, PiUsersBold, PiWarningCircleBold, PiXBold } from 'react-icons/pi';

/**
 * CPQ Wizard Main Container
 *
 * 7-step guided wizard for creating B2B quotes
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import {
  useCPQSession,
  useAutoSave,
  useCPQNavigation,
  CPQ_STEPS,
} from '@/lib/cpq/hooks';
import type { CPQSession, CPQStepData, UserType } from '@/lib/cpq/types';
import { WorkflowStepper, type WorkflowStep } from '@/components/admin/orders/WorkflowStepper';

// Step Components (lazy loaded placeholders - will be replaced)
import { NeedsAssessmentStep } from './steps/NeedsAssessmentStep';
import { LocationCoverageStep } from './steps/LocationCoverageStep';
import { PackageSelectionStep } from './steps/PackageSelectionStep';
import { ConfigureStep } from './steps/ConfigureStep';
import { PricingDiscountsStep } from './steps/PricingDiscountsStep';
import { CustomerDetailsStep } from './steps/CustomerDetailsStep';
import { ReviewSubmitStep } from './steps/ReviewSubmitStep';

// Step icons mapping
const STEP_ICONS = [
  ClipboardList, // Needs Assessment
  MapPin,        // Location & Coverage
  Package,       // Package Selection
  Settings,      // Configure
  DollarSign,    // Pricing & Discounts
  Users,         // Customer Details
  FileText,      // Review & Submit
];

// Animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

interface CPQWizardProps {
  sessionId?: string;
  userType: UserType;
  onComplete?: (quoteId: string) => void;
  onCancel?: () => void;
}

export function CPQWizard({
  sessionId: initialSessionId,
  userType,
  onComplete,
  onCancel,
}: CPQWizardProps) {
  // Direction for animations (1 = forward, -1 = backward)
  const [slideDirection, setSlideDirection] = useState(1);

  // Session management
  const {
    session,
    stepData,
    isLoading,
    error: sessionError,
    createSession,
    updateSession,
    updateStepData,
  } = useCPQSession({
    sessionId: initialSessionId,
    autoLoad: !!initialSessionId,
    onError: (err) => toast.error(err),
    onSessionLoaded: (sess) => {
      toast.success('Session loaded');
    },
  });

  // Auto-save
  const {
    isSaving,
    lastSaved,
    save: autoSave,
    saveNow,
  } = useAutoSave({
    sessionId: session?.id,
    enabled: !!session,
    debounceMs: 1500,
    onSaveError: (err) => toast.error(`Auto-save failed: ${err}`),
  });

  // Navigation
  const {
    currentStep,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    goNext,
    goPrev,
    goToStep,
    getStepStatus,
    validateStep,
  } = useCPQNavigation({
    session,
    stepData,
    onStepChange: (newStep, oldStep) => {
      setSlideDirection(newStep > oldStep ? 1 : -1);
      // Update session current step
      if (session) {
        autoSave({ current_step: newStep });
      }
    },
    onValidationError: (step, errors) => {
      toast.error(`Step ${step}: ${errors[0]}`);
    },
  });

  // Initialize new session if needed
  useEffect(() => {
    if (!initialSessionId && !session && !isLoading) {
      createSession(userType);
    }
  }, [initialSessionId, session, isLoading, createSession, userType]);

  // Build workflow steps for stepper
  const workflowSteps: WorkflowStep[] = CPQ_STEPS.map((step, index) => ({
    id: step.id,
    label: step.label,
    subLabel: step.subLabel,
    status: getStepStatus(step.id),
    icon: STEP_ICONS[index],
  }));

  // Handle step click in stepper
  const handleStepClick = useCallback(
    (stepId: number) => {
      if (stepId < currentStep) {
        // Can always go back
        goToStep(stepId);
      } else if (stepId === currentStep + 1) {
        // Can only go to next step if current is valid
        goNext();
      }
    },
    [currentStep, goToStep, goNext]
  );

  // Handle next button
  const handleNext = useCallback(() => {
    const result = goNext();
    if (!result.isValid) {
      // Error already shown via onValidationError
    }
  }, [goNext]);

  // Handle previous button
  const handlePrev = useCallback(() => {
    goPrev();
  }, [goPrev]);

  // Handle save button
  const handleSave = useCallback(async () => {
    await saveNow({ current_step: currentStep });
    toast.success('Progress saved');
  }, [saveNow, currentStep]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Handle completion
  const handleComplete = useCallback(
    async (quoteId: string) => {
      toast.success('Quote created successfully!');
      onComplete?.(quoteId);
    },
    [onComplete]
  );

  // Update step data handler passed to step components
  const handleUpdateStepData = useCallback(
    <K extends keyof CPQStepData>(step: K, data: Partial<NonNullable<CPQStepData[K]>>) => {
      // Optimistic update
      updateStepData(step, data);
      // Auto-save
      autoSave({ [step]: data });
    },
    [updateStepData, autoSave]
  );

  // Render current step component
  const renderStep = () => {
    const commonProps = {
      session,
      stepData,
      onUpdateStepData: handleUpdateStepData,
      isSaving,
    };

    switch (currentStep) {
      case 1:
        return <NeedsAssessmentStep {...commonProps} />;
      case 2:
        return <LocationCoverageStep {...commonProps} />;
      case 3:
        return <PackageSelectionStep {...commonProps} />;
      case 4:
        return <ConfigureStep {...commonProps} />;
      case 5:
        return <PricingDiscountsStep {...commonProps} />;
      case 6:
        return <CustomerDetailsStep {...commonProps} />;
      case 7:
        return <ReviewSubmitStep {...commonProps} onComplete={handleComplete} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <PiSpinnerBold className="h-8 w-8 animate-spin mx-auto text-circleTel-orange" />
          <p className="mt-2 text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionError && !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <PiWarningCircleBold className="h-8 w-8 mx-auto text-red-500" />
          <p className="mt-2 text-gray-700 font-medium">Failed to load session</p>
          <p className="text-sm text-gray-500">{sessionError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Configure Quote</h1>
            <p className="text-sm text-gray-500">
              Session: {session?.id?.slice(0, 8)}...
              {lastSaved && (
                <span className="ml-2 text-green-600">
                  <PiCheckCircleBold className="inline h-3 w-3 mr-1" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {isSaving && (
                <span className="ml-2 text-gray-400">
                  <PiSpinnerBold className="inline h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <PiFloppyDiskBold className="h-4 w-4 mr-1" />
              Save
            </Button>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <PiXBold className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Stepper */}
      <WorkflowStepper
        steps={workflowSteps}
        currentStatus={CPQ_STEPS[currentStep - 1]?.label || ''}
        onStepClick={handleStepClick}
      />

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentStep}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            <div className="p-6">{renderStep()}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            <PiCaretLeftBold className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {CPQ_STEPS.length}
          </div>

          {!isLastStep ? (
            <Button
              onClick={handleNext}
              className="bg-circleTel-orange hover:bg-orange-600"
            >
              Next
              <PiCaretRightBold className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                // Trigger submit in ReviewSubmitStep
                const event = new CustomEvent('cpq-submit');
                window.dispatchEvent(event);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <PiCheckCircleBold className="h-4 w-4 mr-1" />
              Create Quote
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Export step props type for step components
export interface CPQStepProps {
  session: CPQSession | null;
  stepData: CPQStepData;
  onUpdateStepData: <K extends keyof CPQStepData>(
    step: K,
    data: Partial<NonNullable<CPQStepData[K]>>
  ) => void;
  isSaving: boolean;
}
