'use client';

import { PiCheckCircleBold, PiCircleBold, PiXCircleBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  label: string;
  /** True when this gate is satisfied. */
  ok: boolean;
  /** Optional sub-text (e.g. the blocking reason). */
  detail?: string;
  /** Render an unmet item as a hard blocker (red ✕) rather than a neutral todo. */
  blocking?: boolean;
}

/** Publish-readiness checklist (content / images / pricing / rules / approval). */
export function PublishReadinessChecklist({
  items,
  className,
}: {
  items: ChecklistItem[];
  className?: string;
}) {
  const done = items.filter((i) => i.ok).length;
  return (
    <div className={cn('rounded-lg border border-ui-border bg-white p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ui-text-muted">
          Publish readiness
        </span>
        <span className="text-xs font-medium text-ui-text-secondary">
          {done}/{items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-sm">
            {item.ok ? (
              <PiCheckCircleBold className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : item.blocking ? (
              <PiXCircleBold className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            ) : (
              <PiCircleBold className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
            )}
            <span className={cn(item.ok ? 'text-ui-text-primary' : 'text-ui-text-muted')}>
              {item.label}
              {item.detail && (
                <span className="block text-xs text-ui-text-muted">{item.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
