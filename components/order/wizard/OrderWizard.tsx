'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { ProgressIndicator } from './ProgressIndicator';
import { StageNavigation } from './StageNavigation';
import { STAGE_NAMES, TOTAL_STAGES } from '@/lib/order/types';

interface OrderWizardProps {
  children: React.ReactNode;
  onStageComplete?: (stage: number) => void;
  onOrderComplete?: () => void;
}

export function OrderWizard({
  children,
  onStageComplete,
  onOrderComplete
}: OrderWizardProps) {
  const { state, actions } = useOrderContext();
  const { currentStage, isLoading } = state;

  const handleNext = () => {
    if (currentStage < TOTAL_STAGES) {
      const nextStage = currentStage + 1;
      actions.setCurrentStage(nextStage);
      onStageComplete?.(currentStage);
    } else {
      onOrderComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStage > 1) {
      actions.setCurrentStage(currentStage - 1);
    }
  };

  // TODO: Implement validation logic for each stage
  const canProceed = true; // Placeholder - will be implemented in stage-specific stories

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentStage={currentStage}
        totalStages={TOTAL_STAGES}
        stageNames={[...STAGE_NAMES]}
      />

      {/* Stage Content */}
      <div className="mt-8">
        {children}
      </div>

      {/* Navigation */}
      <StageNavigation
        currentStage={currentStage}
        totalStages={TOTAL_STAGES}
        canProceed={canProceed}
        isLoading={isLoading}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  );
}