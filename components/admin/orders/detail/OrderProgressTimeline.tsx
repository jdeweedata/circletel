'use client';

import {
  PiPackageBold,
  PiCreditCardBold,
  PiCurrencyCircleDollarBold,
  PiCalendarBold,
  PiWrenchBold,
  PiRocketLaunchBold,
  PiCheckBold,
} from 'react-icons/pi';
import { cn } from '@/lib/utils';

interface Order {
  status: string;
  created_at: string;
  payment_date?: string;
  installation_scheduled_date?: string;
  installation_completed_date?: string;
  activation_date?: string;
}

interface OrderProgressTimelineProps {
  order: Order;
  onViewHistory?: () => void;
}

interface TimelineStepData {
  id: number;
  label: string;
  subLabel: string;
  status: 'completed' | 'active' | 'pending';
  icon: React.ElementType;
  date?: string;
}

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

const STEP_IDS: Record<string, number> = {
  'Order Received': 1,
  'Payment Method Setup': 2,
  'Payment Confirmation': 3,
  'Installation Scheduled': 4,
  'Installation Complete': 5,
  'Service Active': 6,
};

function getStepStatus(orderStatus: string, stepName: string): 'completed' | 'active' | 'pending' {
  const currentStepId = STATUS_ORDER[orderStatus] || 1;
  const thisStepId = STEP_IDS[stepName] || 1;

  if (currentStepId === 0) return 'pending';
  if (thisStepId < currentStepId) return 'completed';
  if (thisStepId === currentStepId) return 'active';
  return 'pending';
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimelineSteps(order: Order): TimelineStepData[] {
  return [
    {
      id: 1,
      label: 'Order Received',
      subLabel: 'Order created',
      status: order.status === 'pending' ? 'active' : 'completed',
      icon: PiPackageBold,
      date: order.created_at ? formatShortDate(order.created_at) : undefined,
    },
    {
      id: 2,
      label: 'Payment Method Setup',
      subLabel: 'Method registered',
      status: getStepStatus(order.status, 'Payment Method Setup'),
      icon: PiCreditCardBold,
      date: order.payment_date ? formatShortDate(order.payment_date) : undefined,
    },
    {
      id: 3,
      label: 'Payment Confirmation',
      subLabel: 'Deposit received',
      status: getStepStatus(order.status, 'Payment Confirmation'),
      icon: PiCurrencyCircleDollarBold,
      date: order.payment_date ? formatShortDate(order.payment_date) : undefined,
    },
    {
      id: 4,
      label: 'Installation Scheduled',
      subLabel: 'Install booked',
      status: getStepStatus(order.status, 'Installation Scheduled'),
      icon: PiCalendarBold,
      date: order.installation_scheduled_date ? formatShortDate(order.installation_scheduled_date) : undefined,
    },
    {
      id: 5,
      label: 'Installation Complete',
      subLabel: 'Work finished',
      status: getStepStatus(order.status, 'Installation Complete'),
      icon: PiWrenchBold,
      date: order.installation_completed_date ? formatShortDate(order.installation_completed_date) : undefined,
    },
    {
      id: 6,
      label: 'Service Active',
      subLabel: 'Service live',
      status: getStepStatus(order.status, 'Service Active'),
      icon: PiRocketLaunchBold,
      date: order.activation_date ? formatShortDate(order.activation_date) : undefined,
    },
  ];
}

function TimelineStep({ step }: { step: TimelineStepData }) {
  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'active';
  const Icon = step.icon;

  const statusLabel = isCompleted ? 'completed' : isActive ? 'in progress' : 'pending';

  return (
    <div role="listitem" className="flex gap-4" aria-current={isActive ? 'step' : undefined}>
      {/* Circle */}
      <div
        className={cn(
          'z-10 size-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm',
          isCompleted && 'bg-emerald-500 text-white',
          isActive && 'bg-primary text-white shadow-primary/40',
          !isCompleted && !isActive && 'bg-slate-200 text-slate-400'
        )}
        aria-label={`${step.label}: ${statusLabel}`}
      >
        {isCompleted ? (
          <PiCheckBold className="w-5 h-5" />
        ) : isActive ? (
          <Icon className="w-5 h-5 animate-pulse" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>

      {/* Content */}
      <div>
        <p
          className={cn(
            'text-sm font-bold',
            isCompleted && 'text-slate-900',
            isActive && 'text-primary',
            !isCompleted && !isActive && 'text-slate-400 font-medium'
          )}
        >
          {step.label}
        </p>
        <p
          className={cn(
            'text-xs',
            isActive ? 'text-primary/70' : 'text-slate-500'
          )}
        >
          {step.date || step.subLabel}
        </p>
      </div>
    </div>
  );
}

export function OrderProgressTimeline({ order, onViewHistory }: OrderProgressTimelineProps) {
  const steps = getTimelineSteps(order);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">Order Progress</h3>
      </div>
      <div className="p-6 relative">
        {/* Vertical connector line */}
        <div className="absolute left-[35px] top-10 bottom-10 w-0.5 bg-slate-200" />

        {/* Timeline items */}
        <div role="list" className="space-y-8 relative">
          {steps.map((step) => (
            <TimelineStep key={step.id} step={step} />
          ))}
        </div>

        {onViewHistory && (
          <button
            type="button"
            onClick={onViewHistory}
            className="w-full mt-10 py-3 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            View Full History
          </button>
        )}
      </div>
    </div>
  );
}
