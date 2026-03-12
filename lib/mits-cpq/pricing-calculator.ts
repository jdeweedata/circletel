/**
 * MITS CPQ Pricing Calculator
 *
 * All pricing logic for the Managed IT Services CPQ wizard.
 * Computes MRC, NRC, discounts, margins, and tier recommendations.
 */

import type {
  MITSTier,
  MITSPricingInput,
  MITSPricingResult,
} from './types';
import { TIER_ORDER } from './types';

// ============================================================================
// CONTRACT DISCOUNT TABLE
// ============================================================================

/**
 * Returns the automatic discount percentage earned for a given contract term.
 *
 * | Term     | Discount |
 * |----------|----------|
 * | 36 months | 15%     |
 * | 24 months | 10%     |
 * | 12 months |  5%     |
 * | < 12 months | 0%   |
 */
export function getContractDiscounts(termMonths: number): number {
  if (termMonths >= 36) return 15;
  if (termMonths >= 24) return 10;
  if (termMonths >= 12) return 5;
  return 0;
}

// ============================================================================
// TIER RECOMMENDATION
// ============================================================================

/**
 * Returns the best-fit tier for the given user count.
 * Prefers the lowest tier that accommodates all users.
 * Returns null if no active tier covers the count.
 */
export function recommendTier(
  userCount: number,
  tiers: MITSTier[]
): MITSTier | null {
  // Sort by target_users_min ascending so we pick the smallest fitting tier first
  const sorted = [...tiers]
    .filter((t) => t.is_active)
    .sort((a, b) => a.target_users_min - b.target_users_min);

  for (const tier of sorted) {
    if (userCount >= tier.target_users_min && userCount <= tier.target_users_max) {
      return tier;
    }
  }

  // If user count exceeds all ranges, return the largest tier (Enterprise)
  if (sorted.length > 0 && userCount > sorted[sorted.length - 1].target_users_max) {
    return sorted[sorted.length - 1];
  }

  return null;
}

// ============================================================================
// MAIN PRICING CALCULATOR
// ============================================================================

/**
 * Computes the full MITS pricing breakdown for a given configuration.
 *
 * Calculation order:
 * 1. Base tier retail price
 * 2. Additional M365 licences (beyond what's included in the tier)
 * 3. Add-on MRC (monthly modules) and NRC (once-off modules)
 *    - per_user billing is multiplied by the tier's included + additional licence count
 * 4. Subtotal MRC = (1) + (2) + (3 MRC)
 * 5. Combined discount % = contract discount + manual discount (capped at 100%)
 * 6. Discount amount = subtotal_mrc * combined_discount / 100
 * 7. Total MRC = subtotal_mrc - discount_amount
 * 8. Direct cost = tier direct cost + (additional M365 licences * csp_cost) + module direct costs
 * 9. Gross margin % = (total_mrc - direct_cost) / total_mrc * 100
 *
 * NRC is not discounted (once-off charges billed at full retail).
 */
export function calculateMITSPricing(input: MITSPricingInput): MITSPricingResult {
  const {
    tier,
    additional_licences,
    selected_modules,
    contract_term_months,
    manual_discount_percent,
  } = input;

  // --- 1. Base tier price ---
  const base_tier_price = tier.retail_price;

  // --- 2. Additional M365 licences ---
  const additional_m365_price =
    Math.max(0, additional_licences) * tier.m365_additional_rate;

  // --- 3. Add-ons ---
  // Total user count for per_user billing = included licences + additional
  const total_licence_count =
    tier.m365_included_licences + Math.max(0, additional_licences);

  let add_ons_mrc = 0;
  let add_ons_nrc = 0;
  let add_ons_direct_cost = 0;

  for (const mod of selected_modules) {
    const qty = Math.max(1, mod.quantity);

    if (mod.billing_type === 'once_off') {
      add_ons_nrc += mod.unit_price * qty;
      add_ons_direct_cost += (mod.unit_price * qty) * 0.5; // approximation if direct_cost unavailable
    } else if (mod.billing_type === 'per_user') {
      const perUserMRC = mod.unit_price * total_licence_count;
      add_ons_mrc += perUserMRC;
      add_ons_direct_cost += perUserMRC * 0.5;
    } else {
      // monthly
      add_ons_mrc += mod.unit_price * qty;
      add_ons_direct_cost += (mod.unit_price * qty) * 0.5;
    }
  }

  // --- 4. Subtotal MRC ---
  const subtotal_mrc = base_tier_price + additional_m365_price + add_ons_mrc;

  // --- 5. Combined discount ---
  const contract_discount_percent = getContractDiscounts(contract_term_months);
  const combined_discount_percent = Math.min(
    100,
    contract_discount_percent + Math.max(0, manual_discount_percent)
  );

  // --- 6. Discount amount ---
  const discount_amount = subtotal_mrc * (combined_discount_percent / 100);

  // --- 7. Total MRC ---
  const total_mrc = subtotal_mrc - discount_amount;

  // --- 8. Direct cost ---
  // Tier direct cost is monthly; additional M365 uses CSP cost (not available in MITSTier,
  // so we use the m365_additional_rate as a proxy for direct cost — actual CSP cost is in
  // mits_m365_pricing; caller should pass that if available, but we approximate here).
  const m365_additional_direct = Math.max(0, additional_licences) * (tier.m365_additional_rate * 0.83);
  const total_direct_cost =
    tier.estimated_direct_cost + m365_additional_direct + add_ons_direct_cost;

  // --- 9. Gross margin ---
  const gross_margin_percent =
    total_mrc > 0 ? ((total_mrc - total_direct_cost) / total_mrc) * 100 : 0;

  return {
    base_tier_price,
    additional_m365_price,
    add_ons_mrc,
    add_ons_nrc,
    contract_discount_percent,
    subtotal_mrc,
    discount_amount,
    total_mrc,
    gross_margin_percent: Math.round(gross_margin_percent * 100) / 100,
    total_direct_cost,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Returns the tier index in TIER_ORDER (lower = lower tier).
 * Returns -1 if the tier_code is not in the known order.
 */
export function getTierIndex(tierCode: string): number {
  return TIER_ORDER.indexOf(tierCode);
}

/**
 * Returns true if a module's available_from_tier is at or below the given tier.
 * Used to filter which modules are visible for a selected tier.
 */
export function isModuleAvailableForTier(
  moduleTierCode: string,
  selectedTierCode: string
): boolean {
  const moduleIdx = getTierIndex(moduleTierCode);
  const selectedIdx = getTierIndex(selectedTierCode);

  // If either code is unknown, be permissive and show the module
  if (moduleIdx === -1 || selectedIdx === -1) return true;

  return moduleIdx <= selectedIdx;
}

/**
 * Formats a number as ZAR currency string.
 * e.g. 12999 → "R 12,999.00"
 */
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}
