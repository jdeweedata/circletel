'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ResourceRow = {
  key: string;
  label: string;
  value: number | null;
  icon: ReactNode;
};

type ResourceUsageListProps = {
  title?: string;
  subtitle?: string;
  rows: ResourceRow[];
  className?: string;
};

function statusFor(value: number | null): { label: string; bar: string; text: string } {
  if (value == null) return { label: '—', bar: 'bg-slate-200', text: 'text-slate-400' };
  if (value >= 80) return { label: 'High', bar: 'bg-red-500', text: 'text-red-600' };
  if (value >= 65) return { label: 'Elevated', bar: 'bg-amber-400', text: 'text-amber-600' };
  return { label: 'Normal', bar: 'bg-blue-600', text: 'text-blue-600' };
}

export function ResourceUsageList({
  title = 'Resource Usage',
  subtitle,
  rows,
  className,
}: ResourceUsageListProps) {
  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => {
          const status = statusFor(row.value);
          const width = row.value == null ? 0 : Math.min(100, Math.max(0, row.value));
          return (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
                  <span className="text-slate-400">{row.icon}</span>
                  {row.label}
                </span>
                <span className="tabular-nums text-slate-900 font-semibold">
                  {row.value == null ? '—' : `${row.value.toFixed(0)}%`}
                  <span className={cn('ml-2 text-xs font-medium', status.text)}>{status.label}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', status.bar)} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
