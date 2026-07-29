'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AnalyticsEmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
};

export function AnalyticsEmptyState({
  title,
  description,
  icon,
  className,
}: AnalyticsEmptyStateProps) {
  return (
    <Card
      className={cn(
        'border border-slate-200/80 shadow-sm rounded-xl bg-white h-full',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        {icon ? <div className="mb-3 text-slate-300">{icon}</div> : null}
        <p className="text-sm text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}
