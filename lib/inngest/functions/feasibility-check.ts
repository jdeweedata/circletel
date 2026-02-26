/**
 * Feasibility Coverage Check Inngest Function
 *
 * Performs async parallel coverage checks across multiple providers:
 * - Tarana (fixed wireless)
 * - MTN 5G/LTE
 * - Internal fibre database
 * - DFA Fibre API
 *
 * Features:
 * - Step-based execution for reliability and resumability
 * - Automatic retries (3 attempts)
 * - Cancellation support
 * - Progress tracking via coverage_check_status column
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';
import { checkBaseStationProximity } from '@/lib/coverage/mtn/base-station-service';
import { dfaCoverageClient } from '@/lib/coverage/providers/dfa';
import type { Coordinates, CoverageProvider } from '@/lib/coverage/types';

// =============================================================================
// TYPES
// =============================================================================

interface CoverageResult {
  technology: string;
  provider: string;
  is_feasible: boolean;
  confidence: 'high' | 'medium' | 'low';
  max_speed_mbps?: number;
  distance_m?: number;
  signal_strength?: string;
  checked_at: string;
  error?: string;
}

interface ProviderCheckResult {
  provider: string;
  technology: string;
  success: boolean;
  result?: CoverageResult;
  error?: string;
}

// =============================================================================
// MAIN FEASIBILITY CHECK FUNCTION
// =============================================================================

export const feasibilityCheckFunction = inngest.createFunction(
  {
    id: 'feasibility-check',
    name: 'Feasibility Coverage Check',
    retries: 3,
    cancelOn: [
      {
        event: 'feasibility/check.cancelled',
        match: 'data.lead_id',
      },
    ],
  },
  { event: 'feasibility/check.requested' },
  async ({ event, step }) => {
    const { lead_id, coordinates, requirements } = event.data;
    const startTime = Date.now();

    // Step 1: Update lead status to 'checking'
    await step.run('update-status-checking', async () => {
      const supabase = await createClient();

      const { error } = await supabase
        .from('coverage_leads')
        .update({
          coverage_check_status: 'checking',
          requirements: requirements || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id);

      if (error) {
        console.error('[FeasibilityCheck] Failed to update status:', error);
        throw new Error(`Failed to update lead status: ${error.message}`);
      }

      console.log(`[FeasibilityCheck] Started check for lead ${lead_id}`);
    });

    // Step 2: Run parallel provider checks
    const providerResults = await step.run('parallel-provider-checks', async () => {
      const coords: Coordinates = coordinates;
      const results: ProviderCheckResult[] = [];

      // Run all checks in parallel
      const [taranaResult, mtnResult, fibreResult, dfaResult] = await Promise.allSettled([
        // Tarana fixed wireless check
        checkTarana(coords),
        // MTN 5G/LTE check
        checkMTN(coords),
        // Internal fibre database check
        checkFibre(coords),
        // DFA Fibre API check
        checkDFA(coords),
      ]);

      // Process Tarana result
      if (taranaResult.status === 'fulfilled') {
        results.push(taranaResult.value);
      } else {
        results.push({
          provider: 'Tarana',
          technology: 'fixed_wireless',
          success: false,
          error: taranaResult.reason?.message || 'Unknown error',
        });
      }

      // Process MTN result
      if (mtnResult.status === 'fulfilled') {
        results.push(mtnResult.value);
      } else {
        results.push({
          provider: 'MTN',
          technology: '5g_lte',
          success: false,
          error: mtnResult.reason?.message || 'Unknown error',
        });
      }

      // Process Fibre result
      if (fibreResult.status === 'fulfilled') {
        results.push(fibreResult.value);
      } else {
        results.push({
          provider: 'CircleTel',
          technology: 'fibre',
          success: false,
          error: fibreResult.reason?.message || 'Unknown error',
        });
      }

      // Process DFA result
      if (dfaResult.status === 'fulfilled') {
        results.push(dfaResult.value);
      } else {
        results.push({
          provider: 'DFA',
          technology: 'fibre',
          success: false,
          error: dfaResult.reason?.message || 'Unknown error',
        });
      }

      return results;
    });

    // Step 3: Aggregate results
    const aggregatedResults = await step.run('aggregate-results', async () => {
      const coverageResults: CoverageResult[] = [];

      for (const pr of providerResults) {
        if (pr.success && pr.result) {
          coverageResults.push(pr.result);
        } else {
          // Record failed check
          coverageResults.push({
            technology: pr.technology,
            provider: pr.provider,
            is_feasible: false,
            confidence: 'low',
            checked_at: new Date().toISOString(),
            error: pr.error,
          });
        }
      }

      // Sort by feasibility and confidence
      coverageResults.sort((a, b) => {
        if (a.is_feasible !== b.is_feasible) return a.is_feasible ? -1 : 1;
        const confOrder = { high: 0, medium: 1, low: 2 };
        return confOrder[a.confidence] - confOrder[b.confidence];
      });

      return coverageResults;
    });

    // Step 4: Persist results to database
    const duration = Date.now() - startTime;
    const isFeasible = aggregatedResults.some((r) => r.is_feasible);
    const bestTechnology = aggregatedResults.find((r) => r.is_feasible)?.technology;

    await step.run('persist-results', async () => {
      const supabase = await createClient();

      const { error } = await supabase
        .from('coverage_leads')
        .update({
          coverage_results: aggregatedResults,
          coverage_check_status: 'complete',
          coverage_available: isFeasible,
          available_services: aggregatedResults
            .filter((r) => r.is_feasible)
            .map((r) => r.technology),
          checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id);

      if (error) {
        console.error('[FeasibilityCheck] Failed to persist results:', error);
        throw new Error(`Failed to persist results: ${error.message}`);
      }

      console.log(
        `[FeasibilityCheck] Complete for lead ${lead_id}: ` +
          `${aggregatedResults.filter((r) => r.is_feasible).length}/${aggregatedResults.length} feasible (${duration}ms)`
      );
    });

    // Step 5: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'feasibility/check.completed',
        data: {
          lead_id,
          results: aggregatedResults,
          duration_ms: duration,
          is_feasible: isFeasible,
          best_technology: bestTechnology,
        },
      });
    });

    return {
      success: true,
      lead_id,
      results: aggregatedResults,
      duration_ms: duration,
      is_feasible: isFeasible,
      best_technology: bestTechnology,
    };
  }
);

// =============================================================================
// PROVIDER CHECK FUNCTIONS
// =============================================================================

async function checkTarana(coordinates: Coordinates): Promise<ProviderCheckResult> {
  try {
    const proximity = await checkBaseStationProximity(coordinates);

    if (proximity && proximity.hasCoverage) {
      return {
        provider: 'Tarana',
        technology: 'fixed_wireless',
        success: true,
        result: {
          technology: 'fixed_wireless',
          provider: 'Tarana',
          is_feasible: true,
          confidence: proximity.confidence === 'high' ? 'high' : proximity.confidence === 'medium' ? 'medium' : 'low',
          max_speed_mbps: 100,
          distance_m: proximity.nearestStation ? proximity.nearestStation.distanceKm * 1000 : undefined,
          signal_strength: proximity.confidence,
          checked_at: new Date().toISOString(),
        },
      };
    }

    return {
      provider: 'Tarana',
      technology: 'fixed_wireless',
      success: true,
      result: {
        technology: 'fixed_wireless',
        provider: 'Tarana',
        is_feasible: false,
        confidence: 'high',
        checked_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      provider: 'Tarana',
      technology: 'fixed_wireless',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkMTN(coordinates: Coordinates): Promise<ProviderCheckResult> {
  try {
    const coverage = await coverageAggregationService.aggregateCoverage(coordinates, {
      providers: ['mtn'] as CoverageProvider[],
    });

    const mtnProvider = coverage.providers?.mtn;
    const is5gAvailable = mtnProvider?.services?.some(
      (s: { type: string; available: boolean }) => s.type === '5g' && s.available
    );
    const isLteAvailable = mtnProvider?.services?.some(
      (s: { type: string; available: boolean }) => s.type === 'lte' && s.available
    );

    const technology = is5gAvailable ? '5g' : isLteAvailable ? 'lte' : '5g_lte';
    const isFeasible = is5gAvailable || isLteAvailable;

    return {
      provider: 'MTN',
      technology,
      success: true,
      result: {
        technology,
        provider: 'MTN',
        is_feasible: isFeasible,
        confidence: mtnProvider?.confidence || 'medium',
        checked_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      provider: 'MTN',
      technology: '5g_lte',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkFibre(coordinates: Coordinates): Promise<ProviderCheckResult> {
  try {
    const supabase = await createClient();

    // Check PostGIS coverage areas
    const { data, error } = await supabase.rpc('check_coverage_at_point', {
      lat: coordinates.lat,
      lng: coordinates.lng,
    });

    if (error) throw error;

    const fibreAreas = data?.filter(
      (area: { service_type: string }) =>
        area.service_type === 'HomeFibreConnect' ||
        area.service_type === 'BizFibreConnect'
    );

    if (fibreAreas && fibreAreas.length > 0) {
      return {
        provider: 'CircleTel',
        technology: 'fibre',
        success: true,
        result: {
          technology: 'fibre',
          provider: 'CircleTel',
          is_feasible: true,
          confidence: 'high',
          checked_at: new Date().toISOString(),
        },
      };
    }

    return {
      provider: 'CircleTel',
      technology: 'fibre',
      success: true,
      result: {
        technology: 'fibre',
        provider: 'CircleTel',
        is_feasible: false,
        confidence: 'high',
        checked_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      provider: 'CircleTel',
      technology: 'fibre',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkDFA(coordinates: Coordinates): Promise<ProviderCheckResult> {
  try {
    const dfaResult = await dfaCoverageClient.checkCoverage({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });

    return {
      provider: 'DFA',
      technology: 'fibre',
      success: true,
      result: {
        technology: 'fibre',
        provider: 'DFA',
        is_feasible: dfaResult.hasCoverage,
        confidence: dfaResult.hasCoverage ? 'high' : 'medium',
        distance_m: dfaResult.nearNetDetails?.distance,
        checked_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      provider: 'DFA',
      technology: 'fibre',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

export const feasibilityCheckCompletedFunction = inngest.createFunction(
  {
    id: 'feasibility-check-completed',
    name: 'Feasibility Check Completed Handler',
  },
  { event: 'feasibility/check.completed' },
  async ({ event, step }) => {
    const { lead_id, is_feasible, best_technology, duration_ms } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[FeasibilityCheck] Check completed for ${lead_id}: ` +
          `feasible=${is_feasible}, best=${best_technology}, duration=${duration_ms}ms`
      );

      // TODO: Send notification if high-value lead
      // TODO: Trigger quote generation if auto-quote enabled
    });

    return { logged: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

export const feasibilityCheckFailedFunction = inngest.createFunction(
  {
    id: 'feasibility-check-failed',
    name: 'Feasibility Check Failed Handler',
  },
  { event: 'feasibility/check.failed' },
  async ({ event, step }) => {
    const { lead_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(`[FeasibilityCheck] Failed for ${lead_id} (attempt ${attempt}): ${error}`);

      const supabase = await createClient();

      // Update lead status to failed
      await supabase
        .from('coverage_leads')
        .update({
          coverage_check_status: 'failed',
          coverage_results: [{ error, attempt, failed_at: new Date().toISOString() }],
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id);
    });

    return { handled: true };
  }
);
