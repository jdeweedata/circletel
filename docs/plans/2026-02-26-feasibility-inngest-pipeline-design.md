# Feasibility Inngest Pipeline Design

**Date**: 2026-02-26
**Status**: Approved
**Scope**: Week 1 - Schema Enhancement + Inngest Feasibility Pipeline

---

## Overview

This design adds async parallel coverage checks to the CircleTel feasibility system using Inngest. It builds on the existing synchronous coverage APIs and admin UI while enabling:

- **Parallel provider checks** (faster coverage assessment)
- **Step-based execution** (reliable, resumable)
- **Progress tracking** (real-time status updates)
- **Persistence** (coverage results stored for analytics)

---

## Context: What Already Exists

| Component | Status | Location |
|-----------|--------|----------|
| `coverage_leads` table | Exists | `supabase/migrations/20250101000001_create_coverage_system_tables.sql` |
| Coverage aggregation API | Exists | `lib/coverage/aggregation-service.ts` |
| Bulk quote API | Exists | `app/api/quotes/business/bulk-create/route.ts` |
| Admin feasibility UI | Exists | `app/admin/sales/feasibility/page.tsx` |
| Inngest client | Exists | `lib/inngest/client.ts` |
| Inngest tarana-sync | Exists | `lib/inngest/functions/tarana-sync.ts` (pattern reference) |

---

## Section 1: Schema Enhancement

### New Columns on `coverage_leads`

```sql
-- Migration: 20260226000001_add_feasibility_columns.sql

-- Requirements column: speed/budget/contention preferences
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  requirements JSONB DEFAULT '{}';

-- Coverage results column: persisted provider check results
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  coverage_results JSONB DEFAULT '[]';

-- Coverage check status for async tracking
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  coverage_check_status VARCHAR(20) DEFAULT 'pending'
  CHECK (coverage_check_status IN ('pending', 'checking', 'complete', 'failed'));

-- Index for filtering by check status
CREATE INDEX IF NOT EXISTS idx_coverage_leads_check_status
ON coverage_leads(coverage_check_status);
```

### JSONB Schema Examples

**requirements**:
```json
{
  "bandwidth_mbps": 500,
  "budget_max": 5000,
  "contention": "10:1",
  "failover_needed": true,
  "sla_required": "99.9%"
}
```

**coverage_results**:
```json
[
  {
    "technology": "fibre",
    "provider": "DFA",
    "is_feasible": true,
    "confidence": "high",
    "distance_m": 150,
    "max_speed_mbps": 1000,
    "checked_at": "2026-02-26T10:00:00Z"
  },
  {
    "technology": "5g",
    "provider": "MTN",
    "is_feasible": true,
    "confidence": "medium",
    "signal_strength": "good",
    "estimated_speed_mbps": 200,
    "checked_at": "2026-02-26T10:00:01Z"
  }
]
```

---

## Section 2: Inngest Feasibility Pipeline

### Event Flow

```
Event: feasibility/check.requested
  │
  ├─► Step 1: create-check-log
  │   - Update coverage_leads.coverage_check_status = 'checking'
  │   - Record start timestamp
  │
  ├─► Step 2-5: Parallel provider checks (Promise.all)
  │   ├─► check-tarana (fixed wireless)
  │   ├─► check-5g-lte (MTN 5G/LTE)
  │   ├─► check-fibre (internal PostGIS)
  │   └─► check-dfa (DFA Fibre API)
  │
  ├─► Step 6: aggregate-results
  │   - Combine all provider responses
  │   - Calculate best recommendations
  │
  ├─► Step 7: persist-results
  │   - Update coverage_leads.coverage_results
  │   - Update coverage_leads.coverage_check_status = 'complete'
  │
  └─► Step 8: send-completion-event
      - Emit feasibility/check.completed
```

### Function Signature

```typescript
// lib/inngest/functions/feasibility-check.ts

export const feasibilityCheckFunction = inngest.createFunction(
  {
    id: 'feasibility-check',
    name: 'Feasibility Coverage Check',
    retries: 3,
    cancelOn: [
      { event: 'feasibility/check.cancelled', match: 'data.lead_id' }
    ]
  },
  { event: 'feasibility/check.requested' },
  async ({ event, step }) => {
    const { lead_id, coordinates, requirements } = event.data;
    // ... implementation
  }
);
```

### Event Data Types

```typescript
// Event: feasibility/check.requested
interface FeasibilityCheckRequestedEvent {
  lead_id: string;
  coordinates: { lat: number; lng: number };
  requirements?: {
    bandwidth_mbps?: number;
    budget_max?: number;
    contention?: 'best-effort' | '10:1' | 'dia';
    failover_needed?: boolean;
  };
  triggered_by?: 'api' | 'admin' | 'partner';
  user_id?: string;
}

// Event: feasibility/check.completed
interface FeasibilityCheckCompletedEvent {
  lead_id: string;
  results: CoverageResult[];
  duration_ms: number;
  best_technology?: string;
  is_feasible: boolean;
}
```

---

## Section 3: API Trigger Endpoint

### Endpoint

```
POST /api/coverage/check-async

Authorization: Bearer <token> (admin/partner)

Body:
{
  "leadId": "uuid",
  "requirements": {
    "bandwidth_mbps": 500,
    "contention": "10:1"
  }
}

Response:
{
  "success": true,
  "eventId": "inngest-event-id",
  "leadId": "uuid",
  "message": "Coverage check started"
}
```

### Implementation

```typescript
// app/api/coverage/check-async/route.ts

export async function POST(request: NextRequest) {
  const { leadId, requirements } = await request.json();

  // Validate lead exists
  const lead = await supabase.from('coverage_leads').select('*').eq('id', leadId).single();
  if (!lead.data) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  // Check for concurrent execution
  if (lead.data.coverage_check_status === 'checking') {
    return NextResponse.json({ error: 'Check already in progress' }, { status: 409 });
  }

  // Send Inngest event
  const { ids } = await inngest.send({
    name: 'feasibility/check.requested',
    data: {
      lead_id: leadId,
      coordinates: lead.data.coordinates,
      requirements,
      triggered_by: 'api'
    }
  });

  return NextResponse.json({
    success: true,
    eventId: ids[0],
    leadId,
    message: 'Coverage check started'
  });
}
```

---

## Section 4: File Structure

### New Files

```
lib/inngest/functions/
└── feasibility-check.ts          # Main Inngest functions

app/api/coverage/
└── check-async/
    └── route.ts                  # API trigger endpoint

supabase/migrations/
└── 20260226000001_add_feasibility_columns.sql

types/
└── feasibility.ts                # TypeScript types (optional)
```

### Modified Files

```
lib/inngest/index.ts              # Export new functions
```

---

## Section 5: Error Handling

### Retry Strategy

- **Retries**: 3 automatic retries on transient failures
- **Backoff**: Exponential backoff (Inngest default)
- **Timeout**: 60 seconds per provider check

### Failure States

| State | Trigger | Resolution |
|-------|---------|------------|
| `checking` stuck | Function timeout | Manual reset or auto-expire after 10 min |
| `failed` | All retries exhausted | Log error, notify admin, keep partial results |
| Provider error | Single provider fails | Continue with other providers, mark partial |

### Cancellation

```typescript
// Cancel a running check
await inngest.send({
  name: 'feasibility/check.cancelled',
  data: { lead_id: 'uuid' }
});
```

---

## Section 6: Monitoring

### Inngest Dashboard

All function runs visible at: `https://app.inngest.com/`

### Database Queries

```sql
-- Check pending/stuck checks
SELECT id, address, coverage_check_status, updated_at
FROM coverage_leads
WHERE coverage_check_status IN ('pending', 'checking')
AND updated_at < NOW() - INTERVAL '10 minutes';

-- Coverage success rate
SELECT
  DATE(updated_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE coverage_check_status = 'complete') as success,
  COUNT(*) FILTER (WHERE coverage_check_status = 'failed') as failed
FROM coverage_leads
GROUP BY DATE(updated_at)
ORDER BY date DESC;
```

---

## Deliverables Summary

| Item | File | Effort |
|------|------|--------|
| Schema migration | `supabase/migrations/20260226000001_add_feasibility_columns.sql` | 30 min |
| Inngest function | `lib/inngest/functions/feasibility-check.ts` | 2-3 hrs |
| Inngest exports | `lib/inngest/index.ts` (update) | 10 min |
| API trigger endpoint | `app/api/coverage/check-async/route.ts` | 1 hr |
| Types | `lib/coverage/types.ts` (update) | 30 min |

**Total estimated effort**: 4-5 hours

---

## Future Enhancements (Out of Scope)

- Partner self-service portal (`/feasibility/*` routes)
- Real-time results dashboard with Supabase subscriptions
- PDF quote generation
- WhatsApp notifications via Inngest
- Batch processing cron trigger
