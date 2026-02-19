# Inngest Tarana Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Tarana base station sync from Vercel cron to Inngest with automatic retries, observability, and manual trigger capability.

**Architecture:** Replace existing `/api/cron/tarana-sync` with an Inngest function that triggers on both cron schedule (midnight) and manual events. Add sync logs table for audit trail and status API for UI polling.

**Tech Stack:** Inngest, Next.js 15, Supabase, TypeScript

---

## Task 1: Create Database Migration

**Files:**
- Create: `supabase/migrations/20260219000001_create_tarana_sync_logs.sql`

**Step 1: Write the migration**

```sql
-- Create tarana_sync_logs table for tracking sync operations
CREATE TABLE tarana_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  trigger_type TEXT NOT NULL DEFAULT 'cron'
    CHECK (trigger_type IN ('cron', 'manual')),
  triggered_by UUID REFERENCES admin_users(id),

  -- Results
  stations_fetched INTEGER DEFAULT 0,
  inserted INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0,

  -- Error tracking
  errors JSONB DEFAULT '[]'::jsonb,
  attempt INTEGER DEFAULT 1,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recent logs query (used by status API)
CREATE INDEX idx_tarana_sync_logs_created
  ON tarana_sync_logs(created_at DESC);

-- Index for finding running syncs
CREATE INDEX idx_tarana_sync_logs_status
  ON tarana_sync_logs(status)
  WHERE status IN ('pending', 'running');

-- RLS: Admin only
ALTER TABLE tarana_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON tarana_sync_logs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Service role bypass for Inngest functions
CREATE POLICY "Service role access" ON tarana_sync_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE tarana_sync_logs IS 'Audit log for Tarana base station sync operations';
```

**Step 2: Apply migration to Supabase**

Run: `npx supabase db push` or apply via Supabase MCP tool

Expected: Table created successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260219000001_create_tarana_sync_logs.sql
git commit -m "feat(db): add tarana_sync_logs table for sync audit trail"
```

---

## Task 2: Add Inngest Event Types

**Files:**
- Modify: `lib/inngest/client.ts`

**Step 1: Read current file**

Check existing event types pattern in the file.

**Step 2: Add Tarana event types**

Add after existing event types (around line 83):

```typescript
// =============================================================================
// TARANA SYNC EVENTS
// =============================================================================

export type TaranaSyncRequestedEvent = {
  name: 'tarana/sync.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    admin_user_id?: string;
    sync_log_id: string;
    options?: {
      deleteStale?: boolean;
      dryRun?: boolean;
    };
  };
};

export type TaranaSyncCompletedEvent = {
  name: 'tarana/sync.completed';
  data: {
    sync_log_id: string;
    inserted: number;
    updated: number;
    deleted: number;
    duration_ms: number;
  };
};

export type TaranaSyncFailedEvent = {
  name: 'tarana/sync.failed';
  data: {
    sync_log_id: string;
    error: string;
    attempt: number;
  };
};
```

**Step 3: Update InngestEvents union type**

Update the union type to include new events:

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
};
```

**Step 4: Run type check**

Run: `npm run type-check:memory 2>&1 | grep -i inngest`

Expected: No errors related to Inngest types

**Step 5: Commit**

```bash
git add lib/inngest/client.ts
git commit -m "feat(inngest): add Tarana sync event types"
```

---

## Task 3: Create Inngest Tarana Sync Function

**Files:**
- Create: `lib/inngest/functions/tarana-sync.ts`

**Step 1: Create the function file**

```typescript
/**
 * Tarana Base Station Sync - Inngest Function
 *
 * Syncs base station data from Tarana Portal API to database.
 * Replaces the old Vercel cron endpoint with:
 * - Automatic retries (3x with exponential backoff)
 * - Step-based execution for reliability
 * - Dual triggers: cron (midnight) + manual event
 * - Full observability via Inngest dashboard
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { getAllBaseNodes } from '@/lib/tarana/client';

// =============================================================================
// TARANA SYNC FUNCTION
// =============================================================================

export const taranaSyncFunction = inngest.createFunction(
  {
    id: 'tarana-sync',
    name: 'Tarana Base Station Sync',
    retries: 3,
    // Cancel if new sync requested while running
    cancelOn: [
      {
        event: 'tarana/sync.cancelled',
        match: 'data.sync_log_id',
      },
    ],
  },
  [
    // Trigger 1: Daily at midnight SAST (22:00 UTC previous day)
    { cron: '0 22 * * *' },
    // Trigger 2: Manual event
    { event: 'tarana/sync.requested' },
  ],
  async ({ event, step }) => {
    const supabase = await createClient();
    const startTime = Date.now();

    // Determine trigger type and options
    const isCronTrigger = !event?.data?.sync_log_id;
    const triggerType = isCronTrigger ? 'cron' : 'manual';
    const options = event?.data?.options || {};

    // Step 1: Create or get sync log
    const syncLog = await step.run('create-sync-log', async () => {
      if (isCronTrigger) {
        // Cron trigger - create new log
        const { data, error } = await supabase
          .from('tarana_sync_logs')
          .insert({
            status: 'running',
            trigger_type: 'cron',
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw new Error(`Failed to create sync log: ${error.message}`);
        return { id: data.id, isNew: true };
      } else {
        // Manual trigger - update existing log
        const { error } = await supabase
          .from('tarana_sync_logs')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', event.data.sync_log_id);

        if (error) throw new Error(`Failed to update sync log: ${error.message}`);
        return { id: event.data.sync_log_id, isNew: false };
      }
    });

    console.log(`[Inngest] Starting Tarana sync (${triggerType}) - Log ID: ${syncLog.id}`);

    // Step 2: Fetch base nodes from Tarana API
    const baseNodes = await step.run('fetch-base-nodes', async () => {
      console.log('[Inngest] Fetching base nodes from Tarana API...');
      const nodes = await getAllBaseNodes();
      console.log(`[Inngest] Fetched ${nodes.length} base nodes`);

      // Update sync log with fetch count
      await supabase
        .from('tarana_sync_logs')
        .update({ stations_fetched: nodes.length })
        .eq('id', syncLog.id);

      return nodes;
    });

    // Step 3: Check for dry run
    if (options.dryRun) {
      await step.run('dry-run-complete', async () => {
        await supabase
          .from('tarana_sync_logs')
          .update({
            status: 'completed',
            inserted: baseNodes.length,
            updated: 0,
            deleted: 0,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            errors: JSON.stringify(['DRY RUN - No changes made']),
          })
          .eq('id', syncLog.id);
      });

      return {
        success: true,
        dryRun: true,
        sync_log_id: syncLog.id,
        stations_fetched: baseNodes.length,
      };
    }

    // Step 4: Get existing records
    const existingSerials = await step.run('get-existing-records', async () => {
      const { data } = await supabase
        .from('tarana_base_stations')
        .select('serial_number');

      return new Set(data?.map((e) => e.serial_number) || []);
    });

    // Step 5: Upsert records
    const upsertResult = await step.run('upsert-records', async () => {
      let inserted = 0;
      let updated = 0;
      const errors: string[] = [];
      const apiSerials = new Set<string>();

      for (const bn of baseNodes) {
        if (!bn.serialNumber || !bn.latitude || !bn.longitude) {
          errors.push(`Skipping BN with missing data: ${bn.serialNumber || 'unknown'}`);
          continue;
        }

        apiSerials.add(bn.serialNumber);

        const record = {
          serial_number: bn.serialNumber,
          hostname: bn.deviceId || bn.serialNumber,
          site_name: bn.siteName || 'Unknown Site',
          active_connections: 0,
          market: bn.marketName || 'Unknown',
          lat: bn.latitude,
          lng: bn.longitude,
          region: bn.regionName || 'South Africa',
          last_updated: new Date().toISOString(),
        };

        try {
          if (existingSerials.has(bn.serialNumber)) {
            const { error } = await supabase
              .from('tarana_base_stations')
              .update(record)
              .eq('serial_number', bn.serialNumber);

            if (error) {
              errors.push(`Update failed for ${bn.serialNumber}: ${error.message}`);
            } else {
              updated++;
            }
          } else {
            const { error } = await supabase
              .from('tarana_base_stations')
              .insert(record);

            if (error) {
              errors.push(`Insert failed for ${bn.serialNumber}: ${error.message}`);
            } else {
              inserted++;
            }
          }
        } catch (err) {
          errors.push(`Error processing ${bn.serialNumber}: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
      }

      return { inserted, updated, errors, apiSerials: Array.from(apiSerials) };
    });

    // Step 6: Optionally delete stale records
    let deleted = 0;
    if (options.deleteStale) {
      deleted = await step.run('delete-stale-records', async () => {
        const staleSerials = [...existingSerials].filter(
          (s) => !upsertResult.apiSerials.includes(s)
        );

        if (staleSerials.length > 0) {
          const { error } = await supabase
            .from('tarana_base_stations')
            .delete()
            .in('serial_number', staleSerials);

          if (error) {
            console.error('[Inngest] Delete stale failed:', error.message);
            return 0;
          }
          return staleSerials.length;
        }
        return 0;
      });
    }

    // Step 7: Update sync log with final results
    const duration = Date.now() - startTime;
    await step.run('update-sync-log', async () => {
      await supabase
        .from('tarana_sync_logs')
        .update({
          status: 'completed',
          inserted: upsertResult.inserted,
          updated: upsertResult.updated,
          deleted,
          errors: upsertResult.errors.length > 0 ? upsertResult.errors : null,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', syncLog.id);
    });

    // Step 8: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'tarana/sync.completed',
        data: {
          sync_log_id: syncLog.id,
          inserted: upsertResult.inserted,
          updated: upsertResult.updated,
          deleted,
          duration_ms: duration,
        },
      });
    });

    console.log(
      `[Inngest] Tarana sync completed: ${upsertResult.inserted} inserted, ` +
        `${upsertResult.updated} updated, ${deleted} deleted (${duration}ms)`
    );

    return {
      success: true,
      sync_log_id: syncLog.id,
      inserted: upsertResult.inserted,
      updated: upsertResult.updated,
      deleted,
      duration_ms: duration,
      errors: upsertResult.errors,
    };
  }
);
```

**Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | grep -E "(tarana-sync|error)"`

Expected: No type errors

**Step 3: Commit**

```bash
git add lib/inngest/functions/tarana-sync.ts
git commit -m "feat(inngest): add Tarana sync function with retries and step-based execution"
```

---

## Task 4: Register Inngest Function

**Files:**
- Modify: `lib/inngest/index.ts`

**Step 1: Add import and export**

```typescript
// Import all functions
export {
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
} from './functions/competitor-scrape';

// ADD THIS:
export { taranaSyncFunction } from './functions/tarana-sync';
```

**Step 2: Add to functions array**

```typescript
import {
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
} from './functions/competitor-scrape';

// ADD THIS:
import { taranaSyncFunction } from './functions/tarana-sync';

export const functions = [
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
  taranaSyncFunction, // ADD THIS
];
```

**Step 3: Run type check**

Run: `npm run type-check:memory 2>&1 | grep inngest`

Expected: No errors

**Step 4: Commit**

```bash
git add lib/inngest/index.ts
git commit -m "feat(inngest): register taranaSyncFunction"
```

---

## Task 5: Create Manual Trigger API

**Files:**
- Create: `app/api/admin/tarana/sync/route.ts`

**Step 1: Create the API route**

```typescript
/**
 * Admin API: Trigger Tarana Sync
 *
 * POST /api/admin/tarana/sync
 * Body: { dryRun?: boolean, deleteStale?: boolean }
 *
 * Returns: { success: boolean, sync_log_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest';
import { apiLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse options
    let options = { dryRun: false, deleteStale: false };
    try {
      const body = await request.json();
      options.dryRun = body.dryRun === true;
      options.deleteStale = body.deleteStale === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Check for already running sync
    const { data: runningSync } = await supabase
      .from('tarana_sync_logs')
      .select('id')
      .in('status', ['pending', 'running'])
      .limit(1)
      .single();

    if (runningSync) {
      return NextResponse.json(
        {
          success: false,
          error: 'A sync is already in progress',
          sync_log_id: runningSync.id,
        },
        { status: 409 }
      );
    }

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from('tarana_sync_logs')
      .insert({
        status: 'pending',
        trigger_type: 'manual',
        triggered_by: user.id,
      })
      .select('id')
      .single();

    if (logError || !syncLog) {
      apiLogger.error('[Tarana Sync] Failed to create sync log:', logError);
      return NextResponse.json(
        { success: false, error: 'Failed to create sync log' },
        { status: 500 }
      );
    }

    // Send Inngest event
    await inngest.send({
      name: 'tarana/sync.requested',
      data: {
        triggered_by: 'manual',
        admin_user_id: user.id,
        sync_log_id: syncLog.id,
        options,
      },
    });

    apiLogger.info('[Tarana Sync] Manual sync triggered', {
      sync_log_id: syncLog.id,
      triggered_by: user.id,
      options,
    });

    return NextResponse.json({
      success: true,
      sync_log_id: syncLog.id,
      message: 'Sync started',
    });
  } catch (error) {
    apiLogger.error('[Tarana Sync] Trigger error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | grep tarana`

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/admin/tarana/sync/route.ts
git commit -m "feat(api): add manual Tarana sync trigger endpoint"
```

---

## Task 6: Create Status Polling API

**Files:**
- Create: `app/api/admin/tarana/sync/status/route.ts`

**Step 1: Create the status API route**

```typescript
/**
 * Admin API: Tarana Sync Status
 *
 * GET /api/admin/tarana/sync/status
 * Query: ?id=<sync_log_id> (optional, returns latest if omitted)
 *
 * Returns: Sync log details with status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const syncLogId = searchParams.get('id');

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get specific sync log or latest
    let query = supabase
      .from('tarana_sync_logs')
      .select(`
        id,
        status,
        trigger_type,
        triggered_by,
        stations_fetched,
        inserted,
        updated,
        deleted,
        errors,
        attempt,
        started_at,
        completed_at,
        duration_ms,
        created_at
      `);

    if (syncLogId) {
      query = query.eq('id', syncLogId);
    } else {
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data: syncLog, error } = await query.single();

    if (error || !syncLog) {
      return NextResponse.json(
        { success: false, error: 'Sync log not found' },
        { status: 404 }
      );
    }

    // Get recent sync history (last 5)
    const { data: recentSyncs } = await supabase
      .from('tarana_sync_logs')
      .select('id, status, trigger_type, inserted, updated, deleted, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        current: syncLog,
        recent: recentSyncs || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | grep tarana`

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/admin/tarana/sync/status/route.ts
git commit -m "feat(api): add Tarana sync status polling endpoint"
```

---

## Task 7: Update Base Stations Page UI

**Files:**
- Modify: `app/admin/coverage/base-stations/page.tsx`

**Step 1: Add imports and state**

Add near top of file after existing imports:

```typescript
import { formatDistanceToNow } from 'date-fns';

// Add to component state
const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'running' | 'completed' | 'failed'>('idle');
const [lastSync, setLastSync] = useState<{
  id: string;
  status: string;
  inserted: number;
  updated: number;
  deleted: number;
  duration_ms: number;
  created_at: string;
} | null>(null);
const [syncPolling, setSyncPolling] = useState(false);
```

**Step 2: Add sync functions**

Add after existing functions:

```typescript
// Fetch last sync status
const fetchSyncStatus = useCallback(async () => {
  try {
    const response = await fetch('/api/admin/tarana/sync/status');
    const data = await response.json();
    if (data.success && data.data.current) {
      setLastSync(data.data.current);
      setSyncStatus(data.data.current.status);
      return data.data.current.status;
    }
  } catch (err) {
    console.error('Failed to fetch sync status:', err);
  }
  return null;
}, []);

// Trigger manual sync
const triggerSync = async () => {
  try {
    setSyncStatus('pending');
    const response = await fetch('/api/admin/tarana/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: false }),
    });
    const data = await response.json();

    if (data.success) {
      setSyncPolling(true);
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        const status = await fetchSyncStatus();
        if (status === 'completed' || status === 'failed') {
          clearInterval(pollInterval);
          setSyncPolling(false);
          if (status === 'completed') {
            fetchData(); // Refresh table data
          }
        }
      }, 2000);
    } else {
      setSyncStatus('failed');
      setError(data.error || 'Failed to start sync');
    }
  } catch (err) {
    setSyncStatus('failed');
    setError('Failed to trigger sync');
  }
};

// Fetch sync status on mount
useEffect(() => {
  fetchSyncStatus();
}, [fetchSyncStatus]);
```

**Step 3: Update header buttons section**

Replace the existing refresh/export buttons section (around line 187-203):

```typescript
<div className="flex items-center gap-3">
  {/* Sync Status */}
  {lastSync && (
    <div className="text-sm text-gray-500 mr-2">
      Last sync: {formatDistanceToNow(new Date(lastSync.created_at))} ago
      {lastSync.status === 'completed' && (
        <span className="ml-1">
          ({lastSync.inserted} new, {lastSync.updated} updated)
        </span>
      )}
    </div>
  )}

  {/* Sync Now Button */}
  <Button
    onClick={triggerSync}
    disabled={syncStatus === 'pending' || syncStatus === 'running'}
    variant="outline"
    className={syncStatus === 'running' ? 'border-blue-500' : ''}
  >
    <RefreshCw
      className={`h-4 w-4 mr-2 ${
        syncStatus === 'pending' || syncStatus === 'running' ? 'animate-spin' : ''
      }`}
    />
    {syncStatus === 'running' ? 'Syncing...' : 'Sync Now'}
  </Button>

  <Button onClick={fetchData} disabled={loading} variant="outline">
    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
    Refresh
  </Button>
  <Button onClick={exportToCSV} variant="outline">
    <Download className="h-4 w-4 mr-2" />
    Export CSV
  </Button>
  <Link href="/admin/coverage/base-stations/map">
    <Button className="bg-orange-500 hover:bg-orange-600">
      <Map className="h-4 w-4 mr-2" />
      View Map
    </Button>
  </Link>
</div>
```

**Step 4: Add date-fns import if needed**

Run: `npm list date-fns`

If not installed: `npm install date-fns`

**Step 5: Run type check**

Run: `npm run type-check:memory 2>&1 | grep base-stations`

Expected: No errors

**Step 6: Commit**

```bash
git add app/admin/coverage/base-stations/page.tsx
git commit -m "feat(ui): add Sync Now button to Base Stations page"
```

---

## Task 8: Remove Old Cron Endpoint

**Files:**
- Delete: `app/api/cron/tarana-sync/route.ts`
- Modify: `vercel.json`

**Step 1: Delete the old cron endpoint**

```bash
rm app/api/cron/tarana-sync/route.ts
```

**Step 2: Check vercel.json for cron config**

Read `vercel.json` and remove any tarana-sync cron configuration if present.

**Step 3: Run type check to ensure no broken imports**

Run: `npm run type-check:memory`

Expected: No errors (nothing should be importing the deleted file)

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old Tarana cron endpoint (replaced by Inngest)"
```

---

## Task 9: Test and Verify

**Step 1: Start dev server**

Run: `npm run dev:memory`

**Step 2: Start Inngest dev server**

Run (in new terminal): `npx inngest-cli@latest dev`

**Step 3: Test manual sync via UI**

1. Navigate to `/admin/coverage/base-stations`
2. Click "Sync Now" button
3. Verify spinner shows while syncing
4. Verify stats update after completion

**Step 4: Test manual sync via API**

```bash
curl -X POST http://localhost:3000/api/admin/tarana/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{"dryRun": true}'
```

Expected: `{ "success": true, "sync_log_id": "..." }`

**Step 5: Check Inngest dashboard**

Open: http://localhost:8288

Verify:
- `tarana-sync` function is registered
- Event appears when triggered
- Steps execute in sequence

**Step 6: Verify database**

Check `tarana_sync_logs` table has new entries with correct status.

**Step 7: Final commit**

```bash
git add -A
git commit -m "test: verify Inngest Tarana sync working end-to-end"
```

---

## Summary

| Task | Files | Action |
|------|-------|--------|
| 1 | `supabase/migrations/20260219000001_create_tarana_sync_logs.sql` | Create |
| 2 | `lib/inngest/client.ts` | Modify |
| 3 | `lib/inngest/functions/tarana-sync.ts` | Create |
| 4 | `lib/inngest/index.ts` | Modify |
| 5 | `app/api/admin/tarana/sync/route.ts` | Create |
| 6 | `app/api/admin/tarana/sync/status/route.ts` | Create |
| 7 | `app/admin/coverage/base-stations/page.tsx` | Modify |
| 8 | `app/api/cron/tarana-sync/route.ts`, `vercel.json` | Delete/Modify |
| 9 | N/A | Test & Verify |

**Total: 9 tasks, ~8 commits**
