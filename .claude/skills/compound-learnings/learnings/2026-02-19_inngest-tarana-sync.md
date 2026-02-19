# Inngest Tarana Sync Implementation

**Date**: 2026-02-19
**Category**: Background Jobs / Event-Driven Architecture
**Impact**: High - Replaces Vercel cron with reliable, observable job system

## Summary

Migrated Tarana base station sync from Vercel cron to Inngest for improved reliability, observability, and manual trigger capability. Implements step-based execution with automatic retries and full audit trail.

## Files Created

| File | Purpose |
|------|---------|
| `lib/inngest/functions/tarana-sync.ts` | Main sync function with 8 steps, completion/failure handlers |
| `app/api/admin/tarana/sync/route.ts` | POST endpoint for manual sync trigger |
| `app/api/admin/tarana/sync/status/route.ts` | GET endpoint for status polling |
| `supabase/migrations/20260219000001_create_tarana_sync_logs.sql` | Audit log table |

## Files Modified

| File | Changes |
|------|---------|
| `lib/inngest/client.ts` | Added TaranaSyncRequested/Completed/Failed event types |
| `lib/inngest/index.ts` | Registered taranaSyncFunction and handlers |
| `app/admin/coverage/base-stations/page.tsx` | Added Sync Now button with polling |
| `vercel.json` | Removed old cron config |

## Files Deleted

| File | Reason |
|------|--------|
| `app/api/cron/tarana-sync/route.ts` | Replaced by Inngest function |

## Key Patterns

### 1. Dual-Trigger Inngest Function

```typescript
// lib/inngest/functions/tarana-sync.ts
export const taranaSyncFunction = inngest.createFunction(
  {
    id: 'tarana-sync',
    name: 'Tarana Base Station Sync',
    retries: 3,
    cancelOn: [{ event: 'tarana/sync.cancelled', match: 'data.sync_log_id' }],
  },
  [
    { cron: '0 22 * * *' },             // Midnight SAST (22:00 UTC)
    { event: 'tarana/sync.requested' }, // Manual trigger
  ],
  async ({ event, step }) => {
    // Detect trigger type
    const isCronTrigger = !event?.data?.sync_log_id;
    // ...
  }
);
```

**When to use**: Any job that needs both scheduled and on-demand execution.

### 2. Step-Based Execution for Reliability

```typescript
// Each step is atomic and resumable
const baseNodes = await step.run('fetch-base-nodes', async () => {
  return await getAllBaseNodes();
});

// If this step fails, Inngest retries from HERE, not from the beginning
const existingSerials = await step.run('get-existing-records', async () => {
  const { data } = await supabase.from('tarana_base_stations').select('serial_number');
  return new Set(data?.map(e => e.serial_number) || []);
});

// Batch processing with checkpoints
for (let i = 0; i < batches.length; i++) {
  await step.run(`upsert-batch-${i}`, async () => {
    // Each batch is checkpointed - if batch 3 fails, retry resumes at batch 3
  });
}
```

**When to use**: Long-running jobs where partial progress should be preserved.

### 3. Sync Log Audit Trail Pattern

```sql
CREATE TABLE tarana_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  trigger_type TEXT CHECK (trigger_type IN ('cron', 'manual')),
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
```

**When to use**: Any background job that needs audit trail and status tracking.

### 4. Manual Trigger with Conflict Detection

```typescript
// app/api/admin/tarana/sync/route.ts
export async function POST(request: NextRequest) {
  // Check for already running sync
  const { data: runningSync } = await supabase
    .from('tarana_sync_logs')
    .select('id')
    .in('status', ['pending', 'running'])
    .limit(1)
    .single();

  if (runningSync) {
    return NextResponse.json(
      { success: false, error: 'A sync is already in progress', sync_log_id: runningSync.id },
      { status: 409 }
    );
  }

  // Create log, then send event
  const { data: syncLog } = await supabase
    .from('tarana_sync_logs')
    .insert({ status: 'pending', trigger_type: 'manual', triggered_by: user.id })
    .select('id')
    .single();

  await inngest.send({
    name: 'tarana/sync.requested',
    data: { triggered_by: 'manual', sync_log_id: syncLog.id, options }
  });
}
```

**When to use**: Any job trigger that needs to prevent concurrent runs.

### 5. UI Polling for Background Job Status

```typescript
// app/admin/coverage/base-stations/page.tsx
const triggerSync = async () => {
  setSyncStatus('pending');
  const response = await fetch('/api/admin/tarana/sync', { method: 'POST' });
  const data = await response.json();

  if (data.success) {
    // Poll every 2 seconds until complete
    const pollInterval = setInterval(async () => {
      const status = await fetchSyncStatus();
      if (status === 'completed' || status === 'failed') {
        clearInterval(pollInterval);
        if (status === 'completed') fetchData(); // Refresh table
      }
    }, 2000);
  }
};
```

**When to use**: UI needs to show real-time progress of background jobs.

## Inngest vs Vercel Cron Comparison

| Feature | Vercel Cron | Inngest |
|---------|-------------|---------|
| Timeout | 60s (Hobby), 300s (Pro) | Up to 2 hours |
| Retries | Manual | Automatic (configurable) |
| Observability | Logs only | Full dashboard + traces |
| Manual trigger | Requires separate endpoint | Event-based, same function |
| Step checkpoints | None | Built-in |
| Cancellation | Not supported | Event-based cancellation |

## Environment Setup

```bash
# Development
npx inngest-cli@latest dev  # Starts local dashboard at localhost:8288

# Production
# Set INNGEST_SIGNING_KEY and INNGEST_EVENT_KEY in Vercel env vars
```

## Testing Commands

```bash
# Test manual sync (dry run)
curl -X POST http://localhost:3000/api/admin/tarana/sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Check sync status
curl http://localhost:3000/api/admin/tarana/sync/status

# View Inngest dashboard
open http://localhost:8288
```

## Common Mistakes Avoided

| Mistake | Correct Approach |
|---------|------------------|
| Single monolithic function | Step-based execution for resilience |
| No conflict detection | Check for running syncs before starting |
| Cron and manual as separate functions | Dual-trigger on same function |
| No audit trail | Dedicated sync_logs table |
| Hardcoded retry logic | Inngest automatic retries |

## Related Files

- Existing Inngest patterns: `lib/inngest/functions/competitor-scrape.ts`
- Tarana API client: `lib/tarana/client.ts`
- Tarana sync service (reused): `lib/tarana/sync-service.ts`
- Base stations table: `tarana_base_stations`
