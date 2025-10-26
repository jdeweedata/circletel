'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface SimpleProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  labels?: string[];
}

export function SimpleProgressBar({ 
  currentStep, 
  totalSteps = 4,
  labels = ['Account', 'Address', 'Payment', 'Complete']
}: SimpleProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full py-6 px-4 bg-white border-b">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="relative">
          {/* Background Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            {/* Progress Fill */}
            <div
              className="h-full bg-gradient-to-r from-circleTel-orange to-orange-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="absolute -top-3 left-0 right-0 flex justify-between px-1">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;

              return (
                <div
                  key={stepNumber}
                  className="flex flex-col items-center"
                  style={{ 
                    marginLeft: index === 0 ? '0' : 'auto',
                    marginRight: index === totalSteps - 1 ? '0' : 'auto'
                  }}
                >
                  {/* Circle */}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      transition-all duration-300 relative z-10
                      ${isCompleted 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : isCurrent
                        ? 'bg-circleTel-orange text-white ring-4 ring-orange-100 shadow-lg'
                        : 'bg-white text-gray-400 border-2 border-gray-300'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      mt-2 text-xs font-medium transition-colors
                      ${isCurrent ? 'text-circleTel-orange font-semibold' : 'text-gray-500'}
                    `}
                  >
                    {labels[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Percentage (Optional) */}
        <div className="mt-10 text-center">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="mx-2 text-gray-400">•</span>
          <span className="text-sm text-circleTel-orange font-semibold">
            {progressPercentage.toFixed(0)}% Complete
          </span>
        </div>
      </div>
    </div>
  );
}
