import { cn } from '@/lib/utils';

/**
 * Billing Health stat tile — icon in a coloured circle, label, large value,
 * one coloured primary line and one muted secondary line.
 * Shared across the Finance/Billing admin section.
 */
export function HealthCard({
  label,
  value,
  primaryLine,
  primaryClassName,
  secondaryLine,
  icon,
  iconClassName,
}: {
  label: string;
  value: string;
  primaryLine: string;
  primaryClassName?: string;
  secondaryLine: string;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            iconClassName
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className={cn('mt-2 text-sm font-medium', primaryClassName ?? 'text-slate-600')}>
        {primaryLine}
      </p>
      <p className="text-xs text-slate-400">{secondaryLine}</p>
    </div>
  );
}
