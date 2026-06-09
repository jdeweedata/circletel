'use client';

import { cn } from '@/lib/utils';

export type MarginTone = 'low' | 'ok' | 'healthy';

/**
 * Margin thresholds (margin-guardrails.md): <25% low, 25–35% ok, >35% healthy.
 * Centralised so cards, bars and badges stay consistent.
 */
export function marginTone(margin: number): { bar: string; text: string; tone: MarginTone } {
  if (margin < 25) return { bar: 'bg-red-500', text: 'text-red-600', tone: 'low' };
  if (margin < 35) return { bar: 'bg-amber-500', text: 'text-amber-600', tone: 'ok' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-600', tone: 'healthy' };
}

interface MarginBarProps {
  /** Margin percentage (e.g. 38 for 38%). */
  margin: number;
  showLabel?: boolean;
  className?: string;
}

/** Slim colour-coded margin indicator. */
export function MarginBar({ margin, showLabel = true, className }: MarginBarProps) {
  const tone = marginTone(margin);
  const width = Math.max(0, Math.min(100, margin));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all', tone.bar)}
          style={{ width: `${width}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('text-xs font-semibold tabular-nums', tone.text)}>{margin}%</span>
      )}
    </div>
  );
}
