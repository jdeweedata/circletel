/**
 * Expire stale / test business quotes without deleting history.
 *
 * Used by the admin quote list so past-valid quotes cannot refill the open book.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const OPEN_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'viewed',
] as const;

export interface ExpireStaleQuotesResult {
  expired: number;
  error?: string;
}

/**
 * Mark open quotes past valid_until as expired.
 * Does not touch rejected quotes. Test-name matching is handled by the one-shot migration.
 */
export async function expireStaleQuotes(
  supabase: SupabaseClient
): Promise<ExpireStaleQuotesResult> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('business_quotes')
    .update({ status: 'expired', expired_at: now, updated_at: now })
    .in('status', [...OPEN_STATUSES])
    .lt('valid_until', today)
    .select('id');

  if (error) {
    return { expired: 0, error: error.message };
  }

  return { expired: data?.length ?? 0 };
}

/** Query param `open` (or omitted) means every status except expired. Pass `all` to include expired. */
export function isOpenQuoteStatusFilter(status: string | null): boolean {
  return !status || status === 'open';
}
