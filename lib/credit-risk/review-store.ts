import { buildCreditReview, buildQuoteCreditReview } from './decision';
import type { CreditReviewInput, OrderCreditReview, QuoteCreditReview } from './types';

export function adminFieldsToKeepOnPull(
  existing?: Pick<
    OrderCreditReview,
    'hardware_prepaid' | 'private_note' | 'override_reason' | 'override_by' | 'override_signoffs'
  > | null
): Pick<
  CreditReviewInput,
  'hardware_prepaid' | 'private_note' | 'override_reason' | 'override_by' | 'override_signoffs'
> {
  return {
    hardware_prepaid: Boolean(existing?.hardware_prepaid),
    private_note: existing?.private_note ?? null,
    override_reason: existing?.override_reason ?? null,
    override_by: existing?.override_by ?? null,
    override_signoffs: existing?.override_signoffs ?? null,
  };
}

export function adminFieldsToKeepOnPull(
  existing?: OrderCreditReview | null
): Pick<CreditReviewInput, 'hardware_prepaid' | 'private_note' | 'override_reason' | 'override_by'> {
  return {
    hardware_prepaid: Boolean(existing?.hardware_prepaid),
    private_note: existing?.private_note ?? null,
    override_reason: existing?.override_reason ?? null,
    override_by: existing?.override_by ?? null,
  };
}

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

export async function getQuoteCreditReview(
  supabase: SupabaseLike,
  businessQuoteId: string
): Promise<QuoteCreditReview | null> {
  const { data, error } = await supabase
    .from('quote_credit_reviews')
    .select('*')
    .eq('business_quote_id', businessQuoteId)
    .maybeSingle();
  if (error || !data) return null;
  return data as QuoteCreditReview;
}

export async function upsertQuoteCreditReview(
  supabase: SupabaseLike,
  input: CreditReviewInput
): Promise<QuoteCreditReview> {
  const review = buildQuoteCreditReview(input);
  const row = {
    ...review,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('quote_credit_reviews')
    .upsert(row, { onConflict: 'business_quote_id' })
    .select('*')
    .single();
  if (error) {
    throw new Error(error.message || 'Failed to save quote credit review');
  }
  return data as QuoteCreditReview;
}
