/**
 * Arlan MRR Tracker Service
 * Tracks Arlan MTN deal revenue as dual-stream MRR (commission + markup)
 * with MSC coverage tracking.
 *
 * Revenue streams:
 * 1. Commission: 30% of MTN's commission (4.75-13.75% by tier) — paid by Arlan
 * 2. Markup: CircleTel markup on MTN price — collected monthly from customer
 *
 * @module lib/sales-engine/arlan-mrr-tracker-service
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface ArlanMRRSnapshot {
  /** Commission + markup combined (average per deal × projected deals) */
  total_arlan_mrr: number;
  /** Monthly commission portion */
  commission_mrr: number;
  /** Monthly markup amount */
  markup_mrr: number;

  /** Recommended + featured deals */
  curated_deals_count: number;
  /** Breakdown by business_use_case */
  deals_by_use_case: Record<string, { count: number; avg_price: number; avg_markup: number }>;

  /** Current month's MSC commitment */
  msc_commitment: number;
  /** total_connectivity_mrr / msc_commitment */
  msc_coverage_ratio: number;

  /** Average commission earned monthly per deal */
  avg_monthly_commission_per_deal: number;
  /** Average markup earned monthly per deal */
  avg_monthly_markup_per_deal: number;
  /** Commission + markup per deal per month */
  avg_total_revenue_per_deal: number;

  /** Projected MRR if we sell 10 curated deals */
  projected_mrr_10_deals: number;
  /** Projected MRR if we sell 50 curated deals */
  projected_mrr_50_deals: number;
}

export interface ArlanRevenueProjection {
  deal_count: number;
  monthly_commission: number;
  monthly_markup: number;
  total_monthly_mrr: number;
  annual_commission: number;
  annual_markup: number;
  total_annual: number;
  /** Average total contract value per deal */
  avg_contract_value: number;
  /** Average CircleTel commission per contract */
  avg_circletel_commission_per_contract: number;
}

export interface ArlanUseCaseSummary {
  use_case: string;
  deal_count: number;
  avg_mtn_price: number;
  avg_selling_price: number;
  avg_markup_pct: number;
  avg_monthly_commission: number;
  avg_monthly_markup: number;
  avg_total_monthly_revenue: number;
  top_deals: Array<{
    deal_id: string;
    device_name: string | null;
    price_plan: string;
    selling_price: number;
  }>;
}

// =============================================================================
// Internal Types
// =============================================================================

interface CuratedDeal {
  deal_id: string;
  mtn_price_incl_vat: number;
  mtn_price_excl_vat: number;
  markup_type: string;
  markup_value: number;
  selling_price_incl_vat: number;
  selling_price_excl_vat: number;
  mtn_commission_rate: number;
  circletel_commission_share: number;
  commission_tier: string | null;
  business_use_case: string | null;
  contract_term: number;
  device_name?: string | null;
  price_plan?: string | null;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Compute monthly commission for a single deal.
 * Commission = mtn_price_incl_vat × (mtn_commission_rate / 100) × (circletel_commission_share / 100)
 * This represents the monthly equivalent — the commission is already expressed as a monthly rate.
 */
function computeMonthlyCommission(deal: CuratedDeal): number {
  return (
    deal.mtn_price_incl_vat *
    (deal.mtn_commission_rate / 100) *
    (deal.circletel_commission_share / 100)
  );
}

/**
 * Compute monthly markup for a single deal.
 * For percentage markup: mtn_price_excl_vat × (markup_value / 100)
 * For fixed markup: selling_price_excl_vat - mtn_price_excl_vat
 */
function computeMonthlyMarkup(deal: CuratedDeal): number {
  if (deal.markup_type === 'percentage') {
    return deal.mtn_price_excl_vat * (deal.markup_value / 100);
  }
  // Fixed or any other type: difference between selling and MTN price
  return deal.selling_price_excl_vat - deal.mtn_price_excl_vat;
}

/**
 * Return today's date as ISO string (YYYY-MM-DD) for period comparisons.
 */
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Compute a snapshot of Arlan revenue potential and MSC coverage.
 * Queries curated deals for revenue metrics and execution_milestones for MSC.
 */
export async function getArlanMRRSnapshot(): Promise<ServiceResult<ArlanMRRSnapshot>> {
  try {
    const supabase = await createClient();

    // 1. Fetch curated deals (recommended + featured, active)
    const { data: deals, error: dealsError } = await supabase
      .from('mtn_dealer_products')
      .select(
        'deal_id, mtn_price_incl_vat, mtn_price_excl_vat, markup_type, markup_value, ' +
        'selling_price_incl_vat, selling_price_excl_vat, mtn_commission_rate, ' +
        'circletel_commission_share, commission_tier, business_use_case, contract_term'
      )
      .in('curation_status', ['recommended', 'featured'])
      .eq('status', 'active');

    if (dealsError) {
      return { data: null, error: `Failed to fetch curated deals: ${dealsError.message}` };
    }

    if (!deals || deals.length === 0) {
      return {
        data: {
          total_arlan_mrr: 0,
          commission_mrr: 0,
          markup_mrr: 0,
          curated_deals_count: 0,
          deals_by_use_case: {},
          msc_commitment: 0,
          msc_coverage_ratio: 0,
          avg_monthly_commission_per_deal: 0,
          avg_monthly_markup_per_deal: 0,
          avg_total_revenue_per_deal: 0,
          projected_mrr_10_deals: 0,
          projected_mrr_50_deals: 0,
        },
        error: null,
      };
    }

    const rawDeals = deals as unknown as Record<string, unknown>[];
    const curatedDeals: CuratedDeal[] = rawDeals.map((d) => ({
      deal_id: String(d.deal_id ?? ''),
      mtn_price_incl_vat: Number(d.mtn_price_incl_vat) || 0,
      mtn_price_excl_vat: Number(d.mtn_price_excl_vat) || 0,
      markup_type: String(d.markup_type ?? 'percentage'),
      markup_value: Number(d.markup_value) || 0,
      selling_price_incl_vat: Number(d.selling_price_incl_vat) || 0,
      selling_price_excl_vat: Number(d.selling_price_excl_vat) || 0,
      mtn_commission_rate: Number(d.mtn_commission_rate) || 0,
      circletel_commission_share: Number(d.circletel_commission_share) || 30,
      commission_tier: d.commission_tier ? String(d.commission_tier) : null,
      business_use_case: d.business_use_case ? String(d.business_use_case) : null,
      contract_term: Number(d.contract_term) || 24,
    }));

    // 2. Compute per-deal revenue
    let totalCommission = 0;
    let totalMarkup = 0;
    const useCaseMap: Record<string, { count: number; total_price: number; total_markup: number }> = {};

    for (const deal of curatedDeals) {
      const commission = computeMonthlyCommission(deal);
      const markup = computeMonthlyMarkup(deal);
      totalCommission += commission;
      totalMarkup += markup;

      const useCase = deal.business_use_case ?? 'uncategorized';
      if (!useCaseMap[useCase]) {
        useCaseMap[useCase] = { count: 0, total_price: 0, total_markup: 0 };
      }
      useCaseMap[useCase].count += 1;
      useCaseMap[useCase].total_price += deal.selling_price_incl_vat;
      useCaseMap[useCase].total_markup += markup;
    }

    const dealCount = curatedDeals.length;
    const avgCommission = totalCommission / dealCount;
    const avgMarkup = totalMarkup / dealCount;
    const avgTotal = avgCommission + avgMarkup;

    // 3. Build deals_by_use_case
    const dealsByUseCase: Record<string, { count: number; avg_price: number; avg_markup: number }> = {};
    for (const [useCase, agg] of Object.entries(useCaseMap)) {
      dealsByUseCase[useCase] = {
        count: agg.count,
        avg_price: agg.total_price / agg.count,
        avg_markup: agg.total_markup / agg.count,
      };
    }

    // 4. Get current MSC from execution_milestones
    const today = todayISO();
    const { data: milestones, error: milestoneError } = await supabase
      .from('execution_milestones')
      .select('msc_commitment, period_start, period_end')
      .lte('period_start', today)
      .gte('period_end', today)
      .limit(1);

    let mscCommitment = 0;
    if (!milestoneError && milestones && milestones.length > 0) {
      mscCommitment = milestones[0].msc_commitment ?? 0;
    }

    // 5. Get total connectivity MRR from won pipeline deals
    const { data: wonDeals, error: wonError } = await supabase
      .from('sales_pipeline_stages')
      .select('quote_mrr')
      .eq('outcome', 'won');

    let totalConnectivityMRR = 0;
    if (!wonError && wonDeals) {
      totalConnectivityMRR = wonDeals.reduce(
        (sum, d) => sum + (d.quote_mrr ?? 0),
        0
      );
    }

    const mscCoverageRatio = mscCommitment > 0 ? totalConnectivityMRR / mscCommitment : 0;

    return {
      data: {
        total_arlan_mrr: avgTotal * dealCount,
        commission_mrr: totalCommission,
        markup_mrr: totalMarkup,
        curated_deals_count: dealCount,
        deals_by_use_case: dealsByUseCase,
        msc_commitment: mscCommitment,
        msc_coverage_ratio: mscCoverageRatio,
        avg_monthly_commission_per_deal: avgCommission,
        avg_monthly_markup_per_deal: avgMarkup,
        avg_total_revenue_per_deal: avgTotal,
        projected_mrr_10_deals: avgTotal * 10,
        projected_mrr_50_deals: avgTotal * 50,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Project revenue if CircleTel sells N Arlan deals.
 * Uses average revenue per curated deal to extrapolate.
 */
export async function getArlanRevenueProjection(
  dealCount: number
): Promise<ServiceResult<ArlanRevenueProjection>> {
  try {
    const supabase = await createClient();

    // Fetch curated deals for averages
    const { data: deals, error: dealsError } = await supabase
      .from('mtn_dealer_products')
      .select(
        'mtn_price_incl_vat, mtn_price_excl_vat, markup_type, markup_value, ' +
        'selling_price_incl_vat, selling_price_excl_vat, mtn_commission_rate, ' +
        'circletel_commission_share, contract_term'
      )
      .in('curation_status', ['recommended', 'featured'])
      .eq('status', 'active');

    if (dealsError) {
      return { data: null, error: `Failed to fetch curated deals: ${dealsError.message}` };
    }

    if (!deals || deals.length === 0) {
      return {
        data: {
          deal_count: dealCount,
          monthly_commission: 0,
          monthly_markup: 0,
          total_monthly_mrr: 0,
          annual_commission: 0,
          annual_markup: 0,
          total_annual: 0,
          avg_contract_value: 0,
          avg_circletel_commission_per_contract: 0,
        },
        error: null,
      };
    }

    const rawProjectionDeals = deals as unknown as Record<string, unknown>[];
    const curatedDeals: CuratedDeal[] = rawProjectionDeals.map((d) => ({
      deal_id: '',
      mtn_price_incl_vat: Number(d.mtn_price_incl_vat) || 0,
      mtn_price_excl_vat: Number(d.mtn_price_excl_vat) || 0,
      markup_type: String(d.markup_type ?? 'percentage'),
      markup_value: Number(d.markup_value) || 0,
      selling_price_incl_vat: Number(d.selling_price_incl_vat) || 0,
      selling_price_excl_vat: Number(d.selling_price_excl_vat) || 0,
      mtn_commission_rate: Number(d.mtn_commission_rate) || 0,
      circletel_commission_share: Number(d.circletel_commission_share) || 30,
      commission_tier: null,
      business_use_case: null,
      contract_term: Number(d.contract_term) || 24,
    }));

    // Compute averages across all curated deals
    let totalCommission = 0;
    let totalMarkup = 0;
    let totalContractValue = 0;
    let totalContractCommission = 0;

    for (const deal of curatedDeals) {
      const monthlyCommission = computeMonthlyCommission(deal);
      const monthlyMarkup = computeMonthlyMarkup(deal);
      totalCommission += monthlyCommission;
      totalMarkup += monthlyMarkup;
      totalContractValue += deal.selling_price_incl_vat * deal.contract_term;
      totalContractCommission += monthlyCommission * deal.contract_term;
    }

    const count = curatedDeals.length;
    const avgMonthlyCommission = totalCommission / count;
    const avgMonthlyMarkup = totalMarkup / count;
    const avgContractValue = totalContractValue / count;
    const avgContractCommission = totalContractCommission / count;

    const monthlyCommission = avgMonthlyCommission * dealCount;
    const monthlyMarkup = avgMonthlyMarkup * dealCount;
    const totalMonthlyMRR = monthlyCommission + monthlyMarkup;

    return {
      data: {
        deal_count: dealCount,
        monthly_commission: monthlyCommission,
        monthly_markup: monthlyMarkup,
        total_monthly_mrr: totalMonthlyMRR,
        annual_commission: monthlyCommission * 12,
        annual_markup: monthlyMarkup * 12,
        total_annual: totalMonthlyMRR * 12,
        avg_contract_value: avgContractValue,
        avg_circletel_commission_per_contract: avgContractCommission,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get a summary of Arlan deals grouped by business_use_case.
 * Includes per-use-case averages and top deals by selling price.
 */
export async function getArlanDealsByUseCase(): Promise<
  ServiceResult<Record<string, ArlanUseCaseSummary>>
> {
  try {
    const supabase = await createClient();

    const { data: deals, error: dealsError } = await supabase
      .from('mtn_dealer_products')
      .select(
        'deal_id, mtn_price_incl_vat, mtn_price_excl_vat, markup_type, markup_value, ' +
        'selling_price_incl_vat, selling_price_excl_vat, mtn_commission_rate, ' +
        'circletel_commission_share, commission_tier, business_use_case, contract_term, ' +
        'device_name, price_plan'
      )
      .in('curation_status', ['recommended', 'featured'])
      .eq('status', 'active');

    if (dealsError) {
      return { data: null, error: `Failed to fetch curated deals: ${dealsError.message}` };
    }

    if (!deals || deals.length === 0) {
      return { data: {}, error: null };
    }

    // Group by use case
    const groups: Record<string, CuratedDeal[]> = {};
    const rawDealData = deals as unknown as Record<string, unknown>[];
    for (const d of rawDealData) {
      const deal: CuratedDeal = {
        deal_id: String(d.deal_id ?? ''),
        mtn_price_incl_vat: Number(d.mtn_price_incl_vat) || 0,
        mtn_price_excl_vat: Number(d.mtn_price_excl_vat) || 0,
        markup_type: String(d.markup_type ?? 'percentage'),
        markup_value: Number(d.markup_value) || 0,
        selling_price_incl_vat: Number(d.selling_price_incl_vat) || 0,
        selling_price_excl_vat: Number(d.selling_price_excl_vat) || 0,
        mtn_commission_rate: Number(d.mtn_commission_rate) || 0,
        circletel_commission_share: Number(d.circletel_commission_share) || 30,
        commission_tier: d.commission_tier ? String(d.commission_tier) : null,
        business_use_case: d.business_use_case ? String(d.business_use_case) : null,
        contract_term: Number(d.contract_term) || 24,
        device_name: d.device_name ? String(d.device_name) : null,
        price_plan: d.price_plan ? String(d.price_plan) : '',
      };
      const useCase = deal.business_use_case ?? 'uncategorized';
      if (!groups[useCase]) {
        groups[useCase] = [];
      }
      groups[useCase].push(deal);
    }

    // Build summaries
    const result: Record<string, ArlanUseCaseSummary> = {};

    for (const [useCase, useCaseDeals] of Object.entries(groups)) {
      let totalMtnPrice = 0;
      let totalSellingPrice = 0;
      let totalMarkupPct = 0;
      let totalMonthlyCommission = 0;
      let totalMonthlyMarkup = 0;

      for (const deal of useCaseDeals) {
        totalMtnPrice += deal.mtn_price_incl_vat;
        totalSellingPrice += deal.selling_price_incl_vat;

        // Compute effective markup percentage
        const markupPct =
          deal.mtn_price_excl_vat > 0
            ? ((deal.selling_price_excl_vat - deal.mtn_price_excl_vat) / deal.mtn_price_excl_vat) * 100
            : 0;
        totalMarkupPct += markupPct;

        totalMonthlyCommission += computeMonthlyCommission(deal);
        totalMonthlyMarkup += computeMonthlyMarkup(deal);
      }

      const count = useCaseDeals.length;
      const avgMonthlyCommission = totalMonthlyCommission / count;
      const avgMonthlyMarkup = totalMonthlyMarkup / count;

      // Top deals by selling price (descending), max 5
      const topDeals = [...useCaseDeals]
        .sort((a, b) => b.selling_price_incl_vat - a.selling_price_incl_vat)
        .slice(0, 5)
        .map((d) => ({
          deal_id: d.deal_id,
          device_name: d.device_name ?? null,
          price_plan: d.price_plan ?? '',
          selling_price: d.selling_price_incl_vat,
        }));

      result[useCase] = {
        use_case: useCase,
        deal_count: count,
        avg_mtn_price: totalMtnPrice / count,
        avg_selling_price: totalSellingPrice / count,
        avg_markup_pct: totalMarkupPct / count,
        avg_monthly_commission: avgMonthlyCommission,
        avg_monthly_markup: avgMonthlyMarkup,
        avg_total_monthly_revenue: avgMonthlyCommission + avgMonthlyMarkup,
        top_deals: topDeals,
      };
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}
