/**
 * Lead Scoring Service
 * Scores coverage leads based on product fit, revenue potential, competitive vulnerability,
 * and conversion speed. Powers Layer 2 of the Sales Engine.
 *
 * @module lib/sales-engine/lead-scoring-service
 */

import { createClient } from '@/lib/supabase/server';
import type { LeadScore, ScoreLeadInput, OutreachTrack, DynamicScoringConfig } from './types';
import { enrichLeadCoverage, getAutoProductRecommendation } from './coverage-enrichment-service';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface TopLeadsOptions {
  zone_id?: string;
  track?: OutreachTrack;
  min_score?: number;
  limit?: number;
  offset?: number;
}

export interface LeadStats {
  total_scored: number;
  avg_score: number;
  count_by_track: Record<string, number>;
}

// =============================================================================
// Scoring Constants
// =============================================================================

/** Product fit scores by customer_type / zone type */
const PRODUCT_FIT_SCORES: Record<string, number> = {
  office_park: 85,
  business: 85,
  commercial: 70,
  clinic: 75,
  healthcare: 75,
  residential: 50,
  soho: 40,
};

/** Revenue potential scores by customer_type */
const REVENUE_POTENTIAL_SCORES: Record<string, number> = {
  business: 80,
  enterprise: 90,
  office_park: 90,
  clinic: 70,
  healthcare: 70,
  residential: 40,
  soho: 30,
};

/** Competitive vulnerability scores by competitor keyword */
const COMPETITIVE_VULN_SCORES: Record<string, number> = {
  telkom: 80,
  adsl: 80,
  cellular: 70,
  vodacom: 70,
  vumatel: 20,
  fibre: 20,
};

/** Conversion speed by customer_type */
const CONVERSION_SPEED_SCORES: Record<string, number> = {
  business: 80,
  residential: 70,
  enterprise: 50,
  office_park: 50,
  clinic: 70,
  healthcare: 70,
  soho: 75,
  commercial: 65,
};

/** Recommended product by customer_type */
const RECOMMENDED_PRODUCTS: Record<string, string> = {
  business: 'SkyFibre SMB',
  enterprise: 'ParkConnect DUNE',
  office_park: 'ParkConnect DUNE',
  clinic: 'ClinicConnect',
  healthcare: 'ClinicConnect',
  residential: 'SkyFibre Home',
  soho: 'WorkConnect SOHO',
};

/** Recommended outreach track by customer_type */
const RECOMMENDED_TRACKS: Record<string, OutreachTrack> = {
  office_park: 'office_park',
  enterprise: 'office_park',
  business: 'sme_strip',
  commercial: 'sme_strip',
  clinic: 'clinic',
  healthcare: 'clinic',
  residential: 'residential',
  soho: 'sme_strip',
};

/** Estimated MRR by product name */
const ESTIMATED_MRR: Record<string, number> = {
  'ParkConnect DUNE': 2549,
  'SkyFibre SMB': 2200,
  'ClinicConnect': 1499,
  'SkyFibre Home': 899,
  'WorkConnect SOHO': 599,
};

// =============================================================================
// Dynamic Scoring Config (reads from sales_engine_config table)
// =============================================================================

let _cachedDynamicConfig: DynamicScoringConfig | null | undefined = undefined;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load dynamic scoring config from the database. Falls back to null
 * (which means hardcoded constants are used). Cached for 5 minutes.
 */
async function getDynamicScoringConfig(): Promise<DynamicScoringConfig | null> {
  const now = Date.now();
  if (_cachedDynamicConfig !== undefined && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedDynamicConfig;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sales_engine_config')
      .select('config_value')
      .eq('config_key', 'scoring_constants')
      .single();

    if (error || !data) {
      _cachedDynamicConfig = null;
      _cacheTimestamp = now;
      return null;
    }

    _cachedDynamicConfig = data.config_value as unknown as DynamicScoringConfig;
    _cacheTimestamp = now;
    return _cachedDynamicConfig;
  } catch {
    _cachedDynamicConfig = null;
    _cacheTimestamp = now;
    return null;
  }
}

// =============================================================================
// Manual Scoring
// =============================================================================

/**
 * Score or re-score an address by inserting/upserting into lead_scores.
 * Also updates coverage_leads.lead_score with the composite score.
 */
export async function scoreAddress(input: ScoreLeadInput): Promise<ServiceResult<LeadScore>> {
  try {
    const supabase = await createClient();

    const insertData = {
      coverage_lead_id: input.coverage_lead_id,
      zone_id: input.zone_id ?? null,
      product_fit_score: input.product_fit_score,
      revenue_potential_score: input.revenue_potential_score,
      competitive_vuln_score: input.competitive_vuln_score,
      conversion_speed_score: input.conversion_speed_score,
      recommended_product: input.recommended_product ?? null,
      recommended_track: input.recommended_track ?? null,
      estimated_mrr: input.estimated_mrr ?? null,
      competitor_identified: input.competitor_identified ?? null,
      scored_by: input.scored_by ?? 'system',
      scoring_date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('lead_scores')
      .upsert(insertData, { onConflict: 'coverage_lead_id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const leadScore = data as LeadScore;

    // Update the coverage_leads table with the composite score
    const { error: updateError } = await supabase
      .from('coverage_leads')
      .update({ lead_score: leadScore.composite_score })
      .eq('id', input.coverage_lead_id);

    if (updateError) {
      return { data: leadScore, error: `Scored but failed to update coverage_leads: ${updateError.message}` };
    }

    return { data: leadScore, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to score address: ${message}` };
  }
}

// =============================================================================
// Auto-Scoring
// =============================================================================

/**
 * Automatically compute scores for a coverage lead based on its customer_type
 * and competitor_identified fields. Uses predefined scoring rules.
 */
export async function autoScoreLead(
  coverageLeadId: string,
  zoneId?: string
): Promise<ServiceResult<LeadScore>> {
  try {
    const supabase = await createClient();

    // Fetch the coverage lead to determine scoring inputs
    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .select('id, customer_type, competitor_identified')
      .eq('id', coverageLeadId)
      .single();

    if (leadError) {
      return { data: null, error: `Coverage lead not found: ${leadError.message}` };
    }

    const customerType = (lead.customer_type ?? '').toLowerCase().trim();
    const competitor = (lead.competitor_identified ?? '').toLowerCase().trim();

    // Load dynamic scoring config (falls back to hardcoded if unavailable)
    const dynamicConfig = await getDynamicScoringConfig();

    // Calculate individual scores — dynamic config overrides hardcoded values
    const productFitScores = dynamicConfig?.product_fit_scores ?? PRODUCT_FIT_SCORES;
    const revenuePotentialScores = dynamicConfig?.revenue_potential_scores ?? REVENUE_POTENTIAL_SCORES;
    const recommendedProducts = dynamicConfig?.recommended_products ?? RECOMMENDED_PRODUCTS;
    const estimatedMrrMap = dynamicConfig?.estimated_mrr ?? ESTIMATED_MRR;

    const productFitScore = productFitScores[customerType] ?? PRODUCT_FIT_SCORES[customerType] ?? 50;
    const revenuePotentialScore = revenuePotentialScores[customerType] ?? REVENUE_POTENTIAL_SCORES[customerType] ?? 40;
    const competitiveVulnScore = getCompetitiveVulnScore(competitor);
    const conversionSpeedScore = CONVERSION_SPEED_SCORES[customerType] ?? 60;

    // Determine recommendations
    const recommendedProduct = recommendedProducts[customerType] ?? RECOMMENDED_PRODUCTS[customerType] ?? 'WorkConnect SOHO';
    const recommendedTrack = RECOMMENDED_TRACKS[customerType] ?? 'sme_strip';
    const estimatedMrr = estimatedMrrMap[recommendedProduct] ?? ESTIMATED_MRR[recommendedProduct] ?? 599;

    // Delegate to scoreAddress for persistence
    const scoreResult = await scoreAddress({
      coverage_lead_id: coverageLeadId,
      zone_id: zoneId,
      product_fit_score: productFitScore,
      revenue_potential_score: revenuePotentialScore,
      competitive_vuln_score: competitiveVulnScore,
      conversion_speed_score: conversionSpeedScore,
      recommended_product: recommendedProduct,
      recommended_track: recommendedTrack,
      estimated_mrr: estimatedMrr,
      competitor_identified: competitor || null,
      scored_by: 'auto',
    });

    // Enrich with coverage data (non-blocking — if it fails, scoring still succeeds)
    if (scoreResult.data?.id) {
      const enrichResult = await enrichLeadCoverage(scoreResult.data.id);
      if (enrichResult.data) {
        // Apply coverage bonus to product_fit_score
        const coverageBonus = getCoverageBonus(
          enrichResult.data.skyfibre_confidence,
          enrichResult.data.dfa_coverage_type
        );

        if (coverageBonus > 0) {
          const boostedFit = Math.min(productFitScore + coverageBonus, 100);
          const coverageProduct = enrichResult.data.recommended_product;

          // Re-persist with coverage-adjusted scores
          const supabaseUpdate = await createClient();
          await supabaseUpdate
            .from('lead_scores')
            .update({
              product_fit_score: boostedFit,
              recommended_product: coverageProduct,
              estimated_mrr: ESTIMATED_MRR[coverageProduct] ?? estimatedMrr,
            })
            .eq('id', scoreResult.data.id);

          // Update the returned data
          scoreResult.data.product_fit_score = boostedFit;
          scoreResult.data.recommended_product = coverageProduct;
        }
      }
    }

    return scoreResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to auto-score lead ${coverageLeadId}: ${message}` };
  }
}

/**
 * Get product_fit bonus based on coverage availability.
 * +10 for high confidence SkyFibre or connected DFA.
 * +5 for medium confidence or near-net.
 */
function getCoverageBonus(
  skyfibreConfidence: string,
  dfaCoverageType: string
): number {
  if (skyfibreConfidence === 'high' || dfaCoverageType === 'connected') return 10;
  if (skyfibreConfidence === 'medium' || dfaCoverageType === 'near-net') return 5;
  return 0;
}

/**
 * Batch-score all unscored coverage leads in a zone.
 * Finds leads with a matching zone_id that do not yet have an entry in lead_scores.
 * Returns the count of leads scored and any errors encountered.
 */
export async function batchScoreZone(
  zoneId: string
): Promise<ServiceResult<{ scored: number; errors: string[] }>> {
  try {
    const supabase = await createClient();

    // Get all coverage_leads in the zone that don't have a lead_score entry yet
    const { data: leads, error: leadsError } = await supabase
      .from('coverage_leads')
      .select('id')
      .eq('zone_id', zoneId)
      .is('lead_score', null);

    if (leadsError) {
      return { data: null, error: `Failed to fetch unscored leads: ${leadsError.message}` };
    }

    const unscoredLeads = leads ?? [];
    if (unscoredLeads.length === 0) {
      return { data: { scored: 0, errors: [] }, error: null };
    }

    let scored = 0;
    const errors: string[] = [];

    for (const lead of unscoredLeads) {
      const result = await autoScoreLead(lead.id, zoneId);
      if (result.error) {
        errors.push(`Lead ${lead.id}: ${result.error}`);
      } else {
        scored++;
      }
    }

    return { data: { scored, errors }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to batch score zone ${zoneId}: ${message}` };
  }
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get top-scoring leads with optional filtering by zone, track, and minimum score.
 * Results are joined with coverage_leads for address context and sorted by composite_score DESC.
 */
export async function getTopLeads(
  options: TopLeadsOptions = {}
): Promise<ServiceResult<LeadScore[]>> {
  try {
    const supabase = await createClient();

    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    let query = supabase
      .from('lead_scores')
      .select(`
        *,
        coverage_lead:coverage_leads (
          id,
          address,
          latitude,
          longitude,
          status,
          customer_type,
          company_name,
          phone,
          created_at
        )
      `)
      .order('composite_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options.zone_id) {
      query = query.eq('zone_id', options.zone_id);
    }

    if (options.track) {
      query = query.eq('recommended_track', options.track);
    }

    if (options.min_score !== undefined) {
      query = query.gte('composite_score', options.min_score);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as LeadScore[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to fetch top leads: ${message}` };
  }
}

/**
 * Get summary statistics for scored leads.
 * Optionally filter by zone. Returns total count, average score, and breakdown by track.
 */
export async function getLeadStats(zoneId?: string): Promise<ServiceResult<LeadStats>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('lead_scores')
      .select('id, composite_score, recommended_track');

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    const scores = data ?? [];
    const totalScored = scores.length;

    const avgScore =
      totalScored > 0
        ? Math.round(
            (scores.reduce((sum, s) => sum + (s.composite_score ?? 0), 0) / totalScored) * 100
          ) / 100
        : 0;

    const countByTrack: Record<string, number> = {};
    for (const score of scores) {
      const track = score.recommended_track ?? 'unassigned';
      countByTrack[track] = (countByTrack[track] ?? 0) + 1;
    }

    return {
      data: {
        total_scored: totalScored,
        avg_score: avgScore,
        count_by_track: countByTrack,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to fetch lead stats: ${message}` };
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Determine competitive vulnerability score from a competitor string.
 * No current provider (null/empty) = 90 (highest opportunity).
 * Known fibre competitors = 20 (hardest to displace).
 */
function getCompetitiveVulnScore(competitor: string): number {
  if (!competitor) {
    return 90; // No current provider = highest opportunity
  }

  const normalized = competitor.toLowerCase();

  // Check each keyword against the competitor string
  for (const [keyword, score] of Object.entries(COMPETITIVE_VULN_SCORES)) {
    if (normalized.includes(keyword)) {
      return score;
    }
  }

  // Unknown competitor — moderate opportunity
  return 60;
}
