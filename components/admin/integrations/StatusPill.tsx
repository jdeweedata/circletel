'use client';

import { Card, CardContent } from '@/components/ui/card';

interface StatusPillProps {
  label: string;
  value: string | number;
  color?: string;
}

/**
 * StatusPill - Displays a metric with label in a compact card format
 * Used in integration health summaries
 */
export function StatusPill({
  label,
  value,
  color = 'text-gray-900',
}: StatusPillProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-2 p-4">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
