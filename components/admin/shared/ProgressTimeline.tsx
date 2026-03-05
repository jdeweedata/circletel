'use client';

import { PiCheckBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';

export interface TimelineStep {
  id: string | number;
  label: string;
  subLabel?: string;
  status: 'completed' | 'active' | 'pending';
  icon: React.ElementType;
  date?: string;
}

interface ProgressTimelineProps {
  title?: string;
  steps: TimelineStep[];
  onViewHistory?: () => void;
  className?: string;
}

function TimelineStepItem({ step }: { step: TimelineStep }) {
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

export function ProgressTimeline({
  title = 'Progress',
  steps,
  onViewHistory,
  className,
}: ProgressTimelineProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full', className)}>
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      <div className="p-6 relative">
        {/* Vertical connector line */}
        <div className="absolute left-[35px] top-10 bottom-10 w-0.5 bg-slate-200" />

        {/* Timeline items */}
        <div role="list" className="space-y-8 relative">
          {steps.map((step) => (
            <TimelineStepItem key={step.id} step={step} />
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
