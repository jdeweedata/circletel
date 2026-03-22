/**
 * Competitor Zone Mapping Service
 *
 * Maps competitor presence per sales zone using two approaches:
 * 1. Free proxy: Infers fibre competition from existing DFA building data
 * 2. Firecrawl scrape: Monthly check of competitor coverage pages (future)
 *
 * Auto-computes competitor_weakness_score on sales_zones based on
 * how many competitors have confirmed or inferred coverage.
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

interface CompetitorMapping {
  competitors_mapped: number;
  weakness_score: number;
}

interface BulkMappingResult {
  zones_mapped: number;
  errors: string[];
}

interface CompetitorCoverage {
  name: string;
  has_coverage: boolean;
  coverage_type: string | null;
  confidence: string;
}

interface CompetitorSummary {
  competitors: CompetitorCoverage[];
}

// =============================================================================
// Constants
// =============================================================================

/** Known South African ISP competitors and their technology types */
const SA_COMPETITORS = [
  { name: 'Vodacom Business', technologies: ['fibre', 'lte', '5g'] },
  { name: 'Telkom', technologies: ['fibre', 'lte', 'dsl'] },
  { name: 'Rain', technologies: ['5g', 'lte'] },
  { name: 'Afrihost', technologies: ['fibre', 'lte'] },
  { name: 'Vumatel/Openserve', technologies: ['fibre'] },
  { name: 'Liquid Intelligent', technologies: ['fibre'] },
] as const;

// =============================================================================
// DFA-Proxy Inference
// =============================================================================

/**
 * Infer competitor presence from DFA building data for a single zone.
 *
 * Logic:
 * - dfa_connected_count >= 10: Vumatel/Openserve has fibre (they build DFA)
 * - dfa_connected_count >= 5: Telkom has fibre (large reseller)
 * - dfa_connected_count >= 20: Afrihost has fibre (resells on DFA/Openserve)
 * - dfa_connected_count >= 30: Liquid Intelligent has fibre (enterprise fibre)
 * - Always: Vodacom Business has LTE/5G (national coverage)
 * - Always: Rain has 5G/LTE (national coverage)
 *
 * After upserting competitor records, calls compute_competitor_weakness_score()
 * and updates sales_zones.competitor_weakness_score.
 */
export async function inferCompetitorPresenceFromDFA(
  zoneId: string
): Promise<ServiceResult<CompetitorMapping>> {
  try {
    const supabase = await createClient();

    // 1. Fetch zone's DFA counts
    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('id, dfa_connected_count, dfa_near_net_count')
      .eq('id', zoneId)
      .single();

    if (zoneError || !zone) {
      return {
        data: null,
        error: `Zone not found: ${zoneError?.message ?? 'no data'}`,
      };
    }

    const dfaConnected = zone.dfa_connected_count ?? 0;

    // 2. Build competitor inferences
    const inferences: Array<{
      competitor_name: string;
      has_coverage: boolean;
      coverage_type: string;
    }> = [];

    // National coverage — always present
    inferences.push({
      competitor_name: 'Vodacom Business',
      has_coverage: true,
      coverage_type: 'lte',
    });
    inferences.push({
      competitor_name: 'Rain',
      has_coverage: true,
      coverage_type: '5g',
    });

    // DFA-based fibre inferences
    inferences.push({
      competitor_name: 'Telkom',
      has_coverage: dfaConnected >= 5,
      coverage_type: 'fibre',
    });
    inferences.push({
      competitor_name: 'Vumatel/Openserve',
      has_coverage: dfaConnected >= 10,
      coverage_type: 'fibre',
    });
    inferences.push({
      competitor_name: 'Afrihost',
      has_coverage: dfaConnected >= 20,
      coverage_type: 'fibre',
    });
    inferences.push({
      competitor_name: 'Liquid Intelligent',
      has_coverage: dfaConnected >= 30,
      coverage_type: 'fibre',
    });

    // 3. Upsert into competitor_zone_coverage
    const rows = inferences.map((inf) => ({
      zone_id: zoneId,
      competitor_name: inf.competitor_name,
      has_coverage: inf.has_coverage,
      coverage_type: inf.coverage_type,
      confidence: 'inferred' as const,
      source: 'dfa_proxy',
      scraped_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from('competitor_zone_coverage')
      .upsert(rows, { onConflict: 'zone_id,competitor_name' });

    if (upsertError) {
      return {
        data: null,
        error: `Failed to upsert competitor coverage: ${upsertError.message}`,
      };
    }

    // 4. Compute weakness score via DB function
    const { data: scoreResult, error: scoreError } = await supabase.rpc(
      'compute_competitor_weakness_score',
      { p_zone_id: zoneId }
    );

    if (scoreError) {
      return {
        data: null,
        error: `Failed to compute weakness score: ${scoreError.message}`,
      };
    }

    const weaknessScore = typeof scoreResult === 'number' ? scoreResult : 100;

    // 5. Update sales_zones.competitor_weakness_score
    const { error: updateError } = await supabase
      .from('sales_zones')
      .update({ competitor_weakness_score: weaknessScore })
      .eq('id', zoneId);

    if (updateError) {
      return {
        data: null,
        error: `Failed to update zone weakness score: ${updateError.message}`,
      };
    }

    const competitorsMapped = inferences.filter((i) => i.has_coverage).length;

    return {
      data: {
        competitors_mapped: competitorsMapped,
        weakness_score: weaknessScore,
      },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

// =============================================================================
// Bulk Mapping
// =============================================================================

/**
 * Map competitor presence for all active zones using DFA proxy data.
 * Loops through each active zone and runs inferCompetitorPresenceFromDFA().
 */
export async function mapCompetitorsForAllZones(): Promise<
  ServiceResult<BulkMappingResult>
> {
  try {
    const supabase = await createClient();

    // Fetch all active zone IDs
    const { data: zones, error: zonesError } = await supabase
      .from('sales_zones')
      .select('id')
      .eq('status', 'active');

    if (zonesError) {
      return {
        data: null,
        error: `Failed to fetch active zones: ${zonesError.message}`,
      };
    }

    const allZones = zones ?? [];
    const errors: string[] = [];
    let zonesMapped = 0;

    for (const zone of allZones) {
      const result = await inferCompetitorPresenceFromDFA(zone.id);
      if (result.error) {
        errors.push(`Zone ${zone.id}: ${result.error}`);
      } else {
        zonesMapped++;
      }
    }

    return {
      data: {
        zones_mapped: zonesMapped,
        errors,
      },
      error: errors.length > 0 ? `${errors.length} zone(s) had errors` : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}

// =============================================================================
// Query
// =============================================================================

/**
 * Fetch competitor coverage summary for a specific zone.
 */
export async function getCompetitorSummaryForZone(
  zoneId: string
): Promise<ServiceResult<CompetitorSummary>> {
  try {
    const supabase = await createClient();

    const { data: rows, error: fetchError } = await supabase
      .from('competitor_zone_coverage')
      .select('competitor_name, has_coverage, coverage_type, confidence')
      .eq('zone_id', zoneId)
      .order('competitor_name');

    if (fetchError) {
      return {
        data: null,
        error: `Failed to fetch competitor coverage: ${fetchError.message}`,
      };
    }

    const competitors: CompetitorCoverage[] = (rows ?? []).map((r) => ({
      name: r.competitor_name,
      has_coverage: r.has_coverage ?? false,
      coverage_type: r.coverage_type ?? null,
      confidence: r.confidence ?? 'inferred',
    }));

    return {
      data: { competitors },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}
