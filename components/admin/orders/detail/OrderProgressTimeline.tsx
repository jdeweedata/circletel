'use client';

import {
  PiTrayBold,
  PiCreditCardBold,
  PiMoneyBold,
  PiCalendarBold,
  PiWrenchBold,
  PiCheckSquareBold,
  PiWifiHighBold,
  PiCheckCircleBold,
  PiClockBold,
} from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

interface TimelineStep {
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
  installation_in_progress: 5,
  installation_completed: 6,
  active: 7,
  suspended: 7,
  cancelled: 0,
  failed: 0,
};

const STEP_IDS: Record<string, number> = {
  'Order Received': 1,
  'Payment Method': 2,
  'Payment Confirmed': 3,
  'Scheduled': 4,
  'Installation': 5,
  'Completion': 6,
  'Active': 7,
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

function getTimelineSteps(order: Order): TimelineStep[] {
  return [
    {
      id: 1,
      label: 'Order Received',
      subLabel: 'Order created',
      status: order.status === 'pending' ? 'active' : 'completed',
      icon: PiTrayBold,
      date: order.created_at ? formatShortDate(order.created_at) : undefined,
    },
    {
      id: 2,
      label: 'Payment Method',
      subLabel: 'Method registered',
      status: getStepStatus(order.status, 'Payment Method'),
      icon: PiCreditCardBold,
      date: order.payment_date ? formatShortDate(order.payment_date) : undefined,
    },
    {
      id: 3,
      label: 'Payment Confirmed',
      subLabel: 'Deposit received',
      status: getStepStatus(order.status, 'Payment Confirmed'),
      icon: PiMoneyBold,
      date: order.payment_date ? formatShortDate(order.payment_date) : undefined,
    },
    {
      id: 4,
      label: 'Scheduled',
      subLabel: 'Install booked',
      status: getStepStatus(order.status, 'Scheduled'),
      icon: PiCalendarBold,
      date: order.installation_scheduled_date ? formatShortDate(order.installation_scheduled_date) : undefined,
    },
    {
      id: 5,
      label: 'Installation',
      subLabel: 'Tech on-site',
      status: getStepStatus(order.status, 'Installation'),
      icon: PiWrenchBold,
      date: order.installation_scheduled_date ? formatShortDate(order.installation_scheduled_date) : undefined,
    },
    {
      id: 6,
      label: 'Completion',
      subLabel: 'Work finished',
      status: getStepStatus(order.status, 'Completion'),
      icon: PiCheckSquareBold,
      date: order.installation_completed_date ? formatShortDate(order.installation_completed_date) : undefined,
    },
    {
      id: 7,
      label: 'Active',
      subLabel: 'Service live',
      status: getStepStatus(order.status, 'Active'),
      icon: PiWifiHighBold,
      date: order.activation_date ? formatShortDate(order.activation_date) : undefined,
    },
  ];
}

export function OrderProgressTimeline({ order, onViewHistory }: OrderProgressTimelineProps) {
  const steps = getTimelineSteps(order);

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">Order Progress</h3>
      </div>

      <div className="p-4">
        <div className="space-y-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative flex gap-3">
                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)]',
                      isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    isCompleted && 'bg-emerald-500',
                    isActive && 'bg-primary ring-4 ring-primary/20',
                    !isCompleted && !isActive && 'bg-slate-100 border border-slate-200'
                  )}
                >
                  {isCompleted ? (
                    <PiCheckCircleBold className="w-4 h-4 text-white" />
                  ) : isActive ? (
                    <Icon className="w-4 h-4 text-white" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        isCompleted && 'text-emerald-700',
                        isActive && 'text-primary',
                        !isCompleted && !isActive && 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </p>
                    {step.date && (
                      <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                        {step.date}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{step.subLabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        {onViewHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewHistory}
            className="w-full mt-4 text-slate-600 hover:text-slate-900"
          >
            <PiClockBold className="w-4 h-4 mr-2" />
            View Full History
          </Button>
        )}
      </div>
    </div>
  );
}
