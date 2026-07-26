'use client';

import { cn } from '@/lib/utils';

interface MetricPanelProps {
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  trend?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricPanel({ label, value, description, trend, icon, className }: MetricPanelProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-gray-950 tabular-nums">{value}</div>
        </div>
        {icon && <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 text-gray-500">{icon}</div>}
      </div>
      {(description || trend) && (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
          {description && <span className="truncate">{description}</span>}
          {trend && <span className="shrink-0 font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
}
