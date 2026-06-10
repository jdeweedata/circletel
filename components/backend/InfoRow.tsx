'use client';

import { cn } from '@/lib/utils';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}

/** Key/value row for detail panels. Promoted from components/admin/shared/InfoRow.tsx. */
export function InfoRow({ label, value, icon: Icon, className }: InfoRowProps) {
  return (
    <div className={cn('flex justify-between items-center py-3 border-b border-gray-50 last:border-0', className)}>
      <span className="text-sm text-gray-500 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
  );
}
