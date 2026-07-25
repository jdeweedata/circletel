'use client';

import { cn } from '@/lib/utils';

type DotMatrixChartProps = {
  values: number[];
  label?: string;
  className?: string;
};

/** 30-day uptime as a blue intensity grid (mockup-style). */
export function DotMatrixChart({ values, label = 'Last 30 Days', className }: DotMatrixChartProps) {
  const cols = 15;
  const rows = Math.max(1, Math.ceil(values.length / cols));

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        aria-label={label}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const v = values[i];
          const intensity =
            v == null ? 0 : Math.min(1, Math.max(0.15, v / 100));
          return (
            <div
              key={i}
              title={v == null ? undefined : `${v.toFixed(1)}%`}
              className={cn(
                'aspect-square rounded-[2px]',
                v == null ? 'bg-slate-100' : 'bg-blue-600'
              )}
              style={v == null ? undefined : { opacity: intensity }}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
