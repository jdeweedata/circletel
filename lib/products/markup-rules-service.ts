// Markup Rules Service for MTN Dealer Products (Arlan Communications deals)
// Applies category-based markups and enforces the 25% minimum margin rule.

import type {
  MTNDealerBusinessUseCase,
  MarkupApplicationResult,
} from '@/lib/types/mtn-dealer-products';
import { MARKUP_RULES } from '@/lib/types/mtn-dealer-products';
import { createClient } from '@/lib/supabase/server';

/**
 * Calculate gross margin percentage from a percentage markup.
 *
 * selling_price = mtn_price_excl_vat * (1 + markup_pct / 100)
 * margin = (selling_price - mtn_price_excl_vat) / selling_price * 100
 *
 * Simplifies to: markup_pct / (100 + markup_pct) * 100
 */
export function calculateMarginPct(
  mtnPriceExclVat: number,
  markupPct: number
): number {
  if (mtnPriceExclVat <= 0 || markupPct <= 0) {
    return 0;
  }
  return (markupPct / (100 + markupPct)) * 100;
}

/**
 * Get the effective markup for a business use case, enforcing the 25% minimum margin rule.
 *
 * 1. Starts with the base markup from MARKUP_RULES for the use case.
 * 2. Calculates the resulting margin.
 * 3. If margin < 25%, bumps markup to 34% (which yields ~25.37% margin).
 *    - Exact 25% margin requires markup_pct = (25/75)*100 = 33.33...%
 *    - We use 34% as the floor to guarantee >= 25%.
 * 4. Returns the effective markup and resulting margin.
 *
 * Note: Commission income from Arlan supplements total revenue but is not
 * included in this margin calculation. The margin here reflects markup-only
 * margin on the selling price. Violations are flagged for review — commission
 * may bring total margin above 25% even when markup-only margin is below.
 */
export function getEffectiveMarkup(
  useCase: MTNDealerBusinessUseCase,
  mtnPriceExclVat: number
): { markup_pct: number; margin_pct: number } {
  const rule = MARKUP_RULES[useCase];
  if (!rule) {
    return { markup_pct: 0, margin_pct: 0 };
  }

  const baseMarkup = rule.markup_pct;
  const baseMargin = calculateMarginPct(mtnPriceExclVat, baseMarkup);

  if (baseMargin >= 25) {
    return {
      markup_pct: baseMarkup,
      margin_pct: Math.round(baseMargin * 100) / 100,
    };
  }

  // Base markup gives < 25% margin — override to 34% floor
  // 34% markup => 34 / 134 * 100 = 25.37% margin
  const overrideMarkup = 34;
  const overrideMargin = calculateMarginPct(mtnPriceExclVat, overrideMarkup);

  return {
    markup_pct: overrideMarkup,
    margin_pct: Math.round(overrideMargin * 100) / 100,
  };
}

/**
 * Apply markup rules to MTN dealer products based on their business use case.
 *
 * - Queries active products with a business_use_case assigned.
 * - Calculates the appropriate markup per use case via MARKUP_RULES.
 * - Flags products where markup-only margin falls below 25%.
 * - When dry_run is false, batch-updates markup_type and markup_value in groups of 100.
 */
export async function applyMarkupRules(options?: {
  use_case_filter?: MTNDealerBusinessUseCase;
  dry_run?: boolean;
}): Promise<MarkupApplicationResult> {
  const supabase = await createClient();
  const useCaseFilter = options?.use_case_filter;
  const dryRun = options?.dry_run ?? true;

  // Build query for active products with a business use case
  let query = supabase
    .from('mtn_dealer_products')
    .select('id, business_use_case, mtn_price_excl_vat, markup_type, markup_value')
    .eq('status', 'active')
    .not('business_use_case', 'is', null);

  if (useCaseFilter) {
    query = query.eq('business_use_case', useCaseFilter);
  }

  const { data: products, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch MTN dealer products: ${error.message}`);
  }

  if (!products || products.length === 0) {
    return { total_updated: 0, by_use_case: {}, margin_violations: 0 };
  }

  const byUseCase: Record<string, { count: number; markupSum: number }> = {};
  let marginViolations = 0;
  const updates: Array<{ id: string; markup_type: string; markup_value: number }> = [];

  for (const product of products) {
    const useCase = product.business_use_case as MTNDealerBusinessUseCase;
    const mtnPrice = product.mtn_price_excl_vat as number;

    const { markup_pct, margin_pct } = getEffectiveMarkup(useCase, mtnPrice);

    // Track margin violations (markup-only margin < 25%)
    const baseRule = MARKUP_RULES[useCase];
    const baseMargin = calculateMarginPct(mtnPrice, baseRule.markup_pct);
    if (baseMargin < 25) {
      marginViolations++;
    }

    // Accumulate per-use-case stats
    if (!byUseCase[useCase]) {
      byUseCase[useCase] = { count: 0, markupSum: 0 };
    }
    byUseCase[useCase].count++;
    byUseCase[useCase].markupSum += markup_pct;

    updates.push({
      id: product.id,
      markup_type: 'percentage',
      markup_value: markup_pct,
    });
  }

  // Batch update in groups of 100 when not a dry run
  if (!dryRun && updates.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      // Supabase doesn't support bulk upsert by arbitrary IDs in a single call,
      // so we update each record individually within the batch.
      const updatePromises = batch.map((update) =>
        supabase
          .from('mtn_dealer_products')
          .update({
            markup_type: update.markup_type,
            markup_value: update.markup_value,
          })
          .eq('id', update.id)
      );

      const results = await Promise.allSettled(updatePromises);

      for (const result of results) {
        if (result.status === 'rejected') {
          throw new Error(`Failed to update product markup: ${result.reason}`);
        }
        if (result.status === 'fulfilled' && result.value.error) {
          throw new Error(
            `Failed to update product markup: ${result.value.error.message}`
          );
        }
      }
    }
  }

  // Build final by_use_case summary
  const byUseCaseSummary: Record<
    string,
    { count: number; avg_markup_pct: number }
  > = {};
  for (const [useCase, stats] of Object.entries(byUseCase)) {
    byUseCaseSummary[useCase] = {
      count: stats.count,
      avg_markup_pct:
        Math.round((stats.markupSum / stats.count) * 100) / 100,
    };
  }

  return {
    total_updated: dryRun ? 0 : updates.length,
    by_use_case: byUseCaseSummary,
    margin_violations: marginViolations,
  };
}

/**
 * Get a summary of current markup state across all MTN dealer products.
 * Used by the admin dashboard to show markup distribution and margin health.
 */
export async function getMarkupSummary(): Promise<{
  by_use_case: Record<
    string,
    { count: number; avg_markup: number; avg_margin: number }
  >;
  total: number;
  with_markup: number;
  violations: number;
}> {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('mtn_dealer_products')
    .select(
      'business_use_case, markup_type, markup_value, mtn_price_excl_vat, status'
    )
    .eq('status', 'active');

  if (error) {
    throw new Error(
      `Failed to fetch MTN dealer products for markup summary: ${error.message}`
    );
  }

  if (!products || products.length === 0) {
    return { by_use_case: {}, total: 0, with_markup: 0, violations: 0 };
  }

  const byUseCase: Record<
    string,
    { count: number; markupSum: number; marginSum: number }
  > = {};
  let withMarkup = 0;
  let violations = 0;

  for (const product of products) {
    const markupValue = product.markup_value ?? 0;
    const mtnPrice = product.mtn_price_excl_vat ?? 0;
    const useCase = product.business_use_case as string | null;

    if (markupValue > 0) {
      withMarkup++;
    }

    // Calculate margin from current markup
    const margin = calculateMarginPct(mtnPrice, markupValue);
    if (markupValue > 0 && margin < 25) {
      violations++;
    }

    if (useCase) {
      if (!byUseCase[useCase]) {
        byUseCase[useCase] = { count: 0, markupSum: 0, marginSum: 0 };
      }
      byUseCase[useCase].count++;
      byUseCase[useCase].markupSum += markupValue;
      byUseCase[useCase].marginSum += margin;
    }
  }

  const byUseCaseSummary: Record<
    string,
    { count: number; avg_markup: number; avg_margin: number }
  > = {};
  for (const [useCase, stats] of Object.entries(byUseCase)) {
    byUseCaseSummary[useCase] = {
      count: stats.count,
      avg_markup: Math.round((stats.markupSum / stats.count) * 100) / 100,
      avg_margin: Math.round((stats.marginSum / stats.count) * 100) / 100,
    };
  }

  return {
    by_use_case: byUseCaseSummary,
    total: products.length,
    with_markup: withMarkup,
    violations,
  };
}
