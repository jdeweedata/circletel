'use client';

import { cn } from '@/lib/utils';

type SegmentedBarProps = {
  successPercent: number;
  failedPercent: number;
  successLabel?: string;
  failedLabel?: string;
  className?: string;
};

export function SegmentedBar({
  successPercent,
  failedPercent,
  successLabel = 'Successful',
  failedLabel = 'Failed / degraded',
  className,
}: SegmentedBarProps) {
  const success = Math.max(0, Math.min(100, successPercent));
  const failed = Math.max(0, Math.min(100 - success, failedPercent));

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
        Live Traffic Distribution
      </p>
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${success}%` }} />
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${failed}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          {successLabel} ({success.toFixed(1)}%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {failedLabel} ({failed.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
