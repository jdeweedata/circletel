# Inngest Billing Workflow Migration Design

**Date:** 2026-02-26
**Status:** Approved
**Approach:** Hybrid (Event-coordinated incremental migration)

---

## Executive Summary

Migrate three critical billing cron jobs to Inngest using a hybrid approach that:
1. Migrates each cron independently to Inngest
2. Adds event-based coordination between workflows
3. Maintains existing crons as fallback during validation
4. Evolves toward unified billing workflow

**Protected Revenue:** $250K+/month
**Timeline:** 4 weeks (Phase 1)

---

## Current State

### Cron Jobs to Migrate

| Job | Schedule | Timeout | Issues |
|-----|----------|---------|--------|
| `submit-debit-orders` | 06:00 SAST | 60s | Sequential processing, no item-level retry |
| `process-billing-day` | 07:00 SAST | 120s | Depends on debit job timing, sequential |
| `zoho-sync` | 02:00 SAST | N/A | 30-40% failure rate, rate limiting |

### Existing Inngest Patterns

Reference implementation: `lib/inngest/functions/tarana-sync.ts`
- Dual triggers (cron + manual event)
- Step-based execution with checkpoints
- Completion/failure event handlers
- Cancellation support
- Progress tracking via database logs

---

## Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     INNGEST BILLING WORKFLOWS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    Event    ┌──────────────────┐          │
│  │  Debit Orders    │───────────▶│   Billing Day     │          │
│  │  (06:00 SAST)    │  completed  │   (triggered)     │          │
│  └────────┬─────────┘             └────────┬─────────┘          │
│           │                                │                     │
│           ▼                                ▼                     │
│  ┌──────────────────┐             ┌──────────────────┐          │
│  │ Step: Fetch      │             │ Step: Fetch      │          │
│  │ eligible invoices│             │ non-eMandate     │          │
│  └────────┬─────────┘             │ invoices         │          │
│           │                       └────────┬─────────┘          │
│           ▼                                │                     │
│  ┌──────────────────┐                      ▼                     │
│  │ Step: Check      │             ┌──────────────────┐          │
│  │ mandates (batch) │             │ Step: Process    │          │
│  └────────┬─────────┘             │ Pay Now (batch)  │          │
│           │                       └────────┬─────────┘          │
│           ▼                                │                     │
│  ┌──────────────────┐                      ▼                     │
│  │ Step: Submit     │             ┌──────────────────┐          │
│  │ to NetCash       │             │ Step: Send       │          │
│  └────────┬─────────┘             │ notifications    │          │
│           │                       └────────┬─────────┘          │
│           ▼                                │                     │
│  ┌──────────────────┐                      ▼                     │
│  │ Step: Process    │             ┌──────────────────┐          │
│  │ Pay Now fallback │             │ Emit: billing/   │          │
│  └────────┬─────────┘             │ day.completed    │          │
│           │                       └──────────────────┘          │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ Emit: billing/   │                                           │
│  │ debit.completed  │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Event Types

```typescript
// New billing events to add to lib/inngest/client.ts

// Debit Order Events
export type DebitOrdersRequestedEvent = {
  name: 'billing/debit-orders.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    billing_date?: string; // YYYY-MM-DD, defaults to today
    admin_user_id?: string;
    batch_log_id: string;
    options?: {
      dryRun?: boolean;
    };
  };
};

export type DebitOrdersCompletedEvent = {
  name: 'billing/debit-orders.completed';
  data: {
    batch_log_id: string;
    billing_date: string;
    batch_id?: string;
    total_eligible: number;
    submitted: number;
    skipped: number;
    paynow_sent: number;
    duration_ms: number;
  };
};

export type DebitOrdersFailedEvent = {
  name: 'billing/debit-orders.failed';
  data: {
    batch_log_id: string;
    error: string;
    attempt: number;
  };
};

// Billing Day Events
export type BillingDayRequestedEvent = {
  name: 'billing/day.requested';
  data: {
    triggered_by: 'cron' | 'manual' | 'debit-completion';
    billing_date?: string;
    admin_user_id?: string;
    process_log_id: string;
    options?: {
      dryRun?: boolean;
    };
  };
};

export type BillingDayCompletedEvent = {
  name: 'billing/day.completed';
  data: {
    process_log_id: string;
    billing_date: string;
    total_invoices: number;
    processed: number;
    successful: number;
    failed: number;
    duration_ms: number;
  };
};

// Zoho Sync Events
export type ZohoSyncRequestedEvent = {
  name: 'zoho/sync.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    sync_log_id: string;
    options?: {
      maxProducts?: number;
      dryRun?: boolean;
      retryFailed?: boolean;
    };
  };
};

export type ZohoSyncCompletedEvent = {
  name: 'zoho/sync.completed';
  data: {
    sync_log_id: string;
    total_candidates: number;
    processed: number;
    crm_succeeded: number;
    crm_failed: number;
    billing_succeeded: number;
    billing_failed: number;
    duration_ms: number;
  };
};
```

### Debit Orders Function Design

**File:** `lib/inngest/functions/debit-orders.ts`

**Key improvements over current cron:**
1. **Step-based checkpoints** - Resume from failure point
2. **Batch mandate checking** - Query all mandates in one step vs N queries
3. **Parallel retry** - Failed items retry independently
4. **Idempotency** - Batch ID prevents duplicate submissions
5. **Event coordination** - Triggers billing-day on completion

**Steps:**
1. `create-batch-log` - Initialize tracking record
2. `fetch-eligible-invoices` - Get invoices due today with debit method
3. `fetch-eligible-orders` - Get orders due today
4. `batch-check-mandates` - Single query for all customer mandates
5. `categorize-items` - Split into: active mandate, pending mandate, no mandate
6. `submit-netcash-batch` - Submit active mandate items
7. `authorize-batch` - NetCash batch authorization
8. `process-paynow-fallback` - Send Pay Now to pending/no mandate
9. `update-billing-dates` - Advance next billing dates
10. `send-completion-event` - Trigger billing-day workflow

### Billing Day Function Design

**File:** `lib/inngest/functions/billing-day.ts`

**Triggers:**
- Cron: `0 5 * * *` (07:00 SAST) - Fallback if debit-orders fails
- Event: `billing/debit-orders.completed` - Primary trigger

**Steps:**
1. `create-process-log` - Initialize tracking
2. `fetch-non-emandate-invoices` - Invoices not in debit batch
3. `batch-process-paynow` - Process in batches of 10 with rate limiting
4. `send-notifications` - Email + SMS with Pay Now links
5. `send-completion-event` - For downstream reporting

### Zoho Sync Function Design

**File:** `lib/inngest/functions/zoho-sync.ts`

**Key improvements:**
1. **Exponential backoff** - Inngest native retry with backoff
2. **Parallel groups** - CRM and Billing sync independently
3. **Adaptive rate limiting** - Track API calls, pause when approaching limit
4. **Failure isolation** - One product failure doesn't stop batch

**Steps:**
1. `fetch-sync-candidates` - Priority: failed > never synced > stale
2. `parallel-crm-sync` - Sync to Zoho CRM Products
3. `parallel-billing-sync` - Sync to Zoho Billing Plans/Items
4. `update-integration-status` - Mark sync results
5. `log-failures` - Record failures for retry

---

## Migration Strategy

### Phase 1: Debit Orders (Week 1-2)

1. Create `lib/inngest/functions/debit-orders.ts`
2. Add event types to `lib/inngest/client.ts`
3. Register function in `lib/inngest/index.ts`
4. Create admin UI trigger button
5. Run parallel with existing cron for 1 week
6. Disable cron after validation

### Phase 2: Billing Day (Week 2-3)

1. Create `lib/inngest/functions/billing-day.ts`
2. Add event listener for `billing/debit-orders.completed`
3. Keep cron as fallback
4. Validate event coordination
5. Disable cron after 1 week parallel run

### Phase 3: Zoho Sync (Week 3-4)

1. Create `lib/inngest/functions/zoho-sync.ts`
2. Add retry service with exponential backoff
3. Parallel run with existing cron
4. Monitor failure rate improvement
5. Disable cron when failure rate < 5%

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Debit collection rate | ~88% | 96-100% |
| Invoice delivery rate | 94% | 100% |
| Payment delay on failure | 24h | 2-4h |
| Zoho sync failure rate | 30-40% | <5% |
| Zoho data lag | 24h | <2h |

---

## Rollback Plan

Each migration maintains parallel cron execution:
1. Inngest function has `enabled: false` flag
2. Cron remains active with feature flag check
3. Rollback = disable Inngest, re-enable cron
4. No data migration required - same database tables

---

## Files to Create/Modify

**New Files:**
- `lib/inngest/functions/debit-orders.ts`
- `lib/inngest/functions/billing-day.ts`
- `lib/inngest/functions/zoho-sync.ts`

**Modified Files:**
- `lib/inngest/client.ts` - Add billing event types
- `lib/inngest/index.ts` - Register new functions
- `app/api/inngest/route.ts` - If not already serving all functions

**Optional Admin UI:**
- `app/admin/billing/inngest-controls/page.tsx` - Manual triggers
