'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStage: number;
  totalStages: number;
  stageNames: string[];
}

export function ProgressIndicator({
  currentStage,
  totalStages,
  stageNames
}: ProgressIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalStages }, (_, i) => i + 1).map((stage, index) => (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center">
              {/* Stage Circle */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200
                ${stage < currentStage
                  ? 'bg-circleTel-orange border-circleTel-orange text-white'
                  : stage === currentStage
                    ? 'bg-white border-circleTel-orange text-circleTel-orange'
                    : 'bg-white border-gray-300 text-gray-500'
                }
              `}>
                {stage < currentStage ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{stage}</span>
                )}
              </div>

              {/* Stage Name */}
              <span className={`
                mt-2 text-xs font-medium text-center max-w-20
                ${stage <= currentStage ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {stageNames[index]}
              </span>
            </div>

            {/* Progress Line */}
            {stage < totalStages && (
              <div className={`
                flex-1 h-0.5 mx-4 transition-colors duration-200
                ${stage < currentStage ? 'bg-circleTel-orange' : 'bg-gray-300'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}