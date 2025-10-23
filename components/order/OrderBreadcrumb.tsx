'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { ChevronRight, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbStep {
  number: number;
  label: string;
  path: string;
}

const BREADCRUMB_STEPS: BreadcrumbStep[] = [
  { number: 1, label: 'Check Coverage', path: '/coverage' },
  { number: 2, label: 'Choose Package', path: '/packages' },
  { number: 3, label: 'Create Account', path: '/order/account' },
  { number: 4, label: 'Verification', path: '/order/verification' },
];

export function OrderBreadcrumb() {
  const { state } = useOrderContext();
  const currentStage = state.currentStage;

  return (
    <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Breadcrumb Trail */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {BREADCRUMB_STEPS.map((step, index) => (
              <React.Fragment key={step.number}>
                <div
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap transition-all duration-200',
                    step.number < currentStage
                      ? 'text-white font-semibold'
                      : 'text-white/60'
                  )}
                >
                  {step.number < currentStage && (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-sm md:text-base">{step.label}</span>
                </div>
                {index < BREADCRUMB_STEPS.length - 1 && (
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      step.number < currentStage ? 'text-white/90' : 'text-white/50'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Secure Checkout Badge */}
          <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Lock className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white whitespace-nowrap">
              Secure Checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
