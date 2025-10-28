/**
 * Quote Calculator
 *
 * Handles all pricing calculations for business quotes
 * including VAT, discounts, and contract value calculations
 */

import type {
  BusinessQuoteItem,
  ContractTerm,
  PricingBreakdown,
  QuoteServiceSelection
} from './types';

const VAT_RATE = 0.15; // 15% South African VAT

/**
 * Calculate pricing breakdown from quote items
 */
export function calculatePricingBreakdown(
  items: BusinessQuoteItem[] | QuoteServiceSelection[],
  contractTerm: ContractTerm,
  discountPercent: number = 0,
  discountAmount: number = 0,
  discountReason?: string
): PricingBreakdown {
  // Calculate subtotals
  const subtotal_monthly = items.reduce(
    (sum, item) => sum + item.monthly_price * item.quantity,
    0
  );

  const subtotal_installation = items.reduce(
    (sum, item) => sum + item.installation_price * item.quantity,
    0
  );

  // Calculate discount
  let discount = 0;
  if (discountPercent > 0) {
    discount = subtotal_monthly * (discountPercent / 100);
  } else if (discountAmount > 0) {
    discount = discountAmount;
  }

  // Ensure discount doesn't exceed subtotal
  discount = Math.min(discount, subtotal_monthly);

  // Calculate totals after discount
  const monthly_after_discount = subtotal_monthly - discount;

  // Calculate VAT
  const vat_monthly = monthly_after_discount * VAT_RATE;
  const vat_installation = subtotal_installation * VAT_RATE;

  // Calculate final totals
  const total_monthly = monthly_after_discount + vat_monthly;
  const total_installation = subtotal_installation + vat_installation;

  // Calculate contract value
  const total_contract_value =
    total_monthly * contractTerm + total_installation;

  return {
    subtotal_monthly: roundToTwoDecimals(subtotal_monthly),
    subtotal_installation: roundToTwoDecimals(subtotal_installation),
    discount: roundToTwoDecimals(discount),
    discount_reason: discountReason,
    vat_monthly: roundToTwoDecimals(vat_monthly),
    vat_installation: roundToTwoDecimals(vat_installation),
    total_monthly: roundToTwoDecimals(total_monthly),
    total_installation: roundToTwoDecimals(total_installation),
    total_upfront: roundToTwoDecimals(total_installation),
    total_contract_value: roundToTwoDecimals(total_contract_value)
  };
}

/**
 * Calculate monthly savings from discount
 */
export function calculateMonthlySavings(
  subtotal: number,
  discountPercent: number,
  discountAmount: number
): number {
  let savings = 0;
  if (discountPercent > 0) {
    savings = subtotal * (discountPercent / 100);
  } else if (discountAmount > 0) {
    savings = discountAmount;
  }
  return roundToTwoDecimals(savings);
}

/**
 * Calculate total contract value over term
 */
export function calculateContractValue(
  monthlyTotal: number,
  installationTotal: number,
  contractTerm: ContractTerm
): number {
  return roundToTwoDecimals(monthlyTotal * contractTerm + installationTotal);
}

/**
 * Calculate discount percentage from amount
 */
export function calculateDiscountPercent(
  subtotal: number,
  discountAmount: number
): number {
  if (subtotal === 0) return 0;
  return roundToTwoDecimals((discountAmount / subtotal) * 100);
}

/**
 * Calculate discount amount from percentage
 */
export function calculateDiscountAmount(
  subtotal: number,
  discountPercent: number
): number {
  return roundToTwoDecimals(subtotal * (discountPercent / 100));
}

/**
 * Validate discount values
 */
export function validateDiscount(
  subtotal: number,
  discountPercent: number,
  discountAmount: number
): {
  valid: boolean;
  error?: string;
} {
  if (discountPercent < 0 || discountPercent > 100) {
    return {
      valid: false,
      error: 'Discount percentage must be between 0 and 100'
    };
  }

  if (discountAmount < 0) {
    return {
      valid: false,
      error: 'Discount amount cannot be negative'
    };
  }

  if (discountAmount > subtotal) {
    return {
      valid: false,
      error: 'Discount amount cannot exceed subtotal'
    };
  }

  return { valid: true };
}

/**
 * Round number to 2 decimal places
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format currency for South Africa (Rands)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format currency without decimals
 */
export function formatCurrencyWhole(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate price per Mbps (for comparison)
 */
export function calculatePricePerMbps(
  monthlyPrice: number,
  speedMbps: number
): number {
  if (speedMbps === 0) return 0;
  return roundToTwoDecimals(monthlyPrice / speedMbps);
}

/**
 * Calculate total savings over contract term
 */
export function calculateTotalSavings(
  monthlySavings: number,
  contractTerm: ContractTerm
): number {
  return roundToTwoDecimals(monthlySavings * contractTerm);
}

/**
 * Compare two pricing breakdowns
 */
export function comparePricing(
  current: PricingBreakdown,
  previous: PricingBreakdown
): {
  monthly_diff: number;
  monthly_diff_percent: number;
  contract_diff: number;
  contract_diff_percent: number;
  is_cheaper: boolean;
} {
  const monthly_diff = current.total_monthly - previous.total_monthly;
  const monthly_diff_percent =
    previous.total_monthly === 0
      ? 0
      : (monthly_diff / previous.total_monthly) * 100;

  const contract_diff =
    current.total_contract_value - previous.total_contract_value;
  const contract_diff_percent =
    previous.total_contract_value === 0
      ? 0
      : (contract_diff / previous.total_contract_value) * 100;

  return {
    monthly_diff: roundToTwoDecimals(monthly_diff),
    monthly_diff_percent: roundToTwoDecimals(monthly_diff_percent),
    contract_diff: roundToTwoDecimals(contract_diff),
    contract_diff_percent: roundToTwoDecimals(contract_diff_percent),
    is_cheaper: current.total_contract_value < previous.total_contract_value
  };
}
