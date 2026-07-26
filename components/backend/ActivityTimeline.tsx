'use client';

import { cn } from '@/lib/utils';

export interface ActivityTimelineItem {
  id: string;
  title: string;
  description?: React.ReactNode;
  timestamp?: string;
  category?: string;
  icon?: React.ReactNode;
}

interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
  emptyLabel?: string;
  className?: string;
}

export function ActivityTimeline({ items, emptyLabel = 'No activity yet', className }: ActivityTimelineProps) {
  if (items.length === 0) {
    return <p className={cn('py-6 text-sm text-gray-500', className)}>{emptyLabel}</p>;
  }

  return (
    <ol className={cn('space-y-0', className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && <span className="absolute left-4 top-8 h-full w-px bg-gray-200" aria-hidden="true" />}
          <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            {item.icon ?? <span className="h-2 w-2 rounded-full bg-current" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
            </div>
            {item.timestamp && <p className="mt-0.5 text-xs text-gray-500">{item.timestamp}</p>}
            {item.description && <div className="mt-2 text-sm text-gray-600">{item.description}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
