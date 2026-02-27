/**
 * Promotion Service
 *
 * Handles all promotion-related business logic including validation,
 * application, and usage tracking.
 */

import { createClient } from '@/lib/supabase/server';

// Types
export type DiscountType = 'percentage' | 'fixed' | 'free_installation' | 'free_month';
export type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived';
export type CustomerType = 'residential' | 'business' | 'all';

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  promo_code: string | null;
  product_id: string | null;
  product_category: string | null;
  customer_type: CustomerType | null;
  valid_from: string;
  valid_until: string | null;
  max_usage: number | null;
  usage_count: number;
  max_per_customer: number;
  status: PromotionStatus;
  display_on_homepage: boolean;
  display_on_product: boolean;
  banner_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionUsage {
  id: string;
  promotion_id: string;
  customer_id: string | null;
  order_id: string | null;
  order_type: 'consumer' | 'business' | null;
  source: string | null;
  partner_id: string | null;
  ambassador_code: string | null;
  original_amount: number | null;
  discount_amount: number | null;
  final_amount: number | null;
  used_at: string;
}

export interface ApplyPromotionResult {
  success: boolean;
  promotion?: Promotion;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  error?: string;
}

export interface ValidatePromoCodeResult {
  valid: boolean;
  promotion?: Promotion;
  error?: string;
}

/**
 * Get all promotions with optional filters
 */
export async function getPromotions(options?: {
  status?: PromotionStatus | 'all';
  search?: string;
  productId?: string;
  customerType?: CustomerType;
  limit?: number;
  offset?: number;
}): Promise<{ promotions: Promotion[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('promotions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,promo_code.ilike.%${options.search}%`
    );
  }

  if (options?.productId) {
    query = query.eq('product_id', options.productId);
  }

  if (options?.customerType) {
    query = query.or(`customer_type.eq.${options.customerType},customer_type.eq.all`);
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching promotions:', error);
    throw new Error('Failed to fetch promotions');
  }

  return {
    promotions: data || [],
    total: count || 0,
  };
}

/**
 * Get active promotions for display
 */
export async function getActivePromotions(options?: {
  productId?: string;
  customerType?: CustomerType;
  homepage?: boolean;
}): Promise<Promotion[]> {
  const supabase = await createClient();

  let query = supabase
    .from('promotions')
    .select('*')
    .eq('status', 'active')
    .or('valid_until.is.null,valid_until.gt.now()');

  if (options?.productId) {
    query = query.or(`product_id.eq.${options.productId},product_id.is.null`);
  }

  if (options?.customerType) {
    query = query.or(`customer_type.eq.${options.customerType},customer_type.eq.all`);
  }

  if (options?.homepage) {
    query = query.eq('display_on_homepage', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching active promotions:', error);
    return [];
  }

  return data || [];
}

/**
 * Validate a promo code
 */
export async function validatePromoCode(
  code: string,
  options?: {
    customerId?: string;
    productId?: string;
    customerType?: CustomerType;
  }
): Promise<ValidatePromoCodeResult> {
  const supabase = await createClient();

  // Find the promotion by code
  const { data: promotion, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('promo_code', code.toUpperCase())
    .single();

  if (error || !promotion) {
    return { valid: false, error: 'Invalid promo code' };
  }

  // Check if active
  if (promotion.status !== 'active') {
    return { valid: false, error: 'This promo code is no longer active' };
  }

  // Check validity dates
  const now = new Date();
  if (promotion.valid_from && new Date(promotion.valid_from) > now) {
    return { valid: false, error: 'This promo code is not yet valid' };
  }
  if (promotion.valid_until && new Date(promotion.valid_until) < now) {
    return { valid: false, error: 'This promo code has expired' };
  }

  // Check max usage
  if (promotion.max_usage && promotion.usage_count >= promotion.max_usage) {
    return { valid: false, error: 'This promo code has reached its usage limit' };
  }

  // Check customer type
  if (options?.customerType && promotion.customer_type !== 'all') {
    if (promotion.customer_type !== options.customerType) {
      return {
        valid: false,
        error: `This promo code is only valid for ${promotion.customer_type} customers`,
      };
    }
  }

  // Check product restriction
  if (promotion.product_id && options?.productId) {
    if (promotion.product_id !== options.productId) {
      return { valid: false, error: 'This promo code is not valid for this product' };
    }
  }

  // Check per-customer usage limit
  if (options?.customerId && promotion.max_per_customer) {
    const { count } = await supabase
      .from('promotion_usage')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', promotion.id)
      .eq('customer_id', options.customerId);

    if (count && count >= promotion.max_per_customer) {
      return { valid: false, error: 'You have already used this promo code' };
    }
  }

  return { valid: true, promotion };
}

/**
 * Calculate discount amount based on promotion type
 */
export function calculateDiscount(
  promotion: Promotion,
  originalAmount: number
): number {
  switch (promotion.discount_type) {
    case 'percentage':
      return Math.round(originalAmount * (promotion.discount_value / 100) * 100) / 100;
    case 'fixed':
      return Math.min(promotion.discount_value, originalAmount);
    case 'free_installation':
      // Assumes installation fee is passed as part of the amount
      // In practice, this would need to know the installation fee separately
      return 0; // Handled separately in order processing
    case 'free_month':
      // Returns the monthly amount as discount
      return originalAmount;
    default:
      return 0;
  }
}

/**
 * Apply a promotion to an order
 */
export async function applyPromotion(
  promotionId: string,
  originalAmount: number,
  options: {
    customerId?: string;
    orderId: string;
    orderType: 'consumer' | 'business';
    source?: string;
    partnerId?: string;
    ambassadorCode?: string;
  }
): Promise<ApplyPromotionResult> {
  const supabase = await createClient();

  // Get the promotion
  const { data: promotion, error: fetchError } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .single();

  if (fetchError || !promotion) {
    return {
      success: false,
      originalAmount,
      discountAmount: 0,
      finalAmount: originalAmount,
      error: 'Promotion not found',
    };
  }

  // Calculate discount
  const discountAmount = calculateDiscount(promotion, originalAmount);
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  // Record usage
  const { error: usageError } = await supabase.from('promotion_usage').insert({
    promotion_id: promotionId,
    customer_id: options.customerId || null,
    order_id: options.orderId,
    order_type: options.orderType,
    source: options.source || null,
    partner_id: options.partnerId || null,
    ambassador_code: options.ambassadorCode || null,
    original_amount: originalAmount,
    discount_amount: discountAmount,
    final_amount: finalAmount,
  });

  if (usageError) {
    console.error('Error recording promotion usage:', usageError);
    // Don't fail the order, just log the error
  }

  // Increment usage count
  const { error: updateError } = await supabase
    .from('promotions')
    .update({ usage_count: promotion.usage_count + 1 })
    .eq('id', promotionId);

  if (updateError) {
    console.error('Error updating promotion usage count:', updateError);
  }

  return {
    success: true,
    promotion,
    originalAmount,
    discountAmount,
    finalAmount,
  };
}

/**
 * Track promotion usage (for analytics)
 */
export async function trackUsage(
  promotionId: string,
  data: {
    customerId?: string;
    orderId?: string;
    orderType?: 'consumer' | 'business';
    source?: string;
    partnerId?: string;
    ambassadorCode?: string;
    originalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
  }
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from('promotion_usage').insert({
    promotion_id: promotionId,
    customer_id: data.customerId || null,
    order_id: data.orderId || null,
    order_type: data.orderType || null,
    source: data.source || null,
    partner_id: data.partnerId || null,
    ambassador_code: data.ambassadorCode || null,
    original_amount: data.originalAmount || null,
    discount_amount: data.discountAmount || null,
    final_amount: data.finalAmount || null,
  });

  if (error) {
    console.error('Error tracking promotion usage:', error);
    return false;
  }

  return true;
}

/**
 * Get promotion usage statistics
 */
export async function getPromotionStats(promotionId: string): Promise<{
  totalRedemptions: number;
  totalDiscountGiven: number;
  averageDiscount: number;
  recentUsage: PromotionUsage[];
}> {
  const supabase = await createClient();

  // Get total redemptions
  const { count: totalRedemptions } = await supabase
    .from('promotion_usage')
    .select('*', { count: 'exact', head: true })
    .eq('promotion_id', promotionId);

  // Get total discount given
  const { data: discountData } = await supabase
    .from('promotion_usage')
    .select('discount_amount')
    .eq('promotion_id', promotionId);

  const totalDiscountGiven =
    discountData?.reduce((sum, row) => sum + (Number(row.discount_amount) || 0), 0) || 0;

  const averageDiscount =
    totalRedemptions && totalRedemptions > 0
      ? totalDiscountGiven / totalRedemptions
      : 0;

  // Get recent usage
  const { data: recentUsage } = await supabase
    .from('promotion_usage')
    .select('*')
    .eq('promotion_id', promotionId)
    .order('used_at', { ascending: false })
    .limit(10);

  return {
    totalRedemptions: totalRedemptions || 0,
    totalDiscountGiven,
    averageDiscount,
    recentUsage: recentUsage || [],
  };
}

/**
 * Generate a unique promo code
 */
export function generatePromoCode(prefix = 'CT'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = `${prefix}-`;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if a promo code is available
 */
export async function isPromoCodeAvailable(code: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('promotions')
    .select('id')
    .eq('promo_code', code.toUpperCase())
    .single();

  return !data;
}
