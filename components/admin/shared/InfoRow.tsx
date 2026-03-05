'use client';

import { cn } from '@/lib/utils';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}

export function InfoRow({
  label,
  value,
  icon: Icon,
  className,
}: InfoRowProps) {
  return (
    <div className={cn('flex justify-between items-center py-3 border-b border-slate-50 last:border-0', className)}>
      <span className="text-sm text-slate-500 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 text-right">{value || '—'}</span>
    </div>
  );
}
