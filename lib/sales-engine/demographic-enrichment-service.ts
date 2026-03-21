/**
 * Demographic Enrichment Service
 * Imports Stats SA Census 2022 ward-level data and enriches sales zones
 * with demographic intelligence for propensity scoring.
 *
 * @module lib/sales-engine/demographic-enrichment-service
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SalesZone,
  WardDemographic,
  WardDemographicImportRow,
  ZoneDemographicEnrichment,
  DemographicsInRadius,
  ZoneSuggestion,
} from './types';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// =============================================================================
// Demographic Fit Score Computation
// =============================================================================

/**
 * Compute demographic fit score (0-100) from census data.
 * Formula: (pct_no_internet * 0.4) + (pct_income_above_r12800 * 0.35) + (pct_employed * 0.25)
 *
 * High internet gap = high opportunity for ISP.
 * High income = can afford CircleTel (R799-R14,999/mo).
 * High employment = stable payment capacity.
 */
export function computeDemographicFitScore(
  pctNoInternet: number,
  pctIncomeAboveR12800: number,
  pctEmployed: number
): number {
  const score =
    pctNoInternet * 0.4 +
    pctIncomeAboveR12800 * 0.35 +
    pctEmployed * 0.25;
  return Math.round(Math.min(Math.max(score, 0), 100) * 100) / 100;
}

/**
 * Compute propensity score (0-100) combining all intelligence layers.
 * Formula: demographic_fit * 0.25 + business_density * 0.25 + coverage_capacity * 0.25 + market_opportunity * 0.25
 *
 * Falls back to enriched_zone_score when no ward data is available (backward compatible).
 */
export function computePropensityScore(params: {
  demographicFitScore: number;
  smeDensityScore: number;
  coverageScore: number;
  penetrationRate: number;
  competitorWeaknessScore: number;
}): number {
  const {
    demographicFitScore,
    smeDensityScore,
    coverageScore,
    penetrationRate,
    competitorWeaknessScore,
  } = params;

  const marketOpportunity =
    ((100 - Math.min(penetrationRate, 100)) * 0.6) +
    (competitorWeaknessScore * 0.4);

  const score =
    demographicFitScore * 0.25 +
    smeDensityScore * 0.25 +
    coverageScore * 0.25 +
    marketOpportunity * 0.25;

  return Math.round(Math.min(Math.max(score, 0), 100) * 100) / 100;
}

// =============================================================================
// Ward Import
// =============================================================================

/**
 * Import ward demographics from parsed CSV rows.
 * Computes demographic_fit_score for each ward and upserts to ward_demographics.
 */
export async function importWardDemographics(
  rows: WardDemographicImportRow[]
): Promise<ServiceResult<{ imported: number; updated: number; errors: string[] }>> {
  try {
    const supabase = await createClient();
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const upsertRows = batch.map((row) => {
        const fitScore = computeDemographicFitScore(
          row.pct_no_internet ?? 0,
          row.pct_income_above_r12800 ?? 0,
          row.pct_employed ?? 0
        );

        return {
          ward_code: row.ward_code,
          ward_name: row.ward_name ?? null,
          municipality: row.municipality ?? null,
          province: row.province,
          centroid_lat: row.centroid_lat ?? null,
          centroid_lng: row.centroid_lng ?? null,
          total_population: row.total_population ?? 0,
          total_households: row.total_households ?? 0,
          pct_income_above_r12800: row.pct_income_above_r12800 ?? 0,
          pct_income_r6400_12800: row.pct_income_r6400_12800 ?? 0,
          pct_no_internet: row.pct_no_internet ?? 0,
          pct_cellphone_internet: row.pct_cellphone_internet ?? 0,
          pct_fixed_internet: row.pct_fixed_internet ?? 0,
          pct_employed: row.pct_employed ?? 0,
          pct_formal_dwelling: row.pct_formal_dwelling ?? 0,
          demographic_fit_score: fitScore,
          data_source: 'stats_sa_census_2022',
        };
      });

      const { data, error } = await supabase
        .from('ward_demographics')
        .upsert(upsertRows, { onConflict: 'ward_code' })
        .select('id');

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        const count = data?.length ?? 0;
        imported += count;
      }
    }

    return { data: { imported, updated, errors }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Ward import failed: ${message}` };
  }
}

// =============================================================================
// Zone Demographic Enrichment
// =============================================================================

/**
 * Enrich a single zone with demographic data from overlapping wards.
 * Calls get_demographics_in_radius() RPC and computes propensity_score.
 */
export async function enrichZoneDemographics(
  zoneId: string
): Promise<ServiceResult<ZoneDemographicEnrichment>> {
  try {
    const supabase = await createClient();

    // Fetch zone with existing scores
    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, center_lat, center_lng, radius_km, sme_density_score, penetration_rate, competitor_weakness_score, coverage_score')
      .eq('id', zoneId)
      .single();

    if (zoneError || !zone) {
      return { data: null, error: `Zone not found: ${zoneError?.message ?? 'no data'}` };
    }

    const radiusKm = zone.radius_km ?? 3.0;

    // Call PostGIS RPC for demographics in radius
    const { data: demoData, error: demoError } = await supabase.rpc(
      'get_demographics_in_radius',
      { p_lat: zone.center_lat, p_lng: zone.center_lng, p_radius_km: radiusKm }
    );

    if (demoError) {
      return { data: null, error: `Demographics query failed: ${demoError.message}` };
    }

    const result = Array.isArray(demoData) ? demoData[0] : demoData;

    // No ward data found — leave existing scores, set defaults
    if (!result || result.ward_count === 0) {
      return {
        data: {
          zone_id: zoneId,
          demographic_fit_score: 0,
          business_poi_density: 0,
          pct_no_internet: 0,
          pct_income_target: 0,
          propensity_score: 0,
          ward_count: 0,
          total_population: 0,
        },
        error: null,
      };
    }

    const demographicFitScore = computeDemographicFitScore(
      result.avg_pct_no_internet ?? 0,
      result.avg_pct_income_above_r12800 ?? 0,
      result.avg_pct_employed ?? 0
    );

    const businessPoiDensity =
      (result.total_business_pois ?? 0) +
      (result.total_office_pois ?? 0);

    const propensityScore = computePropensityScore({
      demographicFitScore,
      smeDensityScore: zone.sme_density_score ?? 0,
      coverageScore: zone.coverage_score ?? 0,
      penetrationRate: zone.penetration_rate ?? 0,
      competitorWeaknessScore: zone.competitor_weakness_score ?? 0,
    });

    // Persist to sales_zones
    const { error: updateError } = await supabase
      .from('sales_zones')
      .update({
        demographic_fit_score: demographicFitScore,
        business_poi_density: businessPoiDensity,
        pct_no_internet: result.avg_pct_no_internet ?? 0,
        pct_income_target: result.avg_pct_income_above_r12800 ?? 0,
        propensity_score: propensityScore,
        demographic_enriched_at: new Date().toISOString(),
      })
      .eq('id', zoneId);

    if (updateError) {
      return { data: null, error: `Failed to update zone: ${updateError.message}` };
    }

    const enrichment: ZoneDemographicEnrichment = {
      zone_id: zoneId,
      demographic_fit_score: demographicFitScore,
      business_poi_density: businessPoiDensity,
      pct_no_internet: result.avg_pct_no_internet ?? 0,
      pct_income_target: result.avg_pct_income_above_r12800 ?? 0,
      propensity_score: propensityScore,
      ward_count: result.ward_count,
      total_population: result.total_population ?? 0,
    };

    return { data: enrichment, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to enrich zone ${zoneId}: ${message}` };
  }
}

/**
 * Batch enrich all active zones with demographic data.
 */
export async function enrichAllZoneDemographics(): Promise<
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
      const result = await enrichZoneDemographics(zone.id);
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
// Ward Queries
// =============================================================================

/**
 * List imported wards with optional filters.
 */
export async function getWardDemographics(filters?: {
  province?: string;
  municipality?: string;
  minFitScore?: number;
  page?: number;
  pageSize?: number;
}): Promise<ServiceResult<{ wards: WardDemographic[]; total: number }>> {
  try {
    const supabase = await createClient();
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('ward_demographics')
      .select('*', { count: 'exact' })
      .order('demographic_fit_score', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (filters?.province) {
      query = query.eq('province', filters.province);
    }
    if (filters?.municipality) {
      query = query.eq('municipality', filters.municipality);
    }
    if (filters?.minFitScore) {
      query = query.gte('demographic_fit_score', filters.minFitScore);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        wards: (data ?? []) as WardDemographic[],
        total: count ?? 0,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to fetch wards: ${message}` };
  }
}

/**
 * Get ward import summary statistics.
 */
export async function getWardImportStats(): Promise<ServiceResult<{
  total_wards: number;
  provinces_covered: number;
  avg_fit_score: number;
  high_opportunity_wards: number;
}>> {
  try {
    const supabase = await createClient();

    const { data: wards, error } = await supabase
      .from('ward_demographics')
      .select('province, demographic_fit_score');

    if (error) {
      return { data: null, error: error.message };
    }

    const allWards = wards ?? [];
    const provinces = new Set(allWards.map((w) => w.province));
    const totalFit = allWards.reduce((sum, w) => sum + (w.demographic_fit_score ?? 0), 0);
    const highOpp = allWards.filter((w) => (w.demographic_fit_score ?? 0) >= 60).length;

    return {
      data: {
        total_wards: allWards.length,
        provinces_covered: provinces.size,
        avg_fit_score: allWards.length > 0
          ? Math.round((totalFit / allWards.length) * 100) / 100
          : 0,
        high_opportunity_wards: highOpp,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to fetch stats: ${message}` };
  }
}

/**
 * Get zone suggestions from wards with high demographic fit near coverage infrastructure.
 */
export async function getZoneSuggestions(params?: {
  minFitScore?: number;
  province?: string;
  limit?: number;
}): Promise<ServiceResult<ZoneSuggestion[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('suggest_zones_from_demographics', {
      p_min_fit_score: params?.minFitScore ?? 50,
      p_province: params?.province ?? null,
      p_limit: params?.limit ?? 20,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as ZoneSuggestion[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to get zone suggestions: ${message}` };
  }
}

// =============================================================================
// CSV Parsing
// =============================================================================

/**
 * Parse Stats SA Census CSV data into WardDemographicImportRow[].
 * Handles common CSV formats from Stats SA Community Profiles.
 */
export function parseWardCsv(csvText: string): {
  rows: WardDemographicImportRow[];
  errors: string[];
} {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must have a header row and at least one data row'] };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const rows: WardDemographicImportRow[] = [];
  const errors: string[] = [];

  // Map common column names to our fields
  const fieldMap: Record<string, string> = {
    ward_code: 'ward_code',
    wardcode: 'ward_code',
    ward_id: 'ward_code',
    ward_name: 'ward_name',
    wardname: 'ward_name',
    municipality: 'municipality',
    muni: 'municipality',
    municipality_name: 'municipality',
    province: 'province',
    prov: 'province',
    province_name: 'province',
    latitude: 'centroid_lat',
    centroid_lat: 'centroid_lat',
    lat: 'centroid_lat',
    longitude: 'centroid_lng',
    centroid_lng: 'centroid_lng',
    lng: 'centroid_lng',
    lon: 'centroid_lng',
    total_population: 'total_population',
    population: 'total_population',
    pop: 'total_population',
    total_households: 'total_households',
    households: 'total_households',
    hh: 'total_households',
    pct_income_above_r12800: 'pct_income_above_r12800',
    income_above_12800: 'pct_income_above_r12800',
    pct_income_r6400_12800: 'pct_income_r6400_12800',
    income_6400_12800: 'pct_income_r6400_12800',
    pct_no_internet: 'pct_no_internet',
    no_internet: 'pct_no_internet',
    pct_cellphone_internet: 'pct_cellphone_internet',
    cellphone_internet: 'pct_cellphone_internet',
    pct_fixed_internet: 'pct_fixed_internet',
    fixed_internet: 'pct_fixed_internet',
    pct_employed: 'pct_employed',
    employed: 'pct_employed',
    employment_rate: 'pct_employed',
    pct_formal_dwelling: 'pct_formal_dwelling',
    formal_dwelling: 'pct_formal_dwelling',
  };

  // Build column index mapping
  const colMap: Record<string, number> = {};
  for (let i = 0; i < header.length; i++) {
    const mapped = fieldMap[header[i]];
    if (mapped) {
      colMap[mapped] = i;
    }
  }

  if (!('ward_code' in colMap)) {
    return { rows: [], errors: ['CSV must contain a ward_code (or wardcode, ward_id) column'] };
  }
  if (!('province' in colMap)) {
    return { rows: [], errors: ['CSV must contain a province column'] };
  }

  for (let lineNum = 1; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => c.trim());

    const getStr = (field: string): string | undefined => {
      const idx = colMap[field];
      return idx !== undefined ? cols[idx] || undefined : undefined;
    };

    const getNum = (field: string): number | undefined => {
      const idx = colMap[field];
      if (idx === undefined) return undefined;
      const val = parseFloat(cols[idx]);
      return isNaN(val) ? undefined : val;
    };

    const wardCode = getStr('ward_code');
    const province = getStr('province');

    if (!wardCode || !province) {
      errors.push(`Row ${lineNum + 1}: missing ward_code or province`);
      continue;
    }

    rows.push({
      ward_code: wardCode,
      ward_name: getStr('ward_name'),
      municipality: getStr('municipality'),
      province,
      centroid_lat: getNum('centroid_lat'),
      centroid_lng: getNum('centroid_lng'),
      total_population: getNum('total_population'),
      total_households: getNum('total_households'),
      pct_income_above_r12800: getNum('pct_income_above_r12800'),
      pct_income_r6400_12800: getNum('pct_income_r6400_12800'),
      pct_no_internet: getNum('pct_no_internet'),
      pct_cellphone_internet: getNum('pct_cellphone_internet'),
      pct_fixed_internet: getNum('pct_fixed_internet'),
      pct_employed: getNum('pct_employed'),
      pct_formal_dwelling: getNum('pct_formal_dwelling'),
    });
  }

  return { rows, errors };
}
