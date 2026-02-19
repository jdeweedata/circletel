# Inngest Tarana Sync Design

**Date**: 2026-02-19
**Status**: Approved
**Author**: Claude Code

## Overview

Migrate Tarana base station sync from Vercel cron to Inngest for improved reliability, observability, and manual trigger capability.

## Requirements

| Requirement | Decision |
|-------------|----------|
| Bulk feasibility | Real-time UI feedback (keep current UX) |
| Tarana sync retries | 3x automatic with exponential backoff |
| Manual trigger | Yes - button on Base Stations page |
| Notifications | Dashboard only (no email) |
| Scope | Tarana sync only |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INNGEST CLOUD                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  taranaSyncFunction                                            │  │
│  │  ├─ ID: tarana-sync                                           │  │
│  │  ├─ Triggers:                                                  │  │
│  │  │   ├─ Cron: "0 0 * * *" (midnight SAST)                     │  │
│  │  │   └─ Event: "tarana/sync.requested"                        │  │
│  │  ├─ Retries: 3 (exponential backoff)                          │  │
│  │  └─ Timeout: 10 minutes                                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ /api/inngest    │    │ /api/admin/     │    │ Base Stations   │  │
│  │ (serve handler) │    │ tarana/sync     │    │ Page UI         │  │
│  │                 │    │ (trigger API)   │    │ (Sync button)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐                 │
│  │ tarana_base_stations│    │ tarana_sync_logs    │ (NEW)           │
│  │ (existing)          │    │ - id                │                 │
│  │ - serial_number     │    │ - status            │                 │
│  │ - site_name         │    │ - trigger_type      │                 │
│  │ - lat/lng           │    │ - inserted/updated  │                 │
│  │ - market            │    │ - errors            │                 │
│  │ - last_updated      │    │ - started_at        │                 │
│  └─────────────────────┘    │ - completed_at      │                 │
│                             └─────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `lib/inngest/functions/tarana-sync.ts` | Inngest function with steps |
| **Create** | `app/api/admin/tarana/sync/route.ts` | Manual trigger API |
| **Create** | `app/api/admin/tarana/sync/status/route.ts` | Status polling API |
| **Create** | `supabase/migrations/20260219_create_tarana_sync_logs.sql` | Sync logs table |
| **Modify** | `lib/inngest/index.ts` | Register new function |
| **Modify** | `lib/inngest/client.ts` | Add event types |
| **Modify** | `app/admin/coverage/base-stations/page.tsx` | Add Sync button |
| **Delete** | `app/api/cron/tarana-sync/route.ts` | Remove old cron |
| **Modify** | `vercel.json` | Remove cron config |

## Event Types

```typescript
// lib/inngest/client.ts

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

## Inngest Function Structure

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
    { cron: '0 0 * * *' },             // Daily at midnight
    { event: 'tarana/sync.requested' } // Manual trigger
  ],
  async ({ event, step }) => {
    // Step 1: Create/update sync log → status: 'running'
    // Step 2: Fetch base nodes from Tarana API
    // Step 3: Get existing records from database
    // Step 4: Upsert records (insert new, update existing)
    // Step 5: Optionally delete stale records
    // Step 6: Update sync log → status: 'completed'
    // Step 7: Send completion event
  }
);
```

## Database Schema

```sql
-- supabase/migrations/20260219_create_tarana_sync_logs.sql

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

CREATE INDEX idx_tarana_sync_logs_created
  ON tarana_sync_logs(created_at DESC);

ALTER TABLE tarana_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access" ON tarana_sync_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));
```

## Data Flow

### Manual Sync Flow

```
Admin clicks "Sync Now"
    │
    ▼
POST /api/admin/tarana/sync
    │
    ├─▶ Create sync_log (status: pending)
    │
    ├─▶ inngest.send('tarana/sync.requested', { sync_log_id })
    │
    └─▶ Return { sync_log_id } to UI

    ... Inngest processes async ...

UI polls GET /api/admin/tarana/sync/status?id=xxx
    │
    └─▶ Returns current sync_log status + stats
```

### Cron Sync Flow

```
Inngest cron fires (midnight)
    │
    ▼
taranaSyncFunction detects cron trigger (no event.data)
    │
    ├─▶ Create sync_log with trigger_type: 'cron'
    │
    └─▶ Execute same sync logic as manual
```

## Error Handling

| Error Type | Handling | Retry? |
|------------|----------|--------|
| Tarana API auth failure | Re-authenticate, retry | Yes |
| Tarana API timeout | Log, retry with backoff | Yes |
| Tarana API rate limit | Wait, retry | Yes |
| Supabase connection error | Log, retry | Yes |
| Invalid BN data | Skip record, log, continue | No (per-record) |
| All retries exhausted | Mark sync failed | Final |

## UI Component

Add to `app/admin/coverage/base-stations/page.tsx`:

- "Sync Now" button with loading state
- Last sync timestamp and stats
- Status badge (pending/running/completed/failed)
- Polling for status updates during sync

## Testing Strategy

| Test Type | Method |
|-----------|--------|
| Dry Run | `dryRun: true` option |
| Local Dev | `npx inngest-cli@latest dev` |
| Unit Tests | Jest mocks for sync service |
| Integration | Staging with real Tarana API |

## Migration Plan

1. Deploy migration (sync_logs table)
2. Deploy Inngest function + trigger API
3. Test manual sync in staging
4. Remove old cron from vercel.json
5. Delete old cron endpoint
6. Monitor first automated sync

## Success Criteria

- [ ] Manual sync works from UI with status updates
- [ ] Cron sync runs daily at midnight
- [ ] Retries work on transient failures
- [ ] Sync logs captured in database
- [ ] Old cron endpoint removed
- [ ] No regression in base station data
