/**
 * Pricing Logic - Epic 3.6
 *
 * Determines the current price for a customer based on price change schedule
 *
 * Business Logic:
 * - If no published price change: Return current package price
 * - If customer signed up AFTER price change published: Return new price immediately
 * - If customer signed up BEFORE price change published: Return old price (until effective_date)
 * - After effective_date: All customers get new price
 */

import { createClient } from '@/lib/supabase/server';

export interface PriceChangeInfo {
  id: string;
  old_price: number;
  new_price: number;
  price_difference: number;
  percentage_change: number;
  published_at: string;
  effective_date: string;
  status: 'draft' | 'published' | 'effective' | 'cancelled';
  days_until_effective: number;
}

export interface CurrentPriceResult {
  current_price: number;
  price_change?: PriceChangeInfo;
  reason:
    | 'no_price_change' // No published price change exists
    | 'new_customer_new_price' // Customer signed up after publication, gets new price
    | 'existing_customer_old_price' // Customer signed up before publication, keeps old price
    | 'effective_new_price'; // Price change is effective, everyone gets new price
  notice_period_active: boolean;
}

/**
 * Get current price for a customer based on signup date
 *
 * @param servicePackageId - UUID of service package
 * @param customerSignupDate - When customer signed up (defaults to NOW for new customers)
 * @returns Current applicable price and reason
 */
export async function getCurrentPriceForCustomer(
  servicePackageId: string,
  customerSignupDate?: Date
): Promise<CurrentPriceResult> {
  const supabase = await createClient();

  // ============================================================================
  // Get Service Package
  // ============================================================================
  const { data: servicePackage, error: packageError } = await supabase
    .from('service_packages')
    .select('id, name, price')
    .eq('id', servicePackageId)
    .single();

  if (packageError || !servicePackage) {
    throw new Error(`Service package not found: ${servicePackageId}`);
  }

  const currentPrice = servicePackage.price;

  // ============================================================================
  // Check for Published or Effective Price Change
  // ============================================================================
  const { data: priceChange, error: priceChangeError } = await supabase
    .from('price_changes')
    .select('*')
    .eq('service_package_id', servicePackageId)
    .in('status', ['published', 'effective'])
    .maybeSingle();

  if (priceChangeError) {
    console.error('[getCurrentPriceForCustomer] Error fetching price change:', priceChangeError);
    // Return current price if query fails
    return {
      current_price: currentPrice,
      reason: 'no_price_change',
      notice_period_active: false,
    };
  }

  // ============================================================================
  // No Published Price Change - Return Current Price
  // ============================================================================
  if (!priceChange) {
    return {
      current_price: currentPrice,
      reason: 'no_price_change',
      notice_period_active: false,
    };
  }

  // ============================================================================
  // Calculate Days Until Effective
  // ============================================================================
  const effectiveDateObj = new Date(priceChange.effective_date);
  const today = new Date();
  const daysUntilEffective = Math.ceil(
    (effectiveDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const priceChangeInfo: PriceChangeInfo = {
    id: priceChange.id,
    old_price: priceChange.old_price,
    new_price: priceChange.new_price,
    price_difference: priceChange.price_difference,
    percentage_change: priceChange.percentage_change,
    published_at: priceChange.published_at,
    effective_date: priceChange.effective_date,
    status: priceChange.status,
    days_until_effective: daysUntilEffective,
  };

  // ============================================================================
  // Price Change is Effective - Everyone Gets New Price
  // ============================================================================
  if (priceChange.status === 'effective' || daysUntilEffective <= 0) {
    return {
      current_price: priceChange.new_price,
      price_change: priceChangeInfo,
      reason: 'effective_new_price',
      notice_period_active: false,
    };
  }

  // ============================================================================
  // Price Change is Published - Check Customer Signup Date
  // ============================================================================
  const signupDate = customerSignupDate || new Date(); // Default to NOW for new customers
  const publishedAt = new Date(priceChange.published_at);

  // Customer signed up AFTER price change published?
  if (signupDate >= publishedAt) {
    // New customer gets new price immediately
    return {
      current_price: priceChange.new_price,
      price_change: priceChangeInfo,
      reason: 'new_customer_new_price',
      notice_period_active: true,
    };
  }

  // Customer signed up BEFORE price change published
  // Keep old price until effective_date
  return {
    current_price: priceChange.old_price,
    price_change: priceChangeInfo,
    reason: 'existing_customer_old_price',
    notice_period_active: true,
  };
}

/**
 * Get current price using database function
 * (Alternative approach - calls PostgreSQL function directly)
 *
 * @param servicePackageId - UUID of service package
 * @param customerSignupDate - When customer signed up
 * @returns Current price as number
 */
export async function getCurrentPriceFromDB(
  servicePackageId: string,
  customerSignupDate?: Date
): Promise<number> {
  const supabase = await createClient();

  const signupDateStr = customerSignupDate
    ? customerSignupDate.toISOString()
    : new Date().toISOString();

  const { data, error } = await supabase.rpc('get_current_price_for_customer', {
    p_service_package_id: servicePackageId,
    p_customer_signup_date: signupDateStr,
  });

  if (error) {
    console.error('[getCurrentPriceFromDB] Error:', error);
    throw new Error(`Failed to get current price: ${error.message}`);
  }

  return parseFloat(data);
}

/**
 * Get price breakdown for quote generation
 *
 * Returns detailed price information for displaying to customer
 *
 * @param servicePackageId - UUID of service package
 * @param customerSignupDate - When customer signed up (optional)
 * @returns Detailed price breakdown
 */
export async function getPriceBreakdownForQuote(
  servicePackageId: string,
  customerSignupDate?: Date
) {
  const priceResult = await getCurrentPriceForCustomer(
    servicePackageId,
    customerSignupDate
  );

  const breakdown: any = {
    current_price: priceResult.current_price,
    notice_period_active: priceResult.notice_period_active,
    pricing_reason: priceResult.reason,
  };

  // Add price change details if applicable
  if (priceResult.price_change) {
    const { price_change } = priceResult;

    breakdown.price_change = {
      status: price_change.status,
      old_price: price_change.old_price,
      new_price: price_change.new_price,
      price_difference: price_change.price_difference,
      percentage_change: price_change.percentage_change,
      effective_date: price_change.effective_date,
      days_until_effective: price_change.days_until_effective,
    };

    // Add customer-facing message based on reason
    switch (priceResult.reason) {
      case 'new_customer_new_price':
        breakdown.customer_message =
          `This package has a scheduled price change. As a new customer, you will be charged R${price_change.new_price}/month.` +
          ` (Effective price as of ${price_change.effective_date})`;
        break;

      case 'existing_customer_old_price':
        breakdown.customer_message =
          `This package has a scheduled price change. Your current price is R${price_change.old_price}/month.` +
          ` Starting ${price_change.effective_date}, the price will be R${price_change.new_price}/month.`;
        break;

      case 'effective_new_price':
        breakdown.customer_message = `Current price: R${price_change.new_price}/month`;
        break;
    }
  }

  return breakdown;
}
