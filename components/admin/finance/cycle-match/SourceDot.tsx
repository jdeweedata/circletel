import { cn } from '@/lib/utils';

const COLORS = {
  platform: 'bg-blue-600',
  zoho: 'bg-circleTel-orange',
  netcash: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  grey: 'bg-slate-400',
} as const;

export type SourceDotTone = keyof typeof COLORS;

export function SourceDot({
  tone,
  className,
}: {
  tone: SourceDotTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-block h-2 w-2 flex-none rounded-[1px]', COLORS[tone], className)}
    />
  );
}
