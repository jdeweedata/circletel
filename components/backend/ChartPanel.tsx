'use client';

import { PiCaretRightBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartPanel({ title, subtitle, action, children, className }: ChartPanelProps) {
  return (
    <section className={cn('min-h-[240px] rounded-lg border border-gray-200 bg-white shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-gray-950">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action ?? <PiCaretRightBold className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}
