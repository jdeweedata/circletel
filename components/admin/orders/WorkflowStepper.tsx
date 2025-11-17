'use client';

import { Check, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'skipped';
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function WorkflowStepper({
  steps,
  orientation = 'horizontal',
  className
}: WorkflowStepperProps) {
  return (
    <div className={cn(
      'w-full',
      orientation === 'horizontal' ? 'overflow-x-auto' : '',
      className
    )}>
      <div className={cn(
        'flex',
        orientation === 'horizontal'
          ? 'flex-row items-start justify-between min-w-max'
          : 'flex-col space-y-4'
      )}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isSkipped = step.status === 'skipped';

          return (
            <div
              key={step.id}
              className={cn(
                'flex',
                orientation === 'horizontal'
                  ? 'flex-col items-center flex-1'
                  : 'flex-row items-start gap-4'
              )}
            >
              {/* Step Indicator */}
              <div className={cn(
                'flex items-center',
                orientation === 'horizontal' ? 'flex-col' : 'flex-row gap-4 flex-1'
              )}>
                {/* Icon */}
                <div className="relative">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                      isCompleted && 'bg-green-100 border-green-600',
                      isCurrent && 'bg-blue-100 border-blue-600',
                      isSkipped && 'bg-gray-100 border-gray-400',
                      !isCompleted && !isCurrent && !isSkipped && 'bg-white border-gray-300'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <Circle className="h-5 w-5 text-blue-600 fill-current" />
                    ) : isSkipped ? (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-400">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Connector Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute',
                        orientation === 'horizontal'
                          ? 'top-5 left-full w-full h-0.5 -translate-y-1/2'
                          : 'top-10 left-5 w-0.5 h-full -translate-x-1/2',
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      )}
                      style={
                        orientation === 'horizontal'
                          ? { width: '100%', marginLeft: '0.625rem' }
                          : { height: 'calc(100% - 2.5rem)', marginTop: '0.625rem' }
                      }
                    />
                  )}
                </div>

                {/* Step Content */}
                <div
                  className={cn(
                    'text-center',
                    orientation === 'horizontal' ? 'mt-2 px-2' : 'flex-1'
                  )}
                >
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isCompleted && 'text-green-700',
                      isCurrent && 'text-blue-700',
                      isSkipped && 'text-gray-500',
                      !isCompleted && !isCurrent && !isSkipped && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      isCompleted && 'text-green-600',
                      isCurrent && 'text-blue-600',
                      isSkipped && 'text-gray-400',
                      !isCompleted && !isCurrent && !isSkipped && 'text-gray-400'
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
