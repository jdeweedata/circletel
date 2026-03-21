/**
 * Competitor Intelligence Service
 * Processes competitor scrape results into the sales engine's competitive
 * vulnerability scoring and briefing.
 *
 * @module lib/sales-engine/competitor-intelligence-service
 */

import { createClient } from '@/lib/supabase/server';
import type {
  CompetitorPriceChange,
  CompetitivePosition,
  CompetitorIntelligenceSummary,
} from './types';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Product matching config: maps CircleTel products to competitor filter criteria */
const PRODUCT_MATCH_CRITERIA: Record<
  string,
  { technologies: string[]; speed_min: number; speed_max: number }
> = {
  'SkyFibre SMB': { technologies: ['fibre', 'lte'], speed_min: 50, speed_max: 200 },
  'ParkConnect DUNE': { technologies: ['fibre'], speed_min: 100, speed_max: 10000 },
  'ClinicConnect': { technologies: ['fibre', 'lte'], speed_min: 50, speed_max: 100 },
  'WorkConnect SOHO': { technologies: ['fibre', 'lte'], speed_min: 25, speed_max: 100 },
};

// =============================================================================
// processCompetitorPriceChanges
// =============================================================================

/**
 * Process recent competitor price changes and update zone vulnerability scores.
 * - Price increases by competitors → increase our competitor_weakness_score (good for us)
 * - Price decreases by competitors → decrease our competitor_weakness_score (threat)
 */
export async function processCompetitorPriceChanges(): Promise<
  ServiceResult<{ changes_processed: number; zones_updated: number }>
> {
  try {
    const supabase = await createClient();

    // Get price changes from the last 7 days with product + provider info
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: priceChanges, error: priceError } = await supabase
      .from('competitor_price_history')
      .select(`
        id,
        old_price,
        new_price,
        change_percent,
        detected_at,
        competitor_products!inner (
          id,
          product_name,
          product_type,
          technology,
          competitor_providers!inner (
            id,
            name,
            slug
          )
        )
      `)
      .gte('detected_at', sevenDaysAgo.toISOString());

    if (priceError) {
      return { data: null, error: priceError.message };
    }

    const changes = priceChanges ?? [];
    if (changes.length === 0) {
      return { data: { changes_processed: 0, zones_updated: 0 }, error: null };
    }

    // Build a map of provider slug → net adjustment
    // +5 for each price increase (competitor weakness), -5 for each decrease (threat)
    const providerAdjustments: Record<string, number> = {};
    for (const change of changes) {
      const product = change.competitor_products as unknown as {
        id: string;
        product_name: string;
        product_type: string;
        technology: string;
        competitor_providers: { id: string; name: string; slug: string };
      };
      const slug = product.competitor_providers.slug;
      const adjustment = change.new_price > change.old_price ? 5 : -5;

      providerAdjustments[slug] = (providerAdjustments[slug] ?? 0) + adjustment;
    }

    // Get all active zones
    const { data: zones, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, province, competitor_weakness_score')
      .eq('status', 'active');

    if (zoneError) {
      return { data: null, error: zoneError.message };
    }

    const activeZones = zones ?? [];
    if (activeZones.length === 0) {
      return { data: { changes_processed: changes.length, zones_updated: 0 }, error: null };
    }

    // Get all active competitor providers with their provinces via products
    // A competitor "operates in" a province if they have active products
    const { data: competitorProducts, error: cpError } = await supabase
      .from('competitor_products')
      .select(`
        id,
        competitor_providers!inner (
          slug
        )
      `)
      .eq('is_active', true);

    if (cpError) {
      return { data: null, error: cpError.message };
    }

    // All competitors with price changes operate nationally (SA ISPs are national)
    // So apply adjustments to all zones
    const providerSlugsWithChanges = Object.keys(providerAdjustments);

    let zonesUpdated = 0;
    for (const zone of activeZones) {
      // Sum adjustments from all providers that had changes
      let totalAdjustment = 0;
      for (const slug of providerSlugsWithChanges) {
        totalAdjustment += providerAdjustments[slug];
      }

      if (totalAdjustment === 0) continue;

      const currentScore = zone.competitor_weakness_score ?? 50;
      const newScore = Math.max(0, Math.min(100, currentScore + totalAdjustment));

      const { error: updateError } = await supabase
        .from('sales_zones')
        .update({ competitor_weakness_score: newScore })
        .eq('id', zone.id);

      if (!updateError) {
        zonesUpdated++;
      }
    }

    return {
      data: { changes_processed: changes.length, zones_updated: zonesUpdated },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to process competitor price changes: ${message}` };
  }
}

// =============================================================================
// getCompetitivePositionByProduct
// =============================================================================

/**
 * Compare CircleTel product pricing against competitor products.
 * Groups competitors by technology and speed range to find relevant matches.
 */
export async function getCompetitivePositionByProduct(): Promise<
  ServiceResult<CompetitivePosition[]>
> {
  try {
    const supabase = await createClient();

    // Get CircleTel retail prices
    const { data: wholesaleCosts, error: wcError } = await supabase
      .from('product_wholesale_costs')
      .select('product_name, retail_price');

    if (wcError) {
      return { data: null, error: wcError.message };
    }

    const circletelProducts = wholesaleCosts ?? [];
    if (circletelProducts.length === 0) {
      return { data: [], error: null };
    }

    // Get all active competitor products
    const { data: competitorProducts, error: cpError } = await supabase
      .from('competitor_products')
      .select(`
        id,
        product_name,
        monthly_price,
        product_type,
        technology,
        download_speed,
        upload_speed,
        competitor_providers!inner (
          name
        )
      `)
      .eq('is_active', true);

    if (cpError) {
      return { data: null, error: cpError.message };
    }

    const competitors = (competitorProducts ?? []) as unknown as Array<{
      id: string;
      product_name: string;
      monthly_price: number;
      product_type: string;
      technology: string;
      download_speed: number;
      upload_speed: number;
      competitor_providers: { name: string };
    }>;

    const positions: CompetitivePosition[] = [];

    for (const ctProduct of circletelProducts) {
      const criteria = PRODUCT_MATCH_CRITERIA[ctProduct.product_name];
      if (!criteria) continue;

      // Find matching competitor products by technology and speed range
      const matchingCompetitors = competitors.filter((cp) => {
        const techMatch = criteria.technologies.some(
          (t) =>
            (cp.technology ?? '').toLowerCase().includes(t) ||
            (cp.product_type ?? '').toLowerCase().includes(t)
        );
        const speedMatch =
          cp.download_speed >= criteria.speed_min &&
          cp.download_speed <= criteria.speed_max;
        return techMatch && speedMatch;
      });

      if (matchingCompetitors.length === 0) continue;

      const competitorPrices = matchingCompetitors.map((cp) => cp.monthly_price);
      const avgCompetitorPrice =
        competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;

      const circletelPrice = ctProduct.retail_price;
      const gapPct =
        avgCompetitorPrice > 0
          ? ((circletelPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100
          : 0;

      let position: 'below' | 'competitive' | 'above';
      if (circletelPrice < avgCompetitorPrice) {
        position = 'below';
      } else if (circletelPrice > avgCompetitorPrice * 1.1) {
        position = 'above';
      } else {
        position = 'competitive';
      }

      positions.push({
        product_name: ctProduct.product_name,
        circletel_price: circletelPrice,
        avg_competitor_price: Math.round(avgCompetitorPrice * 100) / 100,
        position,
        gap_pct: Math.round(gapPct * 100) / 100,
        competitors: matchingCompetitors.map((cp) => ({
          name: `${cp.competitor_providers.name} - ${cp.product_name}`,
          price: cp.monthly_price,
        })),
      });
    }

    return { data: positions, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to get competitive positions: ${message}` };
  }
}

// =============================================================================
// getCompetitorAlertsSummary
// =============================================================================

/**
 * Build a full competitor intelligence summary for the sales briefing.
 * Combines recent price changes, affected zones, and competitive positioning.
 */
export async function getCompetitorAlertsSummary(): Promise<
  ServiceResult<CompetitorIntelligenceSummary>
> {
  try {
    const supabase = await createClient();

    // Get price changes from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: priceChanges, error: priceError } = await supabase
      .from('competitor_price_history')
      .select(`
        id,
        old_price,
        new_price,
        change_percent,
        detected_at,
        competitor_products!inner (
          id,
          product_name,
          product_type,
          technology,
          competitor_providers!inner (
            id,
            name,
            slug
          )
        )
      `)
      .gte('detected_at', sevenDaysAgo.toISOString())
      .order('detected_at', { ascending: false });

    if (priceError) {
      return { data: null, error: priceError.message };
    }

    const rawChanges = priceChanges ?? [];

    // Map to CompetitorPriceChange objects
    const priceChangesMapped: CompetitorPriceChange[] = rawChanges.map((change) => {
      const product = change.competitor_products as unknown as {
        id: string;
        product_name: string;
        product_type: string;
        technology: string;
        competitor_providers: { id: string; name: string; slug: string };
      };
      return {
        provider_name: product.competitor_providers.name,
        product_name: product.product_name,
        old_price: change.old_price,
        new_price: change.new_price,
        change_pct: change.change_percent,
        direction: change.new_price > change.old_price ? 'increase' as const : 'decrease' as const,
        detected_at: change.detected_at,
      };
    });

    // Get affected zones — all active zones are potentially affected
    // since SA ISPs operate nationally
    const affectedProviders = [
      ...new Set(priceChangesMapped.map((c) => c.provider_name)),
    ];

    const { data: zones, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, name, province')
      .eq('status', 'active');

    if (zoneError) {
      return { data: null, error: zoneError.message };
    }

    const activeZones = zones ?? [];
    const zonesAffected: CompetitorIntelligenceSummary['zones_affected'] = [];

    for (const zone of activeZones) {
      for (const provider of affectedProviders) {
        const providerChanges = priceChangesMapped.filter(
          (c) => c.provider_name === provider
        );
        if (providerChanges.length === 0) continue;

        const increases = providerChanges.filter((c) => c.direction === 'increase').length;
        const decreases = providerChanges.filter((c) => c.direction === 'decrease').length;

        let changeDescription: string;
        if (increases > 0 && decreases > 0) {
          changeDescription = `${increases} price increase(s), ${decreases} decrease(s)`;
        } else if (increases > 0) {
          changeDescription = `${increases} price increase(s) — opportunity`;
        } else {
          changeDescription = `${decreases} price decrease(s) — threat`;
        }

        zonesAffected.push({
          zone_id: zone.id,
          zone_name: zone.name,
          competitor: provider,
          change: changeDescription,
        });
      }
    }

    // Get competitive positions
    const positionsResult = await getCompetitivePositionByProduct();
    const competitivePositions = positionsResult.data ?? [];

    return {
      data: {
        price_changes_7d: priceChangesMapped,
        zones_affected: zonesAffected,
        competitive_positions: competitivePositions,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to get competitor alerts summary: ${message}` };
  }
}

// =============================================================================
// updateZoneCompetitiveScores
// =============================================================================

/**
 * Recalculate all zone competitor_weakness_scores based on current pricing data.
 * Score = 100 - (count_of_cheaper_competitors * 10), clamped to 0–100.
 */
export async function updateZoneCompetitiveScores(): Promise<
  ServiceResult<{ updated: number }>
> {
  try {
    const supabase = await createClient();

    // Get CircleTel retail prices
    const { data: wholesaleCosts, error: wcError } = await supabase
      .from('product_wholesale_costs')
      .select('product_name, retail_price');

    if (wcError) {
      return { data: null, error: wcError.message };
    }

    const circletelProducts = wholesaleCosts ?? [];
    if (circletelProducts.length === 0) {
      return { data: { updated: 0 }, error: null };
    }

    // Get all active competitor products with prices
    const { data: competitorProducts, error: cpError } = await supabase
      .from('competitor_products')
      .select(`
        id,
        product_name,
        monthly_price,
        product_type,
        technology,
        download_speed
      `)
      .eq('is_active', true);

    if (cpError) {
      return { data: null, error: cpError.message };
    }

    const competitors = (competitorProducts ?? []) as unknown as Array<{
      id: string;
      product_name: string;
      monthly_price: number;
      product_type: string;
      technology: string;
      download_speed: number;
    }>;

    // Count how many competitor products are cheaper than CircleTel equivalents
    let cheaperCount = 0;
    for (const ctProduct of circletelProducts) {
      const criteria = PRODUCT_MATCH_CRITERIA[ctProduct.product_name];
      if (!criteria) continue;

      const matchingCompetitors = competitors.filter((cp) => {
        const techMatch = criteria.technologies.some(
          (t) =>
            (cp.technology ?? '').toLowerCase().includes(t) ||
            (cp.product_type ?? '').toLowerCase().includes(t)
        );
        const speedMatch =
          cp.download_speed >= criteria.speed_min &&
          cp.download_speed <= criteria.speed_max;
        return techMatch && speedMatch;
      });

      for (const cp of matchingCompetitors) {
        if (cp.monthly_price < ctProduct.retail_price) {
          cheaperCount++;
        }
      }
    }

    const score = Math.max(0, Math.min(100, 100 - cheaperCount * 10));

    // Get all active zones
    const { data: zones, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id')
      .eq('status', 'active');

    if (zoneError) {
      return { data: null, error: zoneError.message };
    }

    const activeZones = zones ?? [];
    if (activeZones.length === 0) {
      return { data: { updated: 0 }, error: null };
    }

    // Batch update all zones with the same score
    const zoneIds = activeZones.map((z) => z.id);
    const { error: updateError } = await supabase
      .from('sales_zones')
      .update({ competitor_weakness_score: score })
      .in('id', zoneIds);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: { updated: activeZones.length }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to update zone competitive scores: ${message}` };
  }
}
