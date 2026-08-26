import { buildCreditReview } from './decision';
import type { CreditReviewInput, OrderCreditReview } from './types';

type SupabaseLike = {
  from: (table: string) => any;
};

export async function getOrderCreditReview(
  supabase: SupabaseLike,
  consumerOrderId: string
): Promise<OrderCreditReview | null> {
  const { data, error } = await supabase
    .from('order_credit_reviews')
    .select('*')
    .eq('consumer_order_id', consumerOrderId)
    .maybeSingle();
  if (error || !data) return null;
  return data as OrderCreditReview;
}

export async function upsertOrderCreditReview(
  supabase: SupabaseLike,
  input: CreditReviewInput
): Promise<OrderCreditReview> {
  const review = buildCreditReview(input);
  const row = {
    ...review,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('order_credit_reviews')
    .upsert(row, { onConflict: 'consumer_order_id' })
    .select('*')
    .single();
  if (error) {
    throw new Error(error.message || 'Failed to save credit review');
  }
  return data as OrderCreditReview;
}

export async function getCreditReviewsByOrderIds(
  supabase: SupabaseLike,
  orderIds: string[]
): Promise<Record<string, OrderCreditReview>> {
  if (orderIds.length === 0) return {};
  const { data } = await supabase
    .from('order_credit_reviews')
    .select('*')
    .in('consumer_order_id', orderIds);
  const map: Record<string, OrderCreditReview> = {};
  for (const row of data ?? []) {
    map[row.consumer_order_id] = row as OrderCreditReview;
  }
  return map;
}
