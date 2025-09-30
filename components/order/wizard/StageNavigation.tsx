'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StageNavigationProps {
  currentStage: number;
  totalStages: number;
  canProceed: boolean;
  isLoading: boolean;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  backLabel?: string;
}

export function StageNavigation({
  currentStage,
  totalStages,
  canProceed,
  isLoading,
  onNext,
  onBack,
  nextLabel = 'Continue',
  backLabel = 'Back'
}: StageNavigationProps) {
  const isFirstStage = currentStage === 1;
  const isLastStage = currentStage === totalStages;

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isFirstStage || isLoading}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Button>

      {/* Next/Complete Button */}
      <Button
        onClick={onNext}
        disabled={!canProceed || isLoading}
        className="flex items-center gap-2 bg-circleTel-orange hover:bg-circleTel-orange/90"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {isLastStage ? 'Complete Order' : nextLabel}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}