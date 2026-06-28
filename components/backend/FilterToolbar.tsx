'use client';

import { cn } from '@/lib/utils';

interface FilterToolbarProps {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function FilterToolbar({ children, action, className }: FilterToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">{children}</div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
