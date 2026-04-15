'use client';

import { cn } from '@/lib/utils';
import type { InsightStatus } from '@/lib/integrations/zoho/desk-campaign-service';

const INSIGHT_STYLES: Record<InsightStatus, { bg: string; text: string; label: string }> = {
  signed_up:        { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Signed Up' },
  no_coverage:      { bg: 'bg-red-50',     text: 'text-red-700',     label: 'No Coverage' },
  closed_resolved:  { bg: 'bg-slate-100',  text: 'text-slate-600',   label: 'Closed' },
  completed:        { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Completed GC' },
  in_progress:      { bg: 'bg-sky-50',     text: 'text-sky-700',     label: 'In Progress' },
  awaiting_details: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Awaiting Details' },
  awaiting_agent:   { bg: 'bg-orange-50',  text: 'text-orange-700',  label: 'Awaiting Agent' },
  unresponsive:     { bg: 'bg-rose-50',    text: 'text-rose-700',    label: 'Unresponsive' },
};

interface InsightBadgeProps {
  status: InsightStatus;
  className?: string;
}

export function InsightBadge({ status, className }: InsightBadgeProps) {
  const style = INSIGHT_STYLES[status] ?? INSIGHT_STYLES['awaiting_agent'];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}
