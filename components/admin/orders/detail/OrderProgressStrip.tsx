'use client';

import {
  PiCheckBold,
  PiPackageBold,
  PiCreditCardBold,
  PiCalendarBold,
  PiWrenchBold,
  PiBroadcastBold,
  PiFileTextBold,
} from 'react-icons/pi';
import { cn } from '@/lib/utils';

interface OrderProgressStripProps {
  order: {
    status: string;
    created_at: string;
    payment_date?: string;
    installation_scheduled_date?: string;
    installation_completed_date?: string;
    activation_date?: string;
    payment_method_active?: boolean;
  };
  onNavigateToTab?: (tab: string) => void;
}

interface StepDefinition {
  id: number;
  label: string;
  icon: React.ElementType;
  nextAction?: string;
}

const STEPS: StepDefinition[] = [
  { id: 1, label: 'Order Received', icon: PiPackageBold },
  { id: 2, label: 'Payment Method Set', icon: PiCreditCardBold, nextAction: 'Register Payment Method' },
  { id: 3, label: 'Installation Scheduled', icon: PiCalendarBold, nextAction: 'Schedule Installation' },
  { id: 4, label: 'Installation Complete', icon: PiWrenchBold, nextAction: 'Complete Installation' },
  { id: 5, label: 'Service Active', icon: PiBroadcastBold, nextAction: 'Activate Service' },
  { id: 6, label: 'First Billing', icon: PiFileTextBold },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 1,
  payment_method_pending: 2,
  payment_method_registered: 3,
  installation_scheduled: 4,
  installation_in_progress: 4,
  installation_completed: 5,
  active: 6,
  suspended: 6,
  cancelled: 0,
  failed: 0,
};

function getStepStates(orderStatus: string, order: OrderProgressStripProps['order']) {
  const currentStepId = STATUS_ORDER[orderStatus] || 1;

  return STEPS.map((step) => {
    if (currentStepId === 0) {
      return { ...step, state: 'future' as const };
    }

    if (step.id < currentStepId) {
      return { ...step, state: 'done' as const };
    }

    if (step.id === currentStepId) {
      return { ...step, state: 'current' as const };
    }

    return { ...step, state: 'future' as const };
  });
}

function getNextAction(order: OrderProgressStripProps['order']): { stepId: number; label: string } | null {
  const currentStepId = STATUS_ORDER[order.status] || 1;

  if (currentStepId === 0) {
    return { stepId: 1, label: 'Create Order' };
  }

  if (currentStepId === 1) {
    return { stepId: 2, label: 'Register Payment Method' };
  }

  if (currentStepId === 2) {
    return { stepId: 3, label: 'Set Installation Date' };
  }

  if (currentStepId === 3 || currentStepId === 4) {
    return { stepId: 4, label: 'Complete Installation' };
  }

  if (currentStepId === 5) {
    return { stepId: 6, label: 'Generate First Invoice' };
  }

  return null;
}

function StepNode({ step, state }: { step: StepDefinition; state: 'done' | 'current' | 'future' }) {
  const Icon = step.icon;

  const isDone = state === 'done';
  const isCurrent = state === 'current';
  const isFuture = state === 'future';

  return (
    <div className="flex flex-1 flex-col items-center relative">
      {/* Circle node */}
      <div
        className={cn(
          'w-[38px] h-[38px] rounded-full flex items-center justify-center relative z-10 transition-all',
          isDone && 'bg-emerald-100 text-emerald-600',
          isCurrent && 'bg-primary text-white shadow-[0_0_0_4px] shadow-primary/20',
          isFuture && 'bg-slate-100 text-slate-400'
        )}
      >
        {isDone ? (
          <PiCheckBold className="w-4 h-4" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>

      {/* Label below node */}
      <p
        className={cn(
          'text-[11.5px] font-semibold mt-2 text-center max-w-[104px] leading-tight',
          isDone && 'text-slate-700',
          isCurrent && 'font-bold text-slate-900',
          isFuture && 'text-slate-500'
        )}
      >
        {step.label}
      </p>
    </div>
  );
}

function ConnectingLine({ isDone }: { isDone: boolean }) {
  return (
    <div
      className={cn(
        'absolute top-[19px] left-[50%] right-[-50%] h-[2.5px] z-0 pointer-events-none',
        isDone ? 'bg-emerald-400' : 'bg-slate-200'
      )}
      aria-hidden="true"
    />
  );
}

export function OrderProgressStrip({ order, onNavigateToTab }: OrderProgressStripProps) {
  const stepStates = getStepStates(order.status, order);
  const nextAction = getNextAction(order);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      {/* Header row: Title + Next action link */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900">Order Progress</h3>

        {nextAction && (
          <button
            onClick={() => {
              // Navigate based on the next action step
              if (nextAction.stepId === 2 || nextAction.stepId === 3) {
                onNavigateToTab?.('payment-method');
              } else if (nextAction.stepId === 4 || nextAction.stepId === 5) {
                onNavigateToTab?.('installation');
              } else if (nextAction.stepId === 6) {
                onNavigateToTab?.('billing');
              }
            }}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Next: {nextAction.label}
          </button>
        )}
      </div>

      {/* Horizontal stepper */}
      <div className="flex items-flex-start gap-0 relative px-4">
        {/* Connecting lines layer */}
        <div className="absolute inset-0 flex items-stretch">
          {stepStates.map((step, index) => (
            <div key={`line-${step.id}`} className="flex flex-1 relative">
              {index < stepStates.length - 1 && (
                <ConnectingLine isDone={step.state === 'done'} />
              )}
            </div>
          ))}
        </div>

        {/* Steps layer */}
        <div className="flex w-full gap-0 relative z-10">
          {stepStates.map((step) => (
            <StepNode key={step.id} step={step} state={step.state} />
          ))}
        </div>
      </div>
    </div>
  );
}
