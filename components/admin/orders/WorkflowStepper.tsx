'use client';

import { Check, Circle, LucideIcon } from 'lucide-react';

export interface WorkflowStep {
  id: number;
  label: string;
  subLabel?: string;
  status: 'completed' | 'active' | 'pending';
  icon?: LucideIcon;
  date?: string;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStatus: string;
  onStepClick?: (stepId: number) => void;
}

export function WorkflowStepper({ steps, currentStatus, onStepClick }: WorkflowStepperProps) {
  return (
    <div className="w-full py-6 overflow-x-auto bg-white">
      <div className="flex items-start justify-between min-w-[700px] px-4 md:px-6">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isPending = step.status === 'pending';

          const Icon = step.icon || Circle;

          return (
            <div
              key={step.id}
              className={`relative flex flex-col items-center flex-1 group ${
                onStepClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onStepClick && onStepClick(step.id)}
            >
              {/* Animated Connector Line */}
              {!isLast && (
                <div className="absolute top-6 left-[50%] right-[-50%] h-[3px] -z-0">
                  <div className={`h-full w-full transition-all duration-500 ease-in-out ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                </div>
              )}

              {/* Icon Circle with Scale Effect */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2
                transition-all duration-300 shadow-sm
                ${isCompleted ? 'bg-white border-green-500 text-green-500' : ''}
                ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110' : ''}
                ${isPending ? 'bg-gray-50 border-gray-200 text-gray-300' : ''}
                group-hover:shadow-md
              `}>
                <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />

                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="mt-4 text-center px-1">
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 transition-colors duration-300
                  ${isActive ? 'text-indigo-600' : (isCompleted ? 'text-gray-700' : 'text-gray-500')}
                `}>
                  {step.label}
                </p>
                {step.subLabel && (
                  <p className="text-[11px] text-gray-500 font-medium leading-tight max-w-[110px] mx-auto">
                    {step.subLabel}
                  </p>
                )}
                {step.date && (
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                    {step.date}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
