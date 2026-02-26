# Feasibility Inngest Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add async parallel coverage checks to the feasibility system using Inngest.

**Architecture:** Event-driven pipeline with step-based execution. A single `feasibility/check.requested` event triggers parallel coverage checks across 4 providers (Tarana, MTN 5G/LTE, Internal Fibre, DFA). Results are aggregated and persisted to `coverage_leads.coverage_results`.

**Tech Stack:** Inngest, Next.js API routes, Supabase, TypeScript

---

## Task 1: Create Schema Migration

**Files:**
- Create: `supabase/migrations/20260226000001_add_feasibility_columns.sql`

**Step 1: Create the migration file**

```sql
-- Migration: Add feasibility columns to coverage_leads
-- Enables async coverage checks with requirements and results persistence

-- Requirements column: stores speed/budget/contention preferences
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  requirements JSONB DEFAULT '{}';

-- Coverage results column: persisted provider check results
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  coverage_results JSONB DEFAULT '[]';

-- Coverage check status for async tracking
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  coverage_check_status VARCHAR(20) DEFAULT 'pending';

-- Add check constraint for valid statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coverage_leads_check_status_check'
  ) THEN
    ALTER TABLE coverage_leads ADD CONSTRAINT coverage_leads_check_status_check
    CHECK (coverage_check_status IN ('pending', 'checking', 'complete', 'failed'));
  END IF;
END $$;

-- Index for filtering by check status
CREATE INDEX IF NOT EXISTS idx_coverage_leads_check_status
ON coverage_leads(coverage_check_status);

-- Index for finding stuck/old checks
CREATE INDEX IF NOT EXISTS idx_coverage_leads_check_status_updated
ON coverage_leads(coverage_check_status, updated_at)
WHERE coverage_check_status IN ('pending', 'checking');

-- Comment for documentation
COMMENT ON COLUMN coverage_leads.requirements IS 'JSONB: {bandwidth_mbps, budget_max, contention, failover_needed, sla_required}';
COMMENT ON COLUMN coverage_leads.coverage_results IS 'JSONB array: [{technology, provider, is_feasible, confidence, checked_at}]';
COMMENT ON COLUMN coverage_leads.coverage_check_status IS 'Async check status: pending, checking, complete, failed';
```

**Step 2: Apply migration to Supabase**

Run:
```bash
npx supabase db push --linked
```

Expected: Migration applied successfully.

**Step 3: Verify migration**

Run:
```bash
npx supabase db dump --linked --schema public | grep -A5 'coverage_check_status'
```

Expected: Shows the new column with VARCHAR(20) type.

**Step 4: Commit**

```bash
git add supabase/migrations/20260226000001_add_feasibility_columns.sql
git commit -m "feat(db): add feasibility columns to coverage_leads

- requirements JSONB for speed/budget/contention preferences
- coverage_results JSONB for persisted check results
- coverage_check_status for async tracking
- Indexes for status filtering"
```

---

## Task 2: Add Feasibility Event Types to Inngest Client

**Files:**
- Modify: `lib/inngest/client.ts:113-133` (add event types)

**Step 1: Add event type definitions**

Add after line 121 (after `TaranaSyncCancelledEvent`):

```typescript
// =============================================================================
// FEASIBILITY CHECK EVENTS
// =============================================================================

export type FeasibilityCheckRequestedEvent = {
  name: 'feasibility/check.requested';
  data: {
    lead_id: string;
    coordinates: { lat: number; lng: number };
    requirements?: {
      bandwidth_mbps?: number;
      budget_max?: number;
      contention?: 'best-effort' | '10:1' | 'dia';
      failover_needed?: boolean;
      sla_required?: string;
    };
    triggered_by?: 'api' | 'admin' | 'partner';
    user_id?: string;
  };
};

export type FeasibilityCheckCompletedEvent = {
  name: 'feasibility/check.completed';
  data: {
    lead_id: string;
    results: Array<{
      technology: string;
      provider: string;
      is_feasible: boolean;
      confidence: 'high' | 'medium' | 'low';
      checked_at: string;
    }>;
    duration_ms: number;
    is_feasible: boolean;
    best_technology?: string;
  };
};

export type FeasibilityCheckFailedEvent = {
  name: 'feasibility/check.failed';
  data: {
    lead_id: string;
    error: string;
    attempt: number;
  };
};

export type FeasibilityCheckCancelledEvent = {
  name: 'feasibility/check.cancelled';
  data: {
    lead_id: string;
    cancelled_by?: string;
    reason?: string;
  };
};
```

**Step 2: Update InngestEvents union type**

Replace the `InngestEvents` type (around line 124) with:

```typescript
// Union type for all events
export type InngestEvents = {
  'competitor/scrape.requested': CompetitorScrapeEvent;
  'competitor/scrape.completed': CompetitorScrapeCompleteEvent;
  'competitor/scrape.failed': CompetitorScrapeFailedEvent;
  'competitor/price.alert': PriceAlertEvent;
  'tarana/sync.requested': TaranaSyncRequestedEvent;
  'tarana/sync.completed': TaranaSyncCompletedEvent;
  'tarana/sync.failed': TaranaSyncFailedEvent;
  'tarana/sync.cancelled': TaranaSyncCancelledEvent;
  // Feasibility check events
  'feasibility/check.requested': FeasibilityCheckRequestedEvent;
  'feasibility/check.completed': FeasibilityCheckCompletedEvent;
  'feasibility/check.failed': FeasibilityCheckFailedEvent;
  'feasibility/check.cancelled': FeasibilityCheckCancelledEvent;
};
```

**Step 3: Type check**

Run:
```bash
npm run type-check:memory
```

Expected: No errors.

**Step 4: Commit**

```bash
git add lib/inngest/client.ts
git commit -m "feat(inngest): add feasibility check event types

- FeasibilityCheckRequestedEvent with coordinates/requirements
- FeasibilityCheckCompletedEvent with results array
- FeasibilityCheckFailedEvent and CancelledEvent
- Update InngestEvents union"
```

---

## Task 3: Create Feasibility Check Inngest Function

**Files:**
- Create: `lib/inngest/functions/feasibility-check.ts`

**Step 1: Create the function file**

```typescript
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
    const { lead_id, coordinates, requirements, triggered_by, user_id } = event.data;
    const startTime = Date.now();
    const errors: string[] = [];

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
    const proximity = await checkBaseStationProximity(coordinates.lat, coordinates.lng);

    if (proximity && proximity.inRange) {
      return {
        provider: 'Tarana',
        technology: 'fixed_wireless',
        success: true,
        result: {
          technology: 'fixed_wireless',
          provider: 'Tarana',
          is_feasible: true,
          confidence: proximity.signalQuality === 'excellent' ? 'high' : 'medium',
          max_speed_mbps: proximity.estimatedSpeed || 100,
          distance_m: proximity.distance,
          signal_strength: proximity.signalQuality,
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
      (s) => s.type === '5g' && s.available
    );
    const isLteAvailable = mtnProvider?.services?.some(
      (s) => s.type === 'lte' && s.available
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
    const dfaResult = await dfaCoverageClient.checkCoverage(coordinates);

    return {
      provider: 'DFA',
      technology: 'fibre',
      success: true,
      result: {
        technology: 'fibre',
        provider: 'DFA',
        is_feasible: dfaResult.available,
        confidence: dfaResult.confidence || 'medium',
        distance_m: dfaResult.metadata?.distance,
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
```

**Step 2: Type check**

Run:
```bash
npm run type-check:memory
```

Expected: No errors (or minor import path issues to fix).

**Step 3: Commit**

```bash
git add lib/inngest/functions/feasibility-check.ts
git commit -m "feat(inngest): add feasibility check function

- Parallel provider checks (Tarana, MTN, Fibre, DFA)
- Step-based execution for reliability
- Results persistence to coverage_leads
- Completion and failure handlers
- Cancellation support"
```

---

## Task 4: Update Inngest Index Exports

**Files:**
- Modify: `lib/inngest/index.ts`

**Step 1: Add exports for new functions**

Replace entire file with:

```typescript
/**
 * Inngest Functions Index
 *
 * Exports all Inngest functions for registration with the serve handler.
 */

export { inngest } from './client';
export type { InngestEvents } from './client';

// Import all functions
export {
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
} from './functions/competitor-scrape';

export {
  taranaSyncFunction,
  taranaSyncCompletedFunction,
  taranaSyncFailedFunction,
} from './functions/tarana-sync';

export {
  feasibilityCheckFunction,
  feasibilityCheckCompletedFunction,
  feasibilityCheckFailedFunction,
} from './functions/feasibility-check';

// Collect all functions for the serve handler
import {
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
} from './functions/competitor-scrape';

import {
  taranaSyncFunction,
  taranaSyncCompletedFunction,
  taranaSyncFailedFunction,
} from './functions/tarana-sync';

import {
  feasibilityCheckFunction,
  feasibilityCheckCompletedFunction,
  feasibilityCheckFailedFunction,
} from './functions/feasibility-check';

export const functions = [
  // Competitor analysis
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
  // Tarana sync
  taranaSyncFunction,
  taranaSyncCompletedFunction,
  taranaSyncFailedFunction,
  // Feasibility checks
  feasibilityCheckFunction,
  feasibilityCheckCompletedFunction,
  feasibilityCheckFailedFunction,
];
```

**Step 2: Type check**

Run:
```bash
npm run type-check:memory
```

Expected: No errors.

**Step 3: Commit**

```bash
git add lib/inngest/index.ts
git commit -m "feat(inngest): export feasibility check functions

- Add feasibilityCheckFunction to exports
- Add completion and failure handlers
- Update functions array for serve handler"
```

---

## Task 5: Create API Trigger Endpoint

**Files:**
- Create: `app/api/coverage/check-async/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { apiLogger } from '@/lib/logging';

interface CheckAsyncRequest {
  leadId: string;
  requirements?: {
    bandwidth_mbps?: number;
    budget_max?: number;
    contention?: 'best-effort' | '10:1' | 'dia';
    failover_needed?: boolean;
    sla_required?: string;
  };
}

interface CheckAsyncResponse {
  success: boolean;
  eventId?: string;
  leadId?: string;
  message?: string;
  error?: string;
}

/**
 * POST /api/coverage/check-async
 *
 * Trigger an async feasibility coverage check via Inngest.
 * Returns immediately with an event ID for tracking.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CheckAsyncResponse>> {
  try {
    const body = (await request.json()) as CheckAsyncRequest;
    const { leadId, requirements } = body;

    // Validate leadId
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch lead and validate it exists
    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .select('id, coordinates, coverage_check_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      apiLogger.error('[check-async] Lead not found', { leadId, error: leadError?.message });
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check for coordinates
    if (!lead.coordinates) {
      return NextResponse.json(
        { success: false, error: 'Lead has no coordinates. Geocode address first.' },
        { status: 400 }
      );
    }

    // Prevent duplicate concurrent checks
    if (lead.coverage_check_status === 'checking') {
      return NextResponse.json(
        { success: false, error: 'Coverage check already in progress' },
        { status: 409 }
      );
    }

    // Extract coordinates (handle both formats)
    let coordinates: { lat: number; lng: number };
    if (lead.coordinates.type === 'Point' && Array.isArray(lead.coordinates.coordinates)) {
      coordinates = {
        lng: lead.coordinates.coordinates[0],
        lat: lead.coordinates.coordinates[1],
      };
    } else if (lead.coordinates.lat && lead.coordinates.lng) {
      coordinates = {
        lat: lead.coordinates.lat,
        lng: lead.coordinates.lng,
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates format' },
        { status: 400 }
      );
    }

    // Send Inngest event
    const { ids } = await inngest.send({
      name: 'feasibility/check.requested',
      data: {
        lead_id: leadId,
        coordinates,
        requirements,
        triggered_by: 'api',
      },
    });

    apiLogger.info('[check-async] Triggered feasibility check', {
      leadId,
      eventId: ids[0],
      coordinates,
    });

    return NextResponse.json({
      success: true,
      eventId: ids[0],
      leadId,
      message: 'Coverage check started. Poll coverage_check_status for progress.',
    });
  } catch (error) {
    apiLogger.error('[check-async] Error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/coverage/check-async?leadId=xxx
 *
 * Get the current status of a coverage check.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: lead, error } = await supabase
      .from('coverage_leads')
      .select('id, coverage_check_status, coverage_results, checked_at')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      status: lead.coverage_check_status,
      results: lead.coverage_results,
      checkedAt: lead.checked_at,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 2: Type check**

Run:
```bash
npm run type-check:memory
```

Expected: No errors.

**Step 3: Commit**

```bash
git add app/api/coverage/check-async/route.ts
git commit -m "feat(api): add async coverage check endpoint

POST /api/coverage/check-async - trigger check
GET /api/coverage/check-async - poll status

- Validates lead exists with coordinates
- Prevents duplicate concurrent checks
- Returns Inngest event ID for tracking"
```

---

## Task 6: Verify Build and Test Locally

**Files:**
- None (testing only)

**Step 1: Run type check**

Run:
```bash
npm run type-check:memory
```

Expected: 0 errors.

**Step 2: Run build**

Run:
```bash
npm run build:memory
```

Expected: Build succeeds.

**Step 3: Start dev server**

Run:
```bash
npm run dev:memory
```

Expected: Server starts on localhost:3000.

**Step 4: Test API endpoint (manual)**

```bash
# Create a test lead first or use existing
curl -X POST http://localhost:3000/api/coverage/check-async \
  -H "Content-Type: application/json" \
  -d '{"leadId": "<existing-lead-id>"}'
```

Expected: `{"success":true,"eventId":"...","leadId":"...","message":"Coverage check started..."}`

**Step 5: Commit (final)**

```bash
git add -A
git commit -m "chore: verify feasibility inngest pipeline build

All type checks pass. Build succeeds.
Ready for Inngest dashboard testing."
```

---

## Summary

| Task | Description | Files | Commits |
|------|-------------|-------|---------|
| 1 | Schema migration | `supabase/migrations/20260226000001_add_feasibility_columns.sql` | 1 |
| 2 | Event types | `lib/inngest/client.ts` | 1 |
| 3 | Inngest function | `lib/inngest/functions/feasibility-check.ts` | 1 |
| 4 | Index exports | `lib/inngest/index.ts` | 1 |
| 5 | API endpoint | `app/api/coverage/check-async/route.ts` | 1 |
| 6 | Build verification | - | 1 |

**Total: 6 tasks, 6 commits**

---

## Post-Implementation Testing

After deploying to staging:

1. **Inngest Dashboard**: Visit `https://app.inngest.com/` to see registered functions
2. **Trigger Test Event**: Use Inngest dashboard or API to send `feasibility/check.requested`
3. **Monitor Steps**: Watch step-by-step execution in Inngest dashboard
4. **Verify Database**: Check `coverage_leads` for updated `coverage_results`

---

## Future Enhancements (Out of Scope)

- Partner self-service portal (`/feasibility/*` routes)
- Real-time progress with Supabase subscriptions
- PDF quote generation
- WhatsApp notifications
- Batch processing cron trigger
