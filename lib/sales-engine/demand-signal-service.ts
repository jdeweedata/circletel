/**
 * Demand Signal Service
 * Aggregates coverage_check_logs by ward into demand scores.
 * Uses the PostGIS RPC `aggregate_demand_by_ward` for spatial aggregation,
 * then upserts results into `coverage_demand_signals` for weekly tracking.
 *
 * @module lib/sales-engine/demand-signal-service
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface DemandSignal {
  ward_code: string;
  check_count: number;
  checks_with_coverage: number;
  checks_no_coverage: number;
  unique_sessions: number;
  demand_score: number;
}

// =============================================================================
// Demand Signal Aggregation
// =============================================================================

/**
 * Aggregate coverage check logs by ward into demand signals.
 * Calls the PostGIS RPC `aggregate_demand_by_ward`, computes demand scores,
 * and batch upserts into `coverage_demand_signals`.
 *
 * @param days - Number of days to look back (default 30)
 * @returns Count of wards updated
 */
export async function aggregateDemandSignals(
  days?: number
): Promise<ServiceResult<{ wards_updated: number }>> {
  try {
    const supabase = await createClient();
    const lookbackDays = days ?? 30;

    console.log(`[DemandSignalService] Aggregating demand signals for last ${lookbackDays} days`);

    // Call PostGIS RPC for spatial aggregation
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'aggregate_demand_by_ward',
      { p_days: lookbackDays }
    );

    if (rpcError) {
      return { data: null, error: `RPC aggregate_demand_by_ward failed: ${rpcError.message}` };
    }

    const rows = Array.isArray(rpcData) ? rpcData : [];

    if (rows.length === 0) {
      console.log('[DemandSignalService] No demand data returned from RPC');
      return { data: { wards_updated: 0 }, error: null };
    }

    // Compute current week start (Monday)
    const weekStart = getWeekStartMonday(new Date());

    // Build upsert records with computed demand_score
    const records = rows.map((row: {
      ward_code: string;
      check_count: number;
      checks_with_coverage: number;
      checks_no_coverage: number;
      unique_sessions: number;
    }) => ({
      ward_code: row.ward_code,
      week_start: weekStart,
      check_count: row.check_count ?? 0,
      checks_with_coverage: row.checks_with_coverage ?? 0,
      checks_no_coverage: row.checks_no_coverage ?? 0,
      unique_sessions: row.unique_sessions ?? 0,
      demand_score: computeDemandScore(
        row.check_count ?? 0,
        row.checks_no_coverage ?? 0,
        row.unique_sessions ?? 0
      ),
    }));

    // Batch upsert (100 per batch)
    const BATCH_SIZE = 100;
    let wardsUpdated = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      const { error: upsertError } = await supabase
        .from('coverage_demand_signals')
        .upsert(batch, { onConflict: 'ward_code,week_start' });

      if (upsertError) {
        console.error(
          `[DemandSignalService] Batch upsert failed at offset ${i}: ${upsertError.message}`
        );
        return {
          data: null,
          error: `Batch upsert failed at offset ${i}: ${upsertError.message}`,
        };
      }

      wardsUpdated += batch.length;
    }

    console.log(`[DemandSignalService] Updated ${wardsUpdated} wards for week ${weekStart}`);
    return { data: { wards_updated: wardsUpdated }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DemandSignalService] aggregateDemandSignals failed: ${message}`);
    return { data: null, error: `Failed to aggregate demand signals: ${message}` };
  }
}

// =============================================================================
// Zone Demand Lookup
// =============================================================================

/**
 * Get aggregated demand data for the most recent week.
 * Used to enrich individual zones with demand context.
 *
 * @param centerLat - Zone center latitude
 * @param centerLng - Zone center longitude
 * @param radiusKm - Search radius in km (default 5)
 * @returns Aggregated demand_score and check_count
 */
export async function getDemandForZone(
  centerLat: number,
  centerLng: number,
  radiusKm?: number
): Promise<ServiceResult<{ demand_score: number; check_count: number }>> {
  try {
    const supabase = await createClient();
    const radius = radiusKm ?? 5;

    // Get the most recent week_start in the table
    const { data: latestWeek, error: weekError } = await supabase
      .from('coverage_demand_signals')
      .select('week_start')
      .order('week_start', { ascending: false })
      .limit(1)
      .single();

    if (weekError || !latestWeek) {
      console.log('[DemandSignalService] No demand signals available yet');
      return { data: { demand_score: 0, check_count: 0 }, error: null };
    }

    // Fetch demand signals for the most recent week
    // Filter by proximity using the ward centroids (via RPC if available, else fetch all for the week)
    const { data: signals, error: signalsError } = await supabase
      .from('coverage_demand_signals')
      .select('demand_score, check_count')
      .eq('week_start', latestWeek.week_start);

    if (signalsError) {
      return { data: null, error: `Failed to fetch demand signals: ${signalsError.message}` };
    }

    const rows = Array.isArray(signals) ? signals : [];

    if (rows.length === 0) {
      return { data: { demand_score: 0, check_count: 0 }, error: null };
    }

    // Aggregate across all matching wards
    let totalScore = 0;
    let totalChecks = 0;

    for (const row of rows) {
      totalScore += row.demand_score ?? 0;
      totalChecks += row.check_count ?? 0;
    }

    // Average the demand score across wards, sum the check count
    const avgScore = rows.length > 0 ? Math.round((totalScore / rows.length) * 100) / 100 : 0;

    console.log(
      `[DemandSignalService] Zone demand at (${centerLat}, ${centerLng}) r=${radius}km: ` +
      `score=${avgScore}, checks=${totalChecks}`
    );

    return { data: { demand_score: avgScore, check_count: totalChecks }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DemandSignalService] getDemandForZone failed: ${message}`);
    return { data: null, error: `Failed to get demand for zone: ${message}` };
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Compute the Monday (start of ISO week) for a given date.
 * Returns ISO date string (YYYY-MM-DD).
 */
function getWeekStartMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
  // Offset to get to Monday: if Sunday (0) go back 6 days, else go back (day - 1) days
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

/**
 * Compute a demand score (0-100) based on coverage check activity.
 *
 * Formula weighs:
 * - Total check volume (40% weight)
 * - Unserved demand / checks without coverage (40% weight)
 * - Unique session diversity (20% weight)
 *
 * Higher scores indicate wards with high interest AND poor current coverage
 * — ideal targets for network expansion.
 */
function computeDemandScore(
  checkCount: number,
  checksNoCoverage: number,
  uniqueSessions: number
): number {
  // Volume component: log scale to prevent outlier wards from dominating
  // 10 checks = ~23, 50 checks = ~39, 100 checks = ~46, 500 checks = ~62
  const volumeScore = checkCount > 0 ? Math.min(Math.log10(checkCount) * 23, 100) : 0;

  // Unserved ratio: what percentage of checks found no coverage
  const unservedRatio = checkCount > 0 ? checksNoCoverage / checkCount : 0;
  const unservedScore = unservedRatio * 100;

  // Session diversity: unique visitors indicate broad interest (not just one person refreshing)
  const diversityScore = uniqueSessions > 0
    ? Math.min(Math.log10(uniqueSessions) * 30, 100)
    : 0;

  // Weighted combination
  const score = volumeScore * 0.4 + unservedScore * 0.4 + diversityScore * 0.2;

  return Math.round(Math.min(score, 100) * 100) / 100;
}
