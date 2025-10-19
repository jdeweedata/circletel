'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface OrderWizardProps {
  currentStep: number;
  steps: Step[];
  onStepChange?: (step: number) => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  children: React.ReactNode;
  showNavigation?: boolean;
  isSubmitting?: boolean;
}

export function OrderWizard({
  currentStep,
  steps,
  onStepChange,
  canGoNext = true,
  canGoPrevious = true,
  onNext,
  onPrevious,
  children,
  showNavigation = true,
  isSubmitting = false,
}: OrderWizardProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const handleStepClick = (stepNumber: number) => {
    // Only allow going back to previous steps, not forward
    if (stepNumber < currentStep && onStepChange) {
      onStepChange(stepNumber);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center relative">
                  <button
                    onClick={() => handleStepClick(step.number)}
                    disabled={step.number >= currentStep}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                      transition-all relative z-10
                      ${
                        step.number < currentStep
                          ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                          : step.number === currentStep
                          ? 'bg-circleTel-orange text-white ring-4 ring-orange-200'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    aria-label={`Step ${step.number}: ${step.title}`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </button>

                  {/* Step Label - Hidden on mobile */}
                  <div className="mt-3 text-center hidden sm:block">
                    <p
                      className={`text-sm font-semibold ${
                        step.number === currentStep
                          ? 'text-circleTel-orange'
                          : step.number < currentStep
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[120px]">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 sm:mx-4 relative">
                    <div className="absolute inset-0 bg-gray-200 rounded"></div>
                    <div
                      className={`absolute inset-0 rounded transition-all ${
                        step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                      style={{
                        width: step.number < currentStep ? '100%' : '0%',
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Step Label - Only visible on mobile */}
          <div className="sm:hidden mt-6 text-center">
            <p className="text-lg font-semibold text-circleTel-orange">
              {steps[currentStep - 1]?.title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">{children}</div>

      {/* Navigation Buttons */}
      {showNavigation && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onPrevious}
                disabled={!canGoPrevious || isFirstStep || isSubmitting}
                className="min-w-[120px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-center text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </div>

              <Button
                size="lg"
                onClick={onNext}
                disabled={!canGoNext || isSubmitting}
                className="min-w-[120px] bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : isLastStep ? (
                  <>
                    Complete Order
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator (Mobile-friendly alternative) */}
      <div className="sm:hidden">
        <div className="flex gap-2 justify-center">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`h-2 rounded-full transition-all ${
                step.number < currentStep
                  ? 'w-8 bg-green-600'
                  : step.number === currentStep
                  ? 'w-12 bg-circleTel-orange'
                  : 'w-8 bg-gray-200'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
