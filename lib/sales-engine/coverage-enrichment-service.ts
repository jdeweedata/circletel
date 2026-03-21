/**
 * Coverage Enrichment Service
 * Integrates Tarana base station and DFA building data into the sales engine.
 * Uses PostGIS RPC calls for efficient bulk spatial queries.
 *
 * @module lib/sales-engine/coverage-enrichment-service
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SalesZone,
  CoverageConfidenceLevel,
  ZoneCoverageEnrichment,
  LeadCoverageEnrichment,
  CoverageGapAnalysis,
} from './types';
import { enrichZoneDemographics } from './demographic-enrichment-service';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// Coverage confidence thresholds (from base-station-service.ts)
const COVERAGE_THRESHOLD_HIGH_KM = 3.0;
const COVERAGE_THRESHOLD_MAX_KM = 5.0;
const MIN_CONNECTIONS_HIGH = 10;
const MIN_CONNECTIONS_MEDIUM = 5;

// =============================================================================
// Zone Coverage Enrichment
// =============================================================================

/**
 * Enrich a single zone with coverage data from base stations and DFA buildings.
 * Queries both datasets within the zone's radius_km, computes coverage_score
 * and enriched_zone_score, and persists to the database.
 */
export async function enrichZoneCoverage(
  zoneId: string
): Promise<ServiceResult<ZoneCoverageEnrichment>> {
  try {
    const supabase = await createClient();

    // Fetch the zone
    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, center_lat, center_lng, radius_km, sme_density_score, penetration_rate, competitor_weakness_score')
      .eq('id', zoneId)
      .single();

    if (zoneError || !zone) {
      return { data: null, error: `Zone not found: ${zoneError?.message ?? 'no data'}` };
    }

    const radiusKm = zone.radius_km ?? 3.0;

    // Query base stations within radius (PostGIS RPC)
    const { data: bsData, error: bsError } = await supabase.rpc(
      'count_base_stations_in_radius',
      { p_lat: zone.center_lat, p_lng: zone.center_lng, p_radius_km: radiusKm }
    );

    if (bsError) {
      return { data: null, error: `Base station query failed: ${bsError.message}` };
    }

    const bsResult = Array.isArray(bsData) ? bsData[0] : bsData;
    const baseStationCount = bsResult?.station_count ?? 0;
    const baseStationConnections = bsResult?.total_connections ?? 0;

    // Query DFA buildings within radius (PostGIS RPC)
    const { data: dfaData, error: dfaError } = await supabase.rpc(
      'count_dfa_buildings_in_radius',
      { p_lat: zone.center_lat, p_lng: zone.center_lng, p_radius_km: radiusKm }
    );

    if (dfaError) {
      return { data: null, error: `DFA building query failed: ${dfaError.message}` };
    }

    const dfaResult = Array.isArray(dfaData) ? dfaData[0] : dfaData;
    const dfaConnectedCount = dfaResult?.connected_count ?? 0;
    const dfaNearNetCount = dfaResult?.near_net_count ?? 0;

    // Compute coverage confidence for the zone
    const coverageConfidence = computeZoneCoverageConfidence(
      baseStationCount,
      baseStationConnections,
      dfaConnectedCount
    );

    // Compute coverage score (0-100)
    const coverageScore = computeCoverageScore(
      baseStationCount,
      baseStationConnections,
      dfaConnectedCount,
      dfaNearNetCount
    );

    // Compute enriched zone score with coverage weight
    const enrichedZoneScore = computeEnrichedZoneScore(
      zone.sme_density_score ?? 0,
      zone.penetration_rate ?? 0,
      zone.competitor_weakness_score ?? 0,
      coverageScore
    );

    // Persist enrichment data
    const { error: updateError } = await supabase
      .from('sales_zones')
      .update({
        base_station_count: baseStationCount,
        base_station_connections: baseStationConnections,
        dfa_connected_count: dfaConnectedCount,
        dfa_near_net_count: dfaNearNetCount,
        coverage_confidence: coverageConfidence,
        coverage_score: coverageScore,
        enriched_zone_score: enrichedZoneScore,
        coverage_enriched_at: new Date().toISOString(),
      })
      .eq('id', zoneId);

    if (updateError) {
      return { data: null, error: `Failed to update zone: ${updateError.message}` };
    }

    const enrichment: ZoneCoverageEnrichment = {
      zone_id: zoneId,
      base_station_count: baseStationCount,
      base_station_connections: baseStationConnections,
      dfa_connected_count: dfaConnectedCount,
      dfa_near_net_count: dfaNearNetCount,
      coverage_confidence: coverageConfidence,
      coverage_score: coverageScore,
      enriched_zone_score: enrichedZoneScore,
    };

    // Also run demographic enrichment if ward data exists (non-blocking)
    try {
      await enrichZoneDemographics(zoneId);
    } catch {
      // Demographic enrichment is supplementary — don't fail coverage enrichment
    }

    return { data: enrichment, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to enrich zone ${zoneId}: ${message}` };
  }
}

/**
 * Batch enrich all active zones with coverage data.
 */
export async function enrichAllZones(): Promise<
  ServiceResult<{ enriched: number; errors: string[] }>
> {
  try {
    const supabase = await createClient();

    const { data: zones, error: zonesError } = await supabase
      .from('sales_zones')
      .select('id')
      .eq('status', 'active');

    if (zonesError) {
      return { data: null, error: `Failed to fetch zones: ${zonesError.message}` };
    }

    const activeZones = zones ?? [];
    let enriched = 0;
    const errors: string[] = [];

    for (const zone of activeZones) {
      const result = await enrichZoneCoverage(zone.id);
      if (result.error) {
        errors.push(`Zone ${zone.id}: ${result.error}`);
      } else {
        enriched++;
      }
    }

    return { data: { enriched, errors }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to enrich all zones: ${message}` };
  }
}

// =============================================================================
// Lead Coverage Enrichment
// =============================================================================

/**
 * Enrich a single lead with coverage proximity data.
 * Finds nearest base station (SkyFibre) and nearest DFA building (BizFibre),
 * computes confidence levels, and determines product eligibility.
 */
export async function enrichLeadCoverage(
  leadScoreId: string
): Promise<ServiceResult<LeadCoverageEnrichment>> {
  try {
    const supabase = await createClient();

    // Fetch the lead score and its coverage_lead coordinates
    const { data: leadScore, error: lsError } = await supabase
      .from('lead_scores')
      .select(`
        id,
        coverage_lead_id,
        recommended_product,
        coverage_lead:coverage_leads (
          id, latitude, longitude, customer_type
        )
      `)
      .eq('id', leadScoreId)
      .single();

    if (lsError || !leadScore) {
      return { data: null, error: `Lead score not found: ${lsError?.message ?? 'no data'}` };
    }

    const coverageLead = leadScore.coverage_lead as {
      id: string;
      latitude: number | null;
      longitude: number | null;
      customer_type?: string;
    } | null;

    if (!coverageLead?.latitude || !coverageLead?.longitude) {
      return { data: null, error: 'Lead has no coordinates' };
    }

    const lat = coverageLead.latitude;
    const lng = coverageLead.longitude;

    // Find nearest base station via existing PostGIS function
    const { data: bsData, error: bsError } = await supabase.rpc(
      'find_nearest_tarana_base_station',
      { p_lat: lat, p_lng: lng, p_limit: 1 }
    );

    let nearestBsKm: number | null = null;
    let skyfibreConfidence: CoverageConfidenceLevel = 'none';

    if (!bsError && Array.isArray(bsData) && bsData.length > 0) {
      const nearest = bsData[0];
      nearestBsKm = Number(nearest.distance_km);
      skyfibreConfidence = calculateSkyFibreConfidence(
        nearestBsKm,
        nearest.active_connections ?? 0
      );
    }

    // Find nearest DFA building via new PostGIS function
    const { data: dfaData, error: dfaError } = await supabase.rpc(
      'find_nearest_dfa_building',
      { p_lat: lat, p_lng: lng, p_limit: 1 }
    );

    let nearestDfaKm: number | null = null;
    let dfaCoverageType: 'connected' | 'near-net' | 'none' = 'none';

    if (!dfaError && Array.isArray(dfaData) && dfaData.length > 0) {
      const nearest = dfaData[0];
      nearestDfaKm = Number(nearest.distance_km);
      // Consider DFA coverage if within 1km (connected) or 2km (near-net)
      if (nearest.coverage_type === 'connected' && nearestDfaKm <= 1.0) {
        dfaCoverageType = 'connected';
      } else if (nearestDfaKm <= 2.0) {
        dfaCoverageType = nearest.coverage_type === 'connected' ? 'connected' : 'near-net';
      }
    }

    // Determine product eligibility
    const coverageProductEligible: string[] = [];
    if (skyfibreConfidence === 'high' || skyfibreConfidence === 'medium') {
      coverageProductEligible.push('SkyFibre');
    }
    if (dfaCoverageType === 'connected') {
      coverageProductEligible.push('BizFibreConnect');
    } else if (dfaCoverageType === 'near-net') {
      coverageProductEligible.push('BizFibreConnect (Near-Net)');
    }

    // Auto product recommendation
    const customerType = coverageLead.customer_type ?? '';
    const recommendedProduct = getAutoProductRecommendation(
      skyfibreConfidence,
      dfaCoverageType,
      customerType
    );

    // Persist enrichment data to lead_scores
    const { error: updateError } = await supabase
      .from('lead_scores')
      .update({
        nearest_base_station_km: nearestBsKm,
        skyfibre_confidence: skyfibreConfidence,
        nearest_dfa_building_km: nearestDfaKm,
        dfa_coverage_type: dfaCoverageType,
        coverage_product_eligible: coverageProductEligible,
        recommended_product: recommendedProduct,
      })
      .eq('id', leadScoreId);

    if (updateError) {
      return { data: null, error: `Failed to update lead score: ${updateError.message}` };
    }

    const enrichment: LeadCoverageEnrichment = {
      lead_score_id: leadScoreId,
      nearest_base_station_km: nearestBsKm,
      skyfibre_confidence: skyfibreConfidence,
      nearest_dfa_building_km: nearestDfaKm,
      dfa_coverage_type: dfaCoverageType,
      coverage_product_eligible: coverageProductEligible,
      recommended_product: recommendedProduct,
    };

    return { data: enrichment, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to enrich lead ${leadScoreId}: ${message}` };
  }
}

// =============================================================================
// Coverage Gap Analysis
// =============================================================================

/**
 * Analyze zones for coverage gaps and untapped opportunities.
 * Returns zones that need infrastructure investment and zones with
 * high coverage but low lead activity.
 */
export async function getCoverageGapAnalysis(): Promise<ServiceResult<CoverageGapAnalysis>> {
  try {
    const supabase = await createClient();

    // Fetch all zones with their coverage data and lead counts
    const { data: zones, error: zonesError } = await supabase
      .from('sales_zones')
      .select('*')
      .eq('status', 'active');

    if (zonesError) {
      return { data: null, error: `Failed to fetch zones: ${zonesError.message}` };
    }

    const allZones = (zones ?? []) as SalesZone[];

    // Get lead counts per zone
    const { data: leadCounts, error: lcError } = await supabase
      .from('lead_scores')
      .select('zone_id');

    const leadCountMap: Record<string, number> = {};
    if (!lcError && leadCounts) {
      for (const lc of leadCounts) {
        if (lc.zone_id) {
          leadCountMap[lc.zone_id] = (leadCountMap[lc.zone_id] ?? 0) + 1;
        }
      }
    }

    // Classify zones
    const investmentNeeded: CoverageGapAnalysis['investment_needed'] = [];
    const untappedOpportunity: CoverageGapAnalysis['untapped_opportunity'] = [];
    const coverageSummary = { high: 0, medium: 0, low: 0, none: 0, not_enriched: 0 };

    for (const zone of allZones) {
      const leadCount = leadCountMap[zone.id] ?? 0;
      const confidence = zone.coverage_confidence;

      // Count by confidence
      if (!confidence) {
        coverageSummary.not_enriched++;
      } else {
        coverageSummary[confidence]++;
      }

      // Investment needed: has leads but poor coverage
      if (leadCount >= 3 && (confidence === 'none' || confidence === 'low' || !confidence)) {
        investmentNeeded.push({
          zone,
          lead_count: leadCount,
          coverage_confidence: confidence,
        });
      }

      // Untapped opportunity: good coverage but few leads
      const totalInfra = zone.base_station_count + zone.dfa_connected_count;
      if (totalInfra >= 3 && leadCount < 3) {
        untappedOpportunity.push({
          zone,
          base_station_count: zone.base_station_count,
          dfa_count: zone.dfa_connected_count + zone.dfa_near_net_count,
        });
      }
    }

    // Sort by priority
    investmentNeeded.sort((a, b) => b.lead_count - a.lead_count);
    untappedOpportunity.sort(
      (a, b) => (b.base_station_count + b.dfa_count) - (a.base_station_count + a.dfa_count)
    );

    return {
      data: {
        investment_needed: investmentNeeded,
        untapped_opportunity: untappedOpportunity,
        coverage_summary: coverageSummary,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to analyze coverage gaps: ${message}` };
  }
}

// =============================================================================
// Product Recommendation
// =============================================================================

/**
 * Determine the best product recommendation based on coverage availability.
 * Pure function — no database calls.
 */
export function getAutoProductRecommendation(
  skyfibreConfidence: CoverageConfidenceLevel,
  dfaCoverageType: 'connected' | 'near-net' | 'none',
  customerType: string
): string {
  const ct = customerType.toLowerCase().trim();
  const isBusinessType = ['business', 'enterprise', 'office_park', 'commercial'].includes(ct);
  const hasSkyFibre = skyfibreConfidence === 'high' || skyfibreConfidence === 'medium';
  const hasBizFibre = dfaCoverageType === 'connected';
  const hasNearNet = dfaCoverageType === 'near-net';

  // Both available: recommend based on customer type
  if (hasBizFibre && hasSkyFibre) {
    return isBusinessType ? 'BizFibreConnect' : 'SkyFibre SMB';
  }

  // BizFibre connected only
  if (hasBizFibre) {
    return 'BizFibreConnect';
  }

  // SkyFibre only
  if (hasSkyFibre) {
    if (isBusinessType) return 'SkyFibre SMB';
    if (['clinic', 'healthcare'].includes(ct)) return 'ClinicConnect';
    if (ct === 'residential') return 'SkyFibre Home';
    return 'WorkConnect SOHO';
  }

  // Near-net DFA (requires build-out)
  if (hasNearNet) {
    return 'BizFibreConnect (Near-Net)';
  }

  // No coverage — fallback to static recommendation
  const FALLBACK_PRODUCTS: Record<string, string> = {
    business: 'SkyFibre SMB',
    enterprise: 'ParkConnect DUNE',
    office_park: 'ParkConnect DUNE',
    clinic: 'ClinicConnect',
    healthcare: 'ClinicConnect',
    residential: 'SkyFibre Home',
    soho: 'WorkConnect SOHO',
  };

  return FALLBACK_PRODUCTS[ct] ?? 'WorkConnect SOHO';
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Compute zone-level coverage confidence from infrastructure counts.
 */
function computeZoneCoverageConfidence(
  baseStationCount: number,
  baseStationConnections: number,
  dfaConnectedCount: number
): CoverageConfidenceLevel {
  // High: multiple base stations with strong connections, or strong DFA presence
  if (
    (baseStationCount >= 2 && baseStationConnections >= MIN_CONNECTIONS_HIGH) ||
    (baseStationCount >= 1 && dfaConnectedCount >= 10)
  ) {
    return 'high';
  }

  // Medium: some base station presence or moderate DFA coverage
  if (
    (baseStationCount >= 1 && baseStationConnections >= MIN_CONNECTIONS_MEDIUM) ||
    dfaConnectedCount >= 5
  ) {
    return 'medium';
  }

  // Low: minimal infrastructure
  if (baseStationCount >= 1 || dfaConnectedCount >= 1) {
    return 'low';
  }

  return 'none';
}

/**
 * Compute a coverage score (0-100) from infrastructure metrics.
 */
function computeCoverageScore(
  baseStationCount: number,
  baseStationConnections: number,
  dfaConnectedCount: number,
  dfaNearNetCount: number
): number {
  let score = 0;

  // Base station component (up to 60 points)
  if (baseStationCount > 0) {
    if (baseStationConnections >= MIN_CONNECTIONS_HIGH) {
      score += 40 + Math.min(baseStationCount * 5, 20); // 40-60
    } else if (baseStationConnections >= MIN_CONNECTIONS_MEDIUM) {
      score += 25 + Math.min(baseStationCount * 5, 15); // 25-40
    } else {
      score += 10 + Math.min(baseStationCount * 5, 15); // 10-25
    }
  }

  // DFA connected component (up to 30 points)
  if (dfaConnectedCount > 0) {
    score += Math.min(dfaConnectedCount * 2, 30);
  }

  // DFA near-net component (up to 10 points)
  if (dfaNearNetCount > 0) {
    score += Math.min(dfaNearNetCount, 10);
  }

  return Math.min(score, 100);
}

/**
 * Compute enriched zone score incorporating coverage data.
 * Formula: (sme * 0.30) + ((100 - penetration) * 0.30) + (competitor * 0.15) + (coverage * 0.25)
 */
function computeEnrichedZoneScore(
  smeDensityScore: number,
  penetrationRate: number,
  competitorWeaknessScore: number,
  coverageScore: number
): number {
  const score =
    smeDensityScore * 0.3 +
    (100 - Math.min(penetrationRate, 100)) * 0.3 +
    competitorWeaknessScore * 0.15 +
    coverageScore * 0.25;

  return Math.round(score * 100) / 100;
}

/**
 * Calculate SkyFibre confidence for a lead based on distance and connections.
 * Mirrors the logic in base-station-service.ts.
 */
function calculateSkyFibreConfidence(
  distanceKm: number,
  activeConnections: number
): CoverageConfidenceLevel {
  if (distanceKm > COVERAGE_THRESHOLD_MAX_KM) return 'none';

  if (distanceKm <= COVERAGE_THRESHOLD_HIGH_KM && activeConnections >= MIN_CONNECTIONS_HIGH) {
    return 'high';
  }

  if (distanceKm <= COVERAGE_THRESHOLD_HIGH_KM && activeConnections >= MIN_CONNECTIONS_MEDIUM) {
    return 'medium';
  }

  if (distanceKm <= COVERAGE_THRESHOLD_MAX_KM && activeConnections >= MIN_CONNECTIONS_MEDIUM) {
    return 'medium';
  }

  if (distanceKm <= COVERAGE_THRESHOLD_MAX_KM && activeConnections >= 1) {
    return 'low';
  }

  return 'none';
}
