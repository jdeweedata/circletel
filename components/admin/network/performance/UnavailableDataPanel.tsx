'use client';

import { PiInfoBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type UnavailablePanelItem = {
  key: string;
  title: string;
  reason: string;
};

type UnavailableDataPanelProps = {
  items: UnavailablePanelItem[];
  className?: string;
};

export function UnavailableDataPanel({ items, className }: UnavailableDataPanelProps) {
  if (!items.length) return null;

  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <PiInfoBold className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Not available for this group
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-0.5 px-6 py-2.5 sm:flex-row sm:items-baseline sm:gap-3"
            >
              <span className="text-sm font-medium text-slate-700 sm:w-48 sm:shrink-0">
                {item.title}
              </span>
              <span className="text-xs text-slate-500">{item.reason}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
