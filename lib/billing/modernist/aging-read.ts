// lib/billing/modernist/aging-read.ts
import type { AgingBuckets } from '@/lib/billing/health/types';

export function agingReadCopy(aging: AgingBuckets): string | null {
  const deep =
    aging['8-30d'] + aging['31-60d'] + aging['61d+'];
  if (deep === 0 && aging['1-7d'] > 0) {
    return 'The whole past-due balance is under eight days old. This is a debit-order timing problem, not a bad-debt problem — the suspension policy fires on age, so nothing should be suspended today without a manual check.';
  }
  if (deep > 0) {
    return 'Past-due balance has aged beyond seven days. Prioritise the suspension watchlist and collections before treating this as a timing lag.';
  }
  return null;
}
