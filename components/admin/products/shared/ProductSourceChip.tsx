'use client';

import { cn } from '@/lib/utils';
import type { UnifiedProductSource } from '@/lib/types/unified-product';

const SOURCE_STYLE: Record<UnifiedProductSource, string> = {
  CircleTel: 'bg-circleTel-orange-light text-circleTel-orange-accessible',
  'MTN / Arlan': 'bg-blue-50 text-blue-700',
  Hardware: 'bg-slate-100 text-slate-700',
};

/** Colour-coded chip identifying which source a unified product comes from. */
export function ProductSourceChip({
  source,
  className,
}: {
  source: UnifiedProductSource;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        SOURCE_STYLE[source],
        className
      )}
    >
      {source}
    </span>
  );
}
