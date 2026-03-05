'use client';

import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  compact = false,
  className,
}: SectionCardProps) {
  const padding = compact ? 'p-4' : 'p-6';
  const headerPadding = compact ? 'p-4' : 'px-6 py-4';

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm', className)}>
      <div className={cn('border-b border-slate-100 flex justify-between items-center', headerPadding)}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <h3 className={cn('font-bold text-slate-900', compact && 'text-sm')}>{title}</h3>
        </div>
        {action}
      </div>
      <div className={padding}>{children}</div>
    </div>
  );
}
