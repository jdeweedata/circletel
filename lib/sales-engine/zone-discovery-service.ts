/**
 * Zone Discovery Service
 * Automates zone creation by discovering high-potential wards from demographics,
 * coverage infrastructure, and execution milestone alignment.
 *
 * @module lib/sales-engine/zone-discovery-service
 */

import { createClient } from '@/lib/supabase/server';
import { enrichZoneCoverage } from './coverage-enrichment-service';
import { enrichZoneDemographics } from './demographic-enrichment-service';
import type {
  ZoneType,
  ZoneDiscoveryCandidate,
  ZoneDiscoveryParams,
  ZoneDiscoveryResult,
  ZoneDiscoveryStatus,
  ProductCoverageRequirement,
  CreateZoneInput,
  SalesZone,
  ExecutionMilestone,
} from './types';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Raw row returned by the discover_zone_candidates RPC */
interface RawCandidateRow {
  ward_code: string;
  ward_name: string | null;
  municipality: string | null;
  province: string;
  centroid_lat: number;
  centroid_lng: number;
  demographic_fit_score: number;
  pct_no_internet: number;
  pct_income_above_r12800: number;
  pct_employed: number;
  total_population: number;
  total_households: number;
  business_poi_count: number;
  office_poi_count: number;
  healthcare_poi_count: number;
  nearby_base_stations: number;
  nearby_base_connections: number;
  nearby_dfa_connected: number;
  nearby_dfa_near_net: number;
}

// =============================================================================
// Product-Coverage Mapping
// =============================================================================

const PRODUCT_COVERAGE_MAP: ProductCoverageRequirement[] = [
  { product_name: 'SkyFibre SMB', needs_base_stations: true, needs_dfa: false, needs_office_pois: false, needs_healthcare_pois: false },
  { product_name: 'SkyFibre Home', needs_base_stations: true, needs_dfa: false, needs_office_pois: false, needs_healthcare_pois: false },
  { product_name: 'BizFibreConnect', needs_base_stations: false, needs_dfa: true, needs_office_pois: false, needs_healthcare_pois: false },
  { product_name: 'ParkConnect DUNE', needs_base_stations: true, needs_dfa: false, needs_office_pois: true, needs_healthcare_pois: false },
  { product_name: 'ClinicConnect', needs_base_stations: true, needs_dfa: false, needs_office_pois: false, needs_healthcare_pois: true },
  { product_name: 'WorkConnect SOHO', needs_base_stations: false, needs_dfa: false, needs_office_pois: false, needs_healthcare_pois: false },
  { product_name: 'CloudWiFi WaaS', needs_base_stations: true, needs_dfa: false, needs_office_pois: false, needs_healthcare_pois: false },
  { product_name: 'Managed IT', needs_base_stations: false, needs_dfa: false, needs_office_pois: true, needs_healthcare_pois: false },
];

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Determine which Arlan upsell use cases are relevant for a zone
 * based on its type and POI composition. Arlan products are always
 * nationally available via MTN LTE/5G.
 */
function getArlanUseCasesForZone(
  zoneType: ZoneType,
  businessPoiCount: number,
  healthcarePoiCount: number
): string[] {
  // Base use cases available in every zone
  const useCases = ['voice_comms', 'backup_connectivity', 'device_upgrade'];

  // Add zone-specific use cases
  if (zoneType === 'office_park' || businessPoiCount >= 5) {
    useCases.push('fleet_management', 'data_connectivity');
  }
  if (zoneType === 'clinic_cluster' || healthcarePoiCount >= 2) {
    useCases.push('data_connectivity');
  }
  if (zoneType === 'commercial_strip') {
    useCases.push('iot_m2m', 'venue_wifi');
  }

  return [...new Set(useCases)];
}

/**
 * Estimate potential Arlan MRR for a zone based on business density.
 * Uses avg curated deal revenue (~R100/deal/month in commission + markup)
 * multiplied by estimated sellable deals (fraction of business POIs).
 */
function estimateArlanMRR(businessPoiCount: number, zoneType: ZoneType): number {
  // Avg combined monthly revenue per Arlan deal (commission + markup)
  const AVG_REVENUE_PER_DEAL = 140; // R100 markup + R40 commission approx

  // Penetration estimate: % of businesses likely to buy an Arlan deal
  const penetrationRates: Record<ZoneType, number> = {
    office_park: 0.15,      // 15% of businesses
    commercial_strip: 0.10,
    clinic_cluster: 0.08,
    residential_estate: 0.03,
    mixed: 0.05,
  };

  const penetration = penetrationRates[zoneType] ?? 0.05;
  const estimatedDeals = Math.max(1, Math.round(businessPoiCount * penetration));

  return Math.round(estimatedDeals * AVG_REVENUE_PER_DEAL);
}

/**
 * Compute coverage score from infrastructure counts (0-100).
 * Reuses the same formula as coverage-enrichment-service.
 */
function computeCoverageScore(
  baseStationCount: number,
  baseStationConnections: number,
  dfaConnectedCount: number,
  dfaNearNetCount: number
): number {
  // Base station component (0-40): stations nearby + connection density
  const stationScore = Math.min(baseStationCount * 10, 20);
  const connectionScore = Math.min(baseStationConnections * 2, 20);

  // DFA component (0-40): connected buildings + near-net potential
  const dfaConnectedScore = Math.min(dfaConnectedCount * 5, 25);
  const dfaNearNetScore = Math.min(dfaNearNetCount * 2, 15);

  // Bonus for having both technologies (0-20)
  const dualTechBonus = (baseStationCount > 0 && dfaConnectedCount > 0) ? 20 : 0;

  return Math.min(stationScore + connectionScore + dfaConnectedScore + dfaNearNetScore + dualTechBonus, 100);
}

/**
 * Determine which products are eligible based on coverage infrastructure and POIs.
 */
function getEligibleProducts(
  baseStationCount: number,
  dfaConnectedCount: number,
  officePois: number,
  healthcarePois: number
): string[] {
  const eligible: string[] = [];

  for (const req of PRODUCT_COVERAGE_MAP) {
    const hasBaseStations = !req.needs_base_stations || baseStationCount > 0;
    const hasDfa = !req.needs_dfa || dfaConnectedCount > 0;
    const hasOfficePois = !req.needs_office_pois || officePois >= 3;
    const hasHealthcarePois = !req.needs_healthcare_pois || healthcarePois >= 2;

    if (hasBaseStations && hasDfa && hasOfficePois && hasHealthcarePois) {
      eligible.push(req.product_name);
    }
  }

  return eligible;
}

/**
 * Classify zone type based on POI composition.
 */
function classifyZoneType(
  officePois: number,
  healthcarePois: number,
  businessPois: number
): ZoneType {
  if (officePois >= 5) return 'office_park';
  if (healthcarePois >= 3) return 'clinic_cluster';
  if (businessPois >= 10) return 'commercial_strip';
  if (officePois + businessPois >= 5) return 'mixed';
  return 'residential_estate';
}

/**
 * Generate a zone name from ward and municipality.
 */
function generateZoneName(
  wardName: string | null,
  municipality: string | null,
  zoneType: ZoneType
): string {
  const typeLabels: Record<ZoneType, string> = {
    office_park: 'Office Park',
    commercial_strip: 'Commercial',
    clinic_cluster: 'Clinic Cluster',
    residential_estate: 'Residential',
    mixed: 'Mixed Use',
  };

  const location = wardName || municipality || 'Unknown';
  return `${location} ${typeLabels[zoneType]}`;
}

/**
 * Compute product alignment score: how well eligible products match
 * the current execution milestone's target_products.
 */
function computeProductAlignmentScore(
  eligibleProducts: string[],
  targetProducts: string[]
): number {
  if (targetProducts.length === 0) return 50; // Neutral if no milestone active

  const intersection = eligibleProducts.filter((p) =>
    targetProducts.includes(p)
  );

  if (intersection.length === 0) return 10; // Very low but not zero

  // Base score from intersection ratio
  const baseScore = (intersection.length / targetProducts.length) * 80;

  // Bonus for high-value products in intersection
  const highValueProducts = ['ParkConnect DUNE', 'BizFibreConnect', 'SkyFibre SMB'];
  const hasHighValue = intersection.some((p) => highValueProducts.includes(p));
  const bonus = hasHighValue ? 20 : 0;

  return Math.min(Math.round(baseScore + bonus), 100);
}

/**
 * Compute market opportunity score from penetration and competitive landscape.
 */
function computeMarketOpportunityScore(
  pctNoInternet: number,
  pctIncomeAboveR12800: number
): number {
  // High internet gap = high opportunity
  const internetGapScore = Math.min(pctNoInternet * 1.5, 60);
  // High income = ability to pay
  const incomeScore = Math.min(pctIncomeAboveR12800 * 2, 40);

  return Math.min(Math.round(internetGapScore + incomeScore), 100);
}

// =============================================================================
// Main Discovery Function
// =============================================================================

/**
 * Run zone discovery: scan wards, score candidates, persist batch.
 */
export async function runZoneDiscovery(
  params?: ZoneDiscoveryParams
): Promise<ServiceResult<ZoneDiscoveryResult>> {
  try {
    const supabase = await createClient();
    const batchId = new Date().toISOString();

    // Get current active milestone for product alignment
    const today = new Date().toISOString().split('T')[0];
    const { data: milestones } = await supabase
      .from('execution_milestones')
      .select('*')
      .lte('period_start', today)
      .gte('period_end', today)
      .limit(1);

    const activeMilestone = milestones?.[0] as ExecutionMilestone | undefined;
    const targetProducts: string[] = activeMilestone?.target_products ?? [];
    const milestoneMonth = activeMilestone?.month_number ?? null;

    // Call the RPC to get raw ward candidates
    const { data: rawCandidates, error: rpcError } = await supabase.rpc(
      'discover_zone_candidates',
      {
        p_min_fit_score: params?.min_fit_score ?? 40,
        p_province: params?.province ?? null,
        p_max_existing_zone_distance_km: 3.0,
        p_limit: params?.limit ?? 50,
      }
    );

    if (rpcError) {
      return { data: null, error: `RPC failed: ${rpcError.message}` };
    }

    const rows = (rawCandidates ?? []) as RawCandidateRow[];

    if (rows.length === 0) {
      return {
        data: {
          batch_id: batchId,
          candidates: [],
          total_wards_scanned: 0,
          milestone_month: milestoneMonth,
          milestone_target_products: targetProducts,
        },
        error: null,
      };
    }

    // Score and classify each candidate
    const candidates: ZoneDiscoveryCandidate[] = [];

    for (const row of rows) {
      const coverageScore = computeCoverageScore(
        row.nearby_base_stations,
        row.nearby_base_connections,
        row.nearby_dfa_connected,
        row.nearby_dfa_near_net
      );

      const eligibleProducts = getEligibleProducts(
        row.nearby_base_stations,
        row.nearby_dfa_connected,
        row.office_poi_count,
        row.healthcare_poi_count
      );

      const productAlignmentScore = computeProductAlignmentScore(
        eligibleProducts,
        targetProducts
      );

      const marketOpportunityScore = computeMarketOpportunityScore(
        row.pct_no_internet,
        row.pct_income_above_r12800
      );

      const zoneType = classifyZoneType(
        row.office_poi_count,
        row.healthcare_poi_count,
        row.business_poi_count
      );

      const zoneName = generateZoneName(
        row.ward_name,
        row.municipality,
        zoneType
      );

      // Composite score: equal weighting across 4 dimensions
      const compositeScore = Math.round(
        (row.demographic_fit_score ?? 0) * 0.25 +
        coverageScore * 0.25 +
        productAlignmentScore * 0.25 +
        marketOpportunityScore * 0.25
      );

      // Arlan opportunity: every zone gets MTN deals (nationally available via LTE/5G)
      // Estimate based on business POI count × avg deal revenue
      const arlanUseCases = getArlanUseCasesForZone(zoneType, row.business_poi_count, row.healthcare_poi_count);
      const estimatedArlanMRR = estimateArlanMRR(row.business_poi_count, zoneType);

      const candidate: ZoneDiscoveryCandidate = {
        id: '', // Will be set by DB
        ward_code: row.ward_code,
        ward_name: row.ward_name,
        municipality: row.municipality,
        province: row.province,
        center_lat: row.centroid_lat,
        center_lng: row.centroid_lng,
        demographic_fit_score: row.demographic_fit_score,
        coverage_score: coverageScore,
        product_alignment_score: productAlignmentScore,
        market_opportunity_score: marketOpportunityScore,
        composite_score: compositeScore,
        base_station_count: row.nearby_base_stations,
        base_station_connections: row.nearby_base_connections,
        dfa_connected_count: row.nearby_dfa_connected,
        dfa_near_net_count: row.nearby_dfa_near_net,
        business_poi_count: row.business_poi_count,
        office_poi_count: row.office_poi_count,
        healthcare_poi_count: row.healthcare_poi_count,
        total_population: row.total_population,
        total_households: row.total_households,
        pct_no_internet: row.pct_no_internet,
        pct_income_above_r12800: row.pct_income_above_r12800,
        suggested_zone_type: zoneType,
        suggested_zone_name: zoneName,
        eligible_products: eligibleProducts,
        estimated_arlan_mrr: estimatedArlanMRR,
        arlan_upsell_use_cases: arlanUseCases,
        milestone_month: milestoneMonth,
        milestone_target_products: targetProducts,
        status: 'pending',
        approved_by: null,
        approved_at: null,
        created_zone_id: null,
        rejection_reason: null,
        discovery_batch_id: batchId,
        auto_decision: null,
        auto_decided_at: null,
        campaign_tag: null,
        arlan_only_zone: false,
        created_at: '',
        updated_at: '',
      };

      candidates.push(candidate);
    }

    // Sort by composite score descending
    candidates.sort((a, b) => b.composite_score - a.composite_score);

    // Persist batch to database
    const insertRows = candidates.map((c) => ({
      ward_code: c.ward_code,
      ward_name: c.ward_name,
      municipality: c.municipality,
      province: c.province,
      center_lat: c.center_lat,
      center_lng: c.center_lng,
      demographic_fit_score: c.demographic_fit_score,
      coverage_score: c.coverage_score,
      product_alignment_score: c.product_alignment_score,
      market_opportunity_score: c.market_opportunity_score,
      composite_score: c.composite_score,
      base_station_count: c.base_station_count,
      base_station_connections: c.base_station_connections,
      dfa_connected_count: c.dfa_connected_count,
      dfa_near_net_count: c.dfa_near_net_count,
      business_poi_count: c.business_poi_count,
      office_poi_count: c.office_poi_count,
      healthcare_poi_count: c.healthcare_poi_count,
      total_population: c.total_population,
      total_households: c.total_households,
      pct_no_internet: c.pct_no_internet,
      pct_income_above_r12800: c.pct_income_above_r12800,
      suggested_zone_type: c.suggested_zone_type,
      suggested_zone_name: c.suggested_zone_name,
      eligible_products: c.eligible_products,
      estimated_arlan_mrr: c.estimated_arlan_mrr,
      arlan_upsell_use_cases: c.arlan_upsell_use_cases,
      milestone_month: c.milestone_month,
      milestone_target_products: c.milestone_target_products,
      status: 'pending' as const,
      discovery_batch_id: batchId,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('zone_discovery_candidates')
      .insert(insertRows)
      .select();

    if (insertError) {
      return { data: null, error: `Failed to persist candidates: ${insertError.message}` };
    }

    return {
      data: {
        batch_id: batchId,
        candidates: (inserted ?? []) as ZoneDiscoveryCandidate[],
        total_wards_scanned: rows.length,
        milestone_month: milestoneMonth,
        milestone_target_products: targetProducts,
      },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

// =============================================================================
// Query & Filter
// =============================================================================

interface CandidateFilters {
  status?: ZoneDiscoveryStatus;
  province?: string;
  min_score?: number;
  batch_id?: string;
  page?: number;
  pageSize?: number;
}

/**
 * List discovery candidates with filtering and pagination.
 */
export async function getDiscoveryCandidates(
  filters?: CandidateFilters
): Promise<ServiceResult<{ candidates: ZoneDiscoveryCandidate[]; total: number }>> {
  try {
    const supabase = await createClient();
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('zone_discovery_candidates')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.province) {
      query = query.eq('province', filters.province);
    }
    if (filters?.min_score) {
      query = query.gte('composite_score', filters.min_score);
    }
    if (filters?.batch_id) {
      query = query.eq('discovery_batch_id', filters.batch_id);
    }

    const { data, error, count } = await query
      .order('composite_score', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        candidates: (data ?? []) as ZoneDiscoveryCandidate[],
        total: count ?? 0,
      },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

// =============================================================================
// Approve / Reject / Bulk
// =============================================================================

/**
 * Approve a candidate: creates a sales zone, enriches it, and links back.
 */
export async function approveCandidate(
  candidateId: string,
  overrides?: Partial<CreateZoneInput>,
  approvedBy?: string
): Promise<ServiceResult<SalesZone>> {
  try {
    const supabase = await createClient();

    // Fetch candidate
    const { data: candidate, error: fetchError } = await supabase
      .from('zone_discovery_candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      return { data: null, error: `Candidate not found: ${fetchError?.message ?? 'no data'}` };
    }

    if (candidate.status !== 'pending') {
      return { data: null, error: `Candidate is already ${candidate.status}` };
    }

    // Create the zone using existing createZone function
    const { createZone } = await import('./zone-service');

    const zoneInput: CreateZoneInput = {
      name: overrides?.name ?? candidate.suggested_zone_name,
      zone_type: overrides?.zone_type ?? candidate.suggested_zone_type,
      center_lat: candidate.center_lat,
      center_lng: candidate.center_lng,
      sme_density_score: candidate.business_poi_count,
      penetration_rate: 0, // New zone, no penetration yet
      competitor_weakness_score: 50, // Default, will be enriched
      province: candidate.province,
      suburb: candidate.ward_name ?? undefined,
      notes: `Auto-discovered from ward ${candidate.ward_code}. Eligible products: ${candidate.eligible_products.join(', ')}`,
      status: 'active',
      priority: candidate.composite_score >= 70 ? 'high' : candidate.composite_score >= 40 ? 'medium' : 'low',
      ...overrides,
    };

    const createResult = await createZone(zoneInput);
    if (createResult.error || !createResult.data) {
      return { data: null, error: `Failed to create zone: ${createResult.error ?? 'no data'}` };
    }

    const newZone = createResult.data;

    // Enrich the new zone with coverage and demographic data
    await enrichZoneCoverage(newZone.id);
    await enrichZoneDemographics(newZone.id);

    // Update candidate status
    await supabase
      .from('zone_discovery_candidates')
      .update({
        status: 'approved',
        approved_by: approvedBy ?? 'admin',
        approved_at: new Date().toISOString(),
        created_zone_id: newZone.id,
      })
      .eq('id', candidateId);

    return { data: newZone, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

/**
 * Reject a candidate with an optional reason.
 */
export async function rejectCandidate(
  candidateId: string,
  reason?: string
): Promise<ServiceResult<{ rejected: boolean }>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('zone_discovery_candidates')
      .update({
        status: 'rejected',
        rejection_reason: reason ?? null,
      })
      .eq('id', candidateId)
      .eq('status', 'pending');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { rejected: true }, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

/**
 * Bulk approve multiple candidates.
 */
export async function bulkApprove(
  candidateIds: string[],
  approvedBy?: string
): Promise<ServiceResult<{ approved: number; failed: number; zones: SalesZone[] }>> {
  try {
    const zones: SalesZone[] = [];
    let failed = 0;

    for (const id of candidateIds) {
      const result = await approveCandidate(id, undefined, approvedBy);
      if (result.data) {
        zones.push(result.data);
      } else {
        failed++;
        console.error(`[Zone Discovery] Failed to approve ${id}: ${result.error}`);
      }
    }

    return {
      data: { approved: zones.length, failed, zones },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

/**
 * Bulk reject multiple candidates.
 */
export async function bulkReject(
  candidateIds: string[],
  reason?: string
): Promise<ServiceResult<{ rejected: number }>> {
  try {
    const supabase = await createClient();

    const { error, count } = await supabase
      .from('zone_discovery_candidates')
      .update({
        status: 'rejected',
        rejection_reason: reason ?? null,
      })
      .in('id', candidateIds)
      .eq('status', 'pending');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { rejected: count ?? candidateIds.length }, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

// =============================================================================
// Expiry
// =============================================================================

/**
 * Mark pending candidates older than 30 days as expired.
 */
export async function expireOldCandidates(): Promise<
  ServiceResult<{ expired: number }>
> {
  try {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error, count } = await supabase
      .from('zone_discovery_candidates')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { expired: count ?? 0 }, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}
