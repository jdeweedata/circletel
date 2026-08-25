import { cn } from '@/lib/utils';
import { AGING_BUCKET_LABELS } from '@/lib/billing/health/aging';
import type { AgingBucketKey } from '@/lib/billing/health/types';

const BUCKET_STYLES: Record<AgingBucketKey, string> = {
  current: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  '1-7d': 'bg-teal-50 text-teal-700 ring-teal-600/20',
  '8-30d': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  '31-60d': 'bg-red-50 text-red-700 ring-red-600/20',
  '61d+': 'bg-red-100 text-red-800 ring-red-700/20',
};

export function AgingBadge({
  bucket,
  className,
}: {
  bucket: AgingBucketKey;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        BUCKET_STYLES[bucket],
        className
      )}
    >
      {AGING_BUCKET_LABELS[bucket]}
    </span>
  );
}
