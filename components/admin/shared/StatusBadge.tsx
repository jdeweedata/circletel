'use client';

import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  showDot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-slate-100 text-slate-700',
};

export function StatusBadge({
  status,
  variant = 'neutral',
  showDot = true,
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {icon ? (
        <span className="shrink-0">{icon}</span>
      ) : showDot ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      ) : null}
      {status}
    </span>
  );
}

// Utility function to map common status strings to variants
export function getStatusVariant(status: string): StatusVariant {
  const statusLower = status.toLowerCase();

  if (['active', 'completed', 'paid', 'success', 'approved', 'verified'].some(s => statusLower.includes(s))) {
    return 'success';
  }
  if (['pending', 'processing', 'awaiting', 'scheduled'].some(s => statusLower.includes(s))) {
    return 'warning';
  }
  if (['failed', 'cancelled', 'rejected', 'error', 'expired'].some(s => statusLower.includes(s))) {
    return 'error';
  }
  if (['info', 'new', 'draft'].some(s => statusLower.includes(s))) {
    return 'info';
  }

  return 'neutral';
}
