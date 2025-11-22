import React from 'react';
import { Check, Circle } from 'lucide-react';
import { WorkflowStep } from '../types';

interface Props {
  steps: WorkflowStep[];
  onStepClick?: (stepId: number) => void;
}

export const WorkflowStepper: React.FC<Props> = ({ steps, onStepClick }) => {
  return (
    <div className="w-full py-6 overflow-x-auto">
      <div className="flex items-start justify-between min-w-[700px] px-2">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isPending = step.status === 'pending';
          
          const Icon = step.icon || Circle;

          return (
            <div 
              key={step.id} 
              className={`relative flex flex-col items-center flex-1 group ${onStepClick ? 'cursor-pointer' : ''}`}
              onClick={() => onStepClick && onStepClick(step.id)}
            >
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute top-6 left-[50%] right-[-50%] h-[3px] -z-0">
                  <div className={`h-full w-full transition-all duration-500 ease-in-out ${
                    isCompleted ? 'bg-success' : 'bg-gray-200'
                  }`}></div>
                </div>
              )}

              {/* Icon Circle */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm
                ${isCompleted ? 'bg-white border-success text-success' : ''}
                ${isActive ? 'bg-primary text-white border-primary shadow-lg scale-110' : ''}
                ${isPending ? 'bg-gray-50 border-gray-200 text-gray-300' : ''}
                group-hover:shadow-md
              `}>
                <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Status Badge for Completed */}
                {isCompleted && (
                  <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-white">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="mt-4 text-center px-1">
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 transition-colors duration-300
                  ${isActive ? 'text-primary' : (isCompleted ? 'text-gray-700' : 'text-gray-500')}
                `}>
                  {step.label}
                </p>
                <p className="text-[11px] text-gray-500 font-medium leading-tight max-w-[110px] mx-auto">
                  {step.subLabel}
                </p>
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
};