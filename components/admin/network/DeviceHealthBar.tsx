'use client';

import { cn } from '@/lib/utils';

/** Health proxy from CPU: online → 100 - cpu; offline → 0; missing CPU → null. */
export function healthFromCpu(
  status: string,
  cpu: number | null | undefined
): number | null {
  if (status === 'offline') return 0;
  if (cpu == null || Number.isNaN(cpu)) return null;
  return Math.max(0, Math.min(100, Math.round(100 - cpu)));
}

export function DeviceHealthBar({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  const pct = value ?? 0;
  const color =
    value == null
      ? 'bg-gray-200'
      : pct >= 90
        ? 'bg-emerald-500'
        : pct >= 70
          ? 'bg-amber-400'
          : pct > 0
            ? 'bg-red-500'
            : 'bg-gray-200';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${value == null ? 0 : pct}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-xs text-gray-500">
        {value == null || value <= 0 ? '—' : `${value}%`}
      </span>
    </div>
  );
}
