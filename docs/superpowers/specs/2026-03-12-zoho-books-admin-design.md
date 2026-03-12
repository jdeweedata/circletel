# Zoho Books Admin Page Design

**Date:** 2026-03-12
**Status:** Approved
**Route:** `/admin/integrations/zoho-books`

## Overview

Admin page for monitoring and managing the Zoho Books sync workflow. Provides health monitoring, sync statistics, failed entity management, and manual sync triggers.

## Requirements

1. **Health monitoring** — Quick glance to check if sync is working
2. **Failed entity management** — View failures with retry/reset actions
3. **Manual sync triggers** — Full sync, entity-type sync, individual retry

## Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Title, status badge, refresh button                     │
├─────────────────────────────────────────────────────────────────┤
│ STATS: Customers | Invoices | Payments | Failed (4 cards)       │
├─────────────────────────────────────────────────────────────────┤
│ HEALTH CHECKS        │  QUICK ACTIONS                           │
│ (3 check items)      │  (sync buttons + last sync info)         │
├─────────────────────────────────────────────────────────────────┤
│ FAILED ENTITIES TABLE (paginated, with retry/reset actions)     │
├─────────────────────────────────────────────────────────────────┤
│ DETAILS FOOTER: Region | Org ID | Latency                       │
│ TIMESTAMP: Last checked                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Header

- Icon: `PiBooksBold` in blue-100 background
- Title: "Zoho Books Integration"
- Subtitle: "Accounting sync for customers, invoices, payments"
- Status badge: healthy (green) / degraded (yellow) / unhealthy (red)
- Refresh button: Fetches latest health data

### 2. Stats Grid (4 columns)

| Card | Icon | Value Format | Color |
|------|------|--------------|-------|
| Customers | PiUsersBold | `X/Y synced` | Default |
| Invoices | PiFilePdfBold | `X/Y synced` | Default |
| Payments | PiCreditCardBold | `X/Y synced` | Default |
| Failed | PiWarningBold | `N pending` | Red when > 0 |

### 3. Health Checks (SectionCard)

Three checks displayed:
- **Credentials** — Environment variables configured
- **Token Refresh** — OAuth token valid (with latency)
- **API Connection** — Connected to Zoho Books org (with latency)

### 4. Quick Actions (SectionCard)

- **Run Full Sync** button — Triggers complete sync workflow
- **Entity-type buttons** — Sync Customers / Invoices / Payments individually
- **Last sync info** — Timestamp, duration, result

Buttons show spinner and disable while sync in progress.

### 5. Failed Entities Table

| Column | Description |
|--------|-------------|
| Type | customer / invoice / payment with icon |
| Entity ID | Invoice number, customer account, or payment ID |
| Error | Last sync error message (truncated) |
| Retries | X/5 format, warning if exhausted |
| Actions | Retry and Reset buttons |

**Bulk action:** "Retry All Failed" button in header.

**Empty state:** "All entities synced successfully" message.

**Pagination:** 10 items per page.

### 6. Details Footer

Three info cards:
- Region (from env)
- Organization ID (partially masked)
- API Latency

Timestamp showing when health was last fetched.

## API Endpoints

### GET /api/admin/zoho/books/health

Returns health status and sync statistics.

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: { status: 'pass' | 'fail'; message: string };
    tokenRefresh: { status: 'pass' | 'fail'; message: string; duration_ms?: number };
    apiConnection: { status: 'pass' | 'fail'; message: string; duration_ms?: number };
  };
  stats: {
    customersTotal: number;
    customersSynced: number;
    invoicesTotal: number;
    invoicesSynced: number;
    paymentsTotal: number;
    paymentsSynced: number;
    failedCount: number;
  };
  lastSync: {
    timestamp: string;
    duration_ms: number;
    result: 'success' | 'partial' | 'failed';
  } | null;
  details: {
    region: string;
    organizationId: string;
    apiLatencyMs: number;
  };
}
```

### GET /api/admin/zoho/books/failed

Returns paginated list of failed entities.

```typescript
interface FailedEntitiesResponse {
  entities: Array<{
    type: 'customer' | 'invoice' | 'payment';
    id: string;
    displayId: string; // Invoice number, account number, etc.
    error: string;
    retryCount: number;
    maxRetries: number;
    nextRetryAt: string | null;
    lastAttempt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### POST /api/admin/zoho/books/sync

Triggers manual sync.

```typescript
// Request
{ type: 'full' | 'customers' | 'invoices' | 'payments' }

// Response
{ success: boolean; message: string; jobId?: string }
```

### POST /api/admin/zoho/books/retry

Retries a single failed entity.

```typescript
// Request
{ entityType: 'customer' | 'invoice' | 'payment'; entityId: string }

// Response
{ success: boolean; message: string; zohoId?: string }
```

### POST /api/admin/zoho/books/retry-all

Retries all failed entities.

```typescript
// Response
{ success: boolean; processed: number; succeeded: number; failed: number }
```

### POST /api/admin/zoho/books/reset

Resets retry count for an entity.

```typescript
// Request
{ entityType: 'customer' | 'invoice' | 'payment'; entityId: string }

// Response
{ success: boolean; message: string }
```

## Files to Create

| File | Purpose |
|------|---------|
| `app/admin/integrations/zoho-books/page.tsx` | Main page component |
| `app/api/admin/zoho/books/health/route.ts` | Health check endpoint |
| `app/api/admin/zoho/books/failed/route.ts` | Failed entities list |
| `app/api/admin/zoho/books/sync/route.ts` | Manual sync trigger |
| `app/api/admin/zoho/books/retry/route.ts` | Single entity retry |
| `app/api/admin/zoho/books/retry-all/route.ts` | Batch retry |
| `app/api/admin/zoho/books/reset/route.ts` | Reset retry count |

## Existing Components to Reuse

- `StatCard` from `@/components/admin/shared/StatCard`
- `SectionCard` from `@/components/admin/shared/SectionCard`
- Status badge pattern from Zoho Billing page
- Health check display pattern from Zoho Billing page

## Design Decisions

1. **Single page dashboard** — Matches existing Zoho Billing pattern
2. **X/Y synced format** — Immediately shows sync coverage
3. **Inline retry/reset** — No modals, quick actions in table
4. **5 retry limit** — Matches exponential backoff in sync workflow

## Out of Scope

- Sync history log (can add later)
- Webhook configuration
- Zoho Books settings management
