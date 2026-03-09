'use client';

import {
  PiFileTextBold,
  PiPaperPlaneTiltBold,
  PiPenBold,
  PiCheckCircleBold,
  PiPlayBold,
  PiClockBold,
} from 'react-icons/pi';
import { SectionCard } from '@/components/admin/shared';
import { cn } from '@/lib/utils';

interface ContractTimelineProps {
  contract: {
    status: string;
    created_at: string;
    start_date: string | null;
    end_date: string | null;
    customer_signature_date: string | null;
    circletel_signature_date: string | null;
    fully_signed_date: string | null;
  };
}

interface TimelineStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending';
  date?: string | null;
}

export function ContractTimeline({ contract }: ContractTimelineProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStepStatus = (step: string): 'completed' | 'current' | 'pending' => {
    const statusOrder = [
      'draft',
      'pending_signature',
      'partially_signed',
      'fully_signed',
      'active',
    ];
    const currentIndex = statusOrder.indexOf(contract.status);
    const stepIndex = statusOrder.indexOf(step);

    if (contract.status === 'expired' || contract.status === 'terminated') {
      // All steps are completed for terminated/expired
      return 'completed';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const steps: TimelineStep[] = [
    {
      id: 'created',
      label: 'Contract Created',
      description: 'Draft contract generated',
      icon: PiFileTextBold,
      status: 'completed',
      date: contract.created_at,
    },
    {
      id: 'sent',
      label: 'Sent for Signature',
      description: 'Awaiting customer signature',
      icon: PiPaperPlaneTiltBold,
      status: getStepStatus('pending_signature'),
      date: contract.status !== 'draft' ? contract.created_at : null,
    },
    {
      id: 'customer_signed',
      label: 'Customer Signed',
      description: 'Customer completed signing',
      icon: PiPenBold,
      status: contract.customer_signature_date ? 'completed' :
              contract.status === 'partially_signed' ? 'current' : 'pending',
      date: contract.customer_signature_date,
    },
    {
      id: 'fully_signed',
      label: 'Fully Executed',
      description: 'All parties have signed',
      icon: PiCheckCircleBold,
      status: contract.fully_signed_date ? 'completed' : 'pending',
      date: contract.fully_signed_date,
    },
    {
      id: 'active',
      label: 'Contract Active',
      description: 'Service delivery started',
      icon: PiPlayBold,
      status: getStepStatus('active'),
      date: contract.start_date,
    },
  ];

  return (
    <SectionCard title="Contract Timeline" icon={PiClockBold}>
      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-4 relative">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-5 top-10 w-0.5 h-full -translate-x-1/2',
                    step.status === 'completed' ? 'bg-emerald-200' : 'bg-slate-200'
                  )}
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                  step.status === 'completed' && 'bg-emerald-100',
                  step.status === 'current' && 'bg-primary/10 ring-2 ring-primary',
                  step.status === 'pending' && 'bg-slate-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    step.status === 'completed' && 'text-emerald-600',
                    step.status === 'current' && 'text-primary',
                    step.status === 'pending' && 'text-slate-400'
                  )}
                />
              </div>

              {/* Content */}
              <div className="pb-8 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'font-semibold',
                      step.status === 'pending' ? 'text-slate-400' : 'text-slate-900'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.status === 'current' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                {step.date && step.status !== 'pending' && (
                  <p className="text-xs text-slate-400 mt-1">{formatDate(step.date)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
