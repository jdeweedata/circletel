'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Canonical metric card for backend UIs — the network console look.
 * Promoted from components/admin/network/performance/MetricCard.tsx, which is
 * now a re-export shim so the network pages render identically.
 *
 * Use this (not StatCard) for new/migrated pages. `children` renders below the
 * value block — pass a small icon or an inline chart.
 */
export type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string | null;
  deltaPositive?: boolean | null;
  children?: ReactNode;
  className?: string;
};

export function MetricCard({
  title,
  value,
  subtitle,
  delta,
  deltaPositive,
  children,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
          {delta ? (
            <p
              className={cn(
                'text-xs mt-1 font-medium',
                deltaPositive === true && 'text-blue-600',
                deltaPositive === false && 'text-amber-600',
                deltaPositive == null && 'text-slate-500'
              )}
            >
              {delta}
            </p>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
