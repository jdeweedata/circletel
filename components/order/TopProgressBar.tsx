'use client';

import React from 'react';
import { Lock, Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  shortLabel: string;
  completed: boolean;
  current: boolean;
}

interface TopProgressBarProps {
  currentStep: number;
}

export function TopProgressBar({ currentStep }: TopProgressBarProps) {
  const steps: Step[] = [
    {
      id: 1,
      label: 'Account',
      shortLabel: 'Account',
      completed: currentStep > 1,
      current: currentStep === 1,
    },
    {
      id: 2,
      label: 'Address',
      shortLabel: 'Address',
      completed: currentStep > 2,
      current: currentStep === 2,
    },
    {
      id: 3,
      label: 'Payment',
      shortLabel: 'Payment',
      completed: currentStep > 3,
      current: currentStep === 3,
    },
    {
      id: 4,
      label: 'Confirmation',
      shortLabel: 'Done',
      completed: currentStep > 4,
      current: currentStep === 4,
    },
  ];

  return (
    <div className="relative bg-gradient-to-r from-circleTel-orange via-orange-500 to-circleTel-orange overflow-hidden">
      {/* Animated background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
           style={{ 
             backgroundSize: '200% 100%',
             animation: 'shimmer 3s infinite'
           }} />
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Desktop Progress */}
          <div className="hidden md:flex items-center justify-between py-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Container */}
                <div className="flex items-center gap-3 relative">
                  {/* Step Circle */}
                  <div className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                    transition-all duration-500 ease-out
                    ${step.completed
                      ? 'bg-white text-circleTel-orange scale-100 shadow-lg'
                      : step.current
                      ? 'bg-white text-circleTel-orange scale-110 shadow-2xl ring-4 ring-white/30 animate-pulse-subtle'
                      : 'bg-white/20 text-white/60 scale-90'
                    }
                  `}>
                    {step.completed ? (
                      <Check className="w-5 h-5" strokeWidth={3} />
                    ) : (
                      <span>{step.id}</span>
                    )}
                    
                    {/* Current step glow effect */}
                    {step.current && (
                      <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="flex flex-col">
                    <span className={`text-sm whitespace-nowrap transition-all duration-300 ${
                      step.current 
                        ? 'font-bold text-white text-base' 
                        : step.completed
                        ? 'font-semibold text-white/90'
                        : 'font-medium text-white/60'
                    }`}>
                      {step.label}
                    </span>
                    {step.current && (
                      <span className="text-xs text-white/80 font-medium animate-fade-in">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full" />
                    <div 
                      className={`absolute inset-0 bg-white rounded-full transition-all duration-700 ease-out ${
                        step.completed ? 'w-full' : 'w-0'
                      }`}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Progress */}
          <div className="flex md:hidden items-center justify-between py-5">
            {/* Progress Bar Background */}
            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-white/20 -translate-y-1/2">
              <div 
                className="h-full bg-white transition-all duration-700 ease-out rounded-full"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Step Dots */}
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs
                  transition-all duration-500
                  ${step.completed
                    ? 'bg-white text-circleTel-orange shadow-md'
                    : step.current
                    ? 'bg-white text-circleTel-orange scale-125 shadow-lg ring-2 ring-white/30'
                    : 'bg-white/20 text-white/60'
                  }
                `}>
                  {step.completed ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span className={`text-xs whitespace-nowrap transition-all ${
                  step.current ? 'font-bold text-white' : 'font-medium text-white/70'
                }`}>
                  {step.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secure Badge - Desktop Only */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
        <Lock className="w-4 h-4 text-white" />
        <span className="text-sm font-semibold text-white">Secure</span>
      </div>

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
