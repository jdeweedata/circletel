/**
 * Product Sync Service
 * Syncs product portfolio data (pricing, margins, wholesale costs) into
 * lead scoring weights dynamically. Keeps scoring constants in sync with
 * the latest product economics so lead scores reflect real margin data.
 *
 * @module lib/sales-engine/product-sync-service
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ProductWholesaleCost,
  ProductMarginSummary,
  DynamicScoringConfig,
  SalesEngineConfig,
} from './types';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// Customer type → recommended product mappings
const CUSTOMER_PRODUCT_MAP: Record<string, string> = {
  business: 'SkyFibre SMB',
  enterprise: 'ParkConnect DUNE',
  office_park: 'ParkConnect DUNE',
  clinic: 'ClinicConnect',
  healthcare: 'ClinicConnect',
  residential: 'SkyFibre Home',
  soho: 'WorkConnect SOHO',
};

// Customer type → recommended Arlan upsell deals by business_use_case
const ARLAN_UPSELL_MAP: Record<string, string[]> = {
  business: ['voice_comms', 'backup_connectivity', 'device_upgrade'],
  enterprise: ['voice_comms', 'fleet_management', 'data_connectivity'],
  office_park: ['voice_comms', 'backup_connectivity'],
  clinic: ['backup_connectivity', 'data_connectivity'],
  healthcare: ['backup_connectivity', 'data_connectivity'],
  soho: ['backup_connectivity', 'device_upgrade'],
  residential: ['device_upgrade'],
};

// =============================================================================
// Product Margins
// =============================================================================

/**
 * Fetch all product wholesale costs and compute margin summaries.
 * Returns each product's monthly contribution (retail_price - wholesale_mrc).
 */
export async function getProductMargins(): Promise<ServiceResult<ProductMarginSummary[]>> {
  try {
    const supabase = await createClient();

    const { data: products, error: queryError } = await supabase
      .from('product_wholesale_costs')
      .select('product_name, wholesale_provider, wholesale_mrc, retail_price, gross_margin_pct')
      .order('product_name', { ascending: true });

    if (queryError) {
      return { data: null, error: `Failed to fetch product costs: ${queryError.message}` };
    }

    if (!products || products.length === 0) {
      return { data: [], error: null };
    }

    const margins: ProductMarginSummary[] = products.map((p) => ({
      product_name: p.product_name,
      wholesale_provider: p.wholesale_provider,
      wholesale_mrc: p.wholesale_mrc,
      retail_price: p.retail_price,
      gross_margin_pct: p.gross_margin_pct,
      monthly_contribution: p.retail_price - p.wholesale_mrc,
    }));

    return { data: margins, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// =============================================================================
// Dynamic Scoring Config
// =============================================================================

/**
 * Build a DynamicScoringConfig from current product wholesale costs.
 * - estimated_mrr: product_name → retail_price
 * - product_fit_scores: product_name → score based on gross_margin_pct (40-95 scale)
 * - revenue_potential_scores: product_name → score based on retail_price (30-95 scale)
 * - recommended_products: customer_type → product_name
 */
export async function getProductScoringConfig(): Promise<ServiceResult<DynamicScoringConfig>> {
  try {
    const supabase = await createClient();

    const { data: products, error: queryError } = await supabase
      .from('product_wholesale_costs')
      .select('product_name, retail_price, gross_margin_pct')
      .order('product_name', { ascending: true });

    if (queryError) {
      return { data: null, error: `Failed to fetch product costs: ${queryError.message}` };
    }

    if (!products || products.length === 0) {
      return { data: null, error: 'No product wholesale costs found' };
    }

    // Build estimated_mrr map
    const estimated_mrr: Record<string, number> = {};
    for (const p of products) {
      estimated_mrr[p.product_name] = p.retail_price;
    }

    // Build product_fit_scores based on gross_margin_pct (higher margin = higher score)
    // Scale: 40-95, linear mapping from min to max margin
    const margins = products.map((p) => p.gross_margin_pct);
    const minMargin = Math.min(...margins);
    const maxMargin = Math.max(...margins);
    const marginRange = maxMargin - minMargin;

    const product_fit_scores: Record<string, number> = {};
    for (const p of products) {
      const normalized = marginRange > 0
        ? (p.gross_margin_pct - minMargin) / marginRange
        : 0.5;
      // Scale to 40-95
      product_fit_scores[p.product_name] = Math.round(40 + normalized * 55);
    }

    // Build revenue_potential_scores based on retail_price (higher price = higher potential)
    // Scale: 30-95, linear mapping from min to max price
    const prices = products.map((p) => p.retail_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    const revenue_potential_scores: Record<string, number> = {};
    for (const p of products) {
      const normalized = priceRange > 0
        ? (p.retail_price - minPrice) / priceRange
        : 0.5;
      // Scale to 30-95
      revenue_potential_scores[p.product_name] = Math.round(30 + normalized * 65);
    }

    // Build recommended_products from static mapping
    const recommended_products: Record<string, string> = { ...CUSTOMER_PRODUCT_MAP };

    const config: DynamicScoringConfig = {
      estimated_mrr,
      product_fit_scores,
      revenue_potential_scores,
      recommended_products,
    };

    return { data: config, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// =============================================================================
// Sync Scoring Constants
// =============================================================================

/**
 * Sync the latest product scoring config into the sales_engine_config table.
 * Upserts with config_key = 'scoring_constants' so lead scoring picks up
 * fresh product economics on the next scoring run.
 */
export async function syncScoringConstants(): Promise<ServiceResult<{ synced: boolean }>> {
  try {
    const configResult = await getProductScoringConfig();

    if (configResult.error || !configResult.data) {
      return { data: null, error: configResult.error ?? 'Failed to build scoring config' };
    }

    const supabase = await createClient();

    const { error: upsertError } = await supabase
      .from('sales_engine_config')
      .upsert(
        {
          config_key: 'scoring_constants',
          config_value: configResult.data as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
          updated_by: 'product-sync',
        },
        { onConflict: 'config_key' }
      );

    if (upsertError) {
      return { data: null, error: `Failed to upsert scoring constants: ${upsertError.message}` };
    }

    return { data: { synced: true }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// =============================================================================
// Product Availability by Zone
// =============================================================================

/**
 * Determine which products are available in a given zone based on its
 * coverage infrastructure (base stations for SkyFibre, DFA for BizFibreConnect).
 * WorkConnect SOHO and SmartBranch LTE Backup are always available.
 */
export async function getProductAvailabilityByZone(
  zoneId: string
): Promise<ServiceResult<string[]>> {
  try {
    const supabase = await createClient();

    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, coverage_confidence, base_station_count, dfa_connected_count')
      .eq('id', zoneId)
      .single();

    if (zoneError || !zone) {
      return { data: null, error: `Zone not found: ${zoneError?.message ?? 'no data'}` };
    }

    // Always-available products
    const available: string[] = ['WorkConnect SOHO', 'SmartBranch LTE Backup'];

    // SkyFibre products require base station presence
    if (zone.base_station_count > 0) {
      available.push('SkyFibre SMB');
      available.push('SkyFibre Home');
      available.push('ClinicConnect');
      available.push('ParkConnect DUNE');
    }

    // BizFibreConnect requires DFA fibre connectivity
    if (zone.dfa_connected_count > 0) {
      available.push('BizFibreConnect');
    }

    return { data: available, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// =============================================================================
// Read Dynamic Scoring Config (for lead-scoring-service.ts)
// =============================================================================

/**
 * Read the persisted DynamicScoringConfig from sales_engine_config.
 * Returns null if no config is found (caller should fall back to hardcoded defaults).
 * This is the primary entry point for lead-scoring-service.ts to pick up
 * product-driven scoring weights without coupling to wholesale cost queries.
 */
export async function getDynamicScoringConfig(): Promise<DynamicScoringConfig | null> {
  try {
    const supabase = await createClient();

    const { data: row, error: queryError } = await supabase
      .from('sales_engine_config')
      .select('config_value')
      .eq('config_key', 'scoring_constants')
      .single();

    if (queryError || !row) {
      return null;
    }

    const config = row.config_value as unknown as DynamicScoringConfig;

    // Validate the config has the expected shape
    if (
      !config ||
      typeof config.estimated_mrr !== 'object' ||
      typeof config.product_fit_scores !== 'object' ||
      typeof config.revenue_potential_scores !== 'object' ||
      typeof config.recommended_products !== 'object'
    ) {
      return null;
    }

    return config;
  } catch {
    return null;
  }
}

// =============================================================================
// Arlan Product Scoring
// =============================================================================

/**
 * Build Arlan-specific scoring data from curated MTN deals.
 * Arlan products are always nationally available (LTE/5G coverage),
 * so they can be recommended in every zone as upsell opportunities.
 */
export async function getArlanProductScoring(): Promise<ServiceResult<{
  arlan_estimated_mrr: Record<string, number>;
  arlan_upsell_by_customer_type: Record<string, string[]>;
  curated_deal_count: number;
}>> {
  try {
    const supabase = await createClient();

    const { data: deals, error: queryError } = await supabase
      .from('mtn_dealer_products')
      .select('business_use_case, selling_price_incl_vat, mtn_price_excl_vat, markup_value')
      .eq('status', 'active')
      .in('curation_status', ['recommended', 'featured']);

    if (queryError) {
      return { data: null, error: `Failed to fetch curated deals: ${queryError.message}` };
    }

    if (!deals || deals.length === 0) {
      return { data: { arlan_estimated_mrr: {}, arlan_upsell_by_customer_type: ARLAN_UPSELL_MAP, curated_deal_count: 0 }, error: null };
    }

    // Average selling price by use case
    const useCaseAgg: Record<string, { total: number; count: number }> = {};
    for (const d of deals) {
      const uc = d.business_use_case ?? 'data_connectivity';
      if (!useCaseAgg[uc]) useCaseAgg[uc] = { total: 0, count: 0 };
      useCaseAgg[uc].total += Number(d.selling_price_incl_vat) || 0;
      useCaseAgg[uc].count += 1;
    }

    const arlan_estimated_mrr: Record<string, number> = {};
    for (const [uc, agg] of Object.entries(useCaseAgg)) {
      arlan_estimated_mrr[`Arlan ${uc}`] = Math.round(agg.total / agg.count);
    }

    return {
      data: {
        arlan_estimated_mrr,
        arlan_upsell_by_customer_type: ARLAN_UPSELL_MAP,
        curated_deal_count: deals.length,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Extends getProductAvailabilityByZone by adding Arlan products.
 * Arlan MTN deals are always nationally available via LTE/5G,
 * so every zone gets Arlan upsell opportunities.
 */
export async function getProductAvailabilityWithArlan(
  zoneId: string
): Promise<ServiceResult<{ circletel_products: string[]; arlan_use_cases: string[] }>> {
  const circletelResult = await getProductAvailabilityByZone(zoneId);

  if (circletelResult.error || !circletelResult.data) {
    return { data: null, error: circletelResult.error };
  }

  // Arlan products are always available nationally
  const arlan_use_cases = [
    'voice_comms',
    'data_connectivity',
    'device_upgrade',
    'backup_connectivity',
    'fleet_management',
    'iot_m2m',
    'mobile_workforce',
    'venue_wifi',
  ];

  return {
    data: {
      circletel_products: circletelResult.data,
      arlan_use_cases,
    },
    error: null,
  };
}
