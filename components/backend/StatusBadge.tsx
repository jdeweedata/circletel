'use client';

import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  /** Leading dot. Defaults off — the bordered pill reads clearly without it. */
  showDot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Canonical status badge for backend UIs. Uses the bolder bordered style from the
 * consumer billing dashboard (the reference look), so every surface communicates
 * status identically. Map raw DB strings with `getStatusVariant()`.
 */
const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function StatusBadge({
  status,
  variant = 'neutral',
  showDot = false,
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold',
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

/** Maps common status strings to a semantic variant. */
export function getStatusVariant(status: string): StatusVariant {
  const statusLower = status.toLowerCase();

  if (['active', 'completed', 'paid', 'success', 'approved', 'verified'].some((s) => statusLower.includes(s))) {
    return 'success';
  }
  if (['pending', 'processing', 'awaiting', 'scheduled', 'unpaid'].some((s) => statusLower.includes(s))) {
    return 'warning';
  }
  if (['failed', 'cancelled', 'canceled', 'rejected', 'error', 'expired', 'overdue'].some((s) => statusLower.includes(s))) {
    return 'error';
  }
  if (['info', 'new', 'draft'].some((s) => statusLower.includes(s))) {
    return 'info';
  }

  return 'neutral';
}
