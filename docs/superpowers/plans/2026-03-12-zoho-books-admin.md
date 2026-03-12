# Zoho Books Admin Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create admin page for monitoring and managing Zoho Books sync with health checks, stats, failed entity management, and manual sync triggers.

**Architecture:** Single-page dashboard at `/admin/integrations/zoho-books` with 7 API endpoints. Uses existing StatCard/SectionCard components. Follows Zoho Billing admin page patterns.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Tailwind, shadcn/ui, Phosphor Icons

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `app/admin/integrations/zoho-books/page.tsx` | Main dashboard page |
| Create | `app/api/admin/zoho/books/health/route.ts` | Health check + stats |
| Create | `app/api/admin/zoho/books/failed/route.ts` | Failed entities list |
| Create | `app/api/admin/zoho/books/sync/route.ts` | Manual sync trigger |
| Create | `app/api/admin/zoho/books/retry/route.ts` | Single entity retry |
| Create | `app/api/admin/zoho/books/retry-all/route.ts` | Batch retry all |
| Create | `app/api/admin/zoho/books/reset/route.ts` | Reset retry count |

---

## Chunk 1: API Endpoints

### Task 1: Health Check Endpoint

**Files:**
- Create: `app/api/admin/zoho/books/health/route.ts`

- [ ] **Step 1: Create health endpoint structure**

```typescript
// app/api/admin/zoho/books/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getZohoBooksClient } from '@/lib/integrations/zoho/books-api-client';

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

export async function GET() {
  const startTime = Date.now();

  // Check credentials
  const credentialsCheck = checkCredentials();

  // Check token refresh
  const tokenCheck = await checkTokenRefresh();

  // Check API connection
  const apiCheck = await checkApiConnection();

  // Get sync stats
  const stats = await getSyncStats();

  // Get last sync info
  const lastSync = await getLastSyncInfo();

  // Determine overall status
  const status = determineStatus(credentialsCheck, tokenCheck, apiCheck);

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      credentials: credentialsCheck,
      tokenRefresh: tokenCheck,
      apiConnection: apiCheck,
    },
    stats,
    lastSync,
    details: {
      region: process.env.ZOHO_REGION || 'US',
      organizationId: maskOrgId(process.env.ZOHO_BOOKS_ORGANIZATION_ID || ''),
      apiLatencyMs: apiCheck.duration_ms || 0,
    },
  };

  return NextResponse.json(response);
}

function checkCredentials(): { status: 'pass' | 'fail'; message: string } {
  const required = [
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET',
    'ZOHO_REFRESH_TOKEN',
    'ZOHO_BOOKS_ORGANIZATION_ID',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length === 0) {
    return { status: 'pass', message: 'All credentials configured' };
  }

  return { status: 'fail', message: `Missing: ${missing.join(', ')}` };
}

async function checkTokenRefresh(): Promise<{ status: 'pass' | 'fail'; message: string; duration_ms?: number }> {
  const start = Date.now();
  try {
    const client = getZohoBooksClient();
    await client.getAccessToken();
    return {
      status: 'pass',
      message: 'Token refresh successful',
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Token refresh failed',
      duration_ms: Date.now() - start,
    };
  }
}

async function checkApiConnection(): Promise<{ status: 'pass' | 'fail'; message: string; duration_ms?: number }> {
  const start = Date.now();
  try {
    const client = getZohoBooksClient();
    const result = await client.testConnection();
    if (result.success) {
      return {
        status: 'pass',
        message: `Connected to ${result.org_name}`,
        duration_ms: Date.now() - start,
      };
    }
    return {
      status: 'fail',
      message: result.error || 'Connection failed',
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'API connection failed',
      duration_ms: Date.now() - start,
    };
  }
}

async function getSyncStats() {
  const supabase = await createClient();

  // Customers
  const { count: customersTotal } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  const { count: customersSynced } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .not('zoho_books_contact_id', 'is', null);

  // Invoices
  const { count: invoicesTotal } = await supabase
    .from('customer_invoices')
    .select('*', { count: 'exact', head: true });

  const { count: invoicesSynced } = await supabase
    .from('customer_invoices')
    .select('*', { count: 'exact', head: true })
    .not('zoho_books_invoice_id', 'is', null);

  // Payments
  const { count: paymentsTotal } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: paymentsSynced } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .not('zoho_books_payment_id', 'is', null);

  // Failed count
  const { count: failedCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('zoho_sync_status', 'failed');

  const { count: failedInvoices } = await supabase
    .from('customer_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('zoho_sync_status', 'failed');

  const { count: failedPayments } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('zoho_sync_status', 'failed');

  return {
    customersTotal: customersTotal || 0,
    customersSynced: customersSynced || 0,
    invoicesTotal: invoicesTotal || 0,
    invoicesSynced: invoicesSynced || 0,
    paymentsTotal: paymentsTotal || 0,
    paymentsSynced: paymentsSynced || 0,
    failedCount: (failedCustomers || 0) + (failedInvoices || 0) + (failedPayments || 0),
  };
}

async function getLastSyncInfo() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('cron_execution_log')
    .select('*')
    .eq('cron_name', 'zoho-books-sync')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    timestamp: data.started_at,
    duration_ms: data.duration_ms || 0,
    result: data.status as 'success' | 'partial' | 'failed',
  };
}

function determineStatus(
  credentials: { status: string },
  token: { status: string },
  api: { status: string }
): 'healthy' | 'degraded' | 'unhealthy' {
  if (credentials.status === 'fail') return 'unhealthy';
  if (token.status === 'fail') return 'unhealthy';
  if (api.status === 'fail') return 'degraded';
  return 'healthy';
}

function maskOrgId(orgId: string): string {
  if (!orgId || orgId.length < 8) return '***';
  return orgId.substring(0, 4) + '****' + orgId.substring(orgId.length - 4);
}
```

- [ ] **Step 2: Test endpoint manually**

```bash
curl http://localhost:3000/api/admin/zoho/books/health | jq
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/zoho/books/health/route.ts
git commit -m "feat(admin): add Zoho Books health check endpoint"
```

---

### Task 2: Failed Entities Endpoint

**Files:**
- Create: `app/api/admin/zoho/books/failed/route.ts`

- [ ] **Step 1: Create failed entities endpoint**

```typescript
// app/api/admin/zoho/books/failed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FailedEntity {
  type: 'customer' | 'invoice' | 'payment';
  id: string;
  displayId: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastAttempt: string;
}

interface FailedEntitiesResponse {
  entities: FailedEntity[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const offset = (page - 1) * pageSize;

  const supabase = await createClient();
  const entities: FailedEntity[] = [];

  // Get failed customers
  const { data: customers, count: customerCount } = await supabase
    .from('customers')
    .select('id, account_number, zoho_sync_error, zoho_books_retry_count, zoho_books_next_retry_at, updated_at', { count: 'exact' })
    .eq('zoho_sync_status', 'failed')
    .order('updated_at', { ascending: false });

  if (customers) {
    for (const c of customers) {
      entities.push({
        type: 'customer',
        id: c.id,
        displayId: c.account_number || c.id.substring(0, 8),
        error: c.zoho_sync_error || 'Unknown error',
        retryCount: c.zoho_books_retry_count || 0,
        maxRetries: 5,
        nextRetryAt: c.zoho_books_next_retry_at,
        lastAttempt: c.updated_at,
      });
    }
  }

  // Get failed invoices
  const { data: invoices, count: invoiceCount } = await supabase
    .from('customer_invoices')
    .select('id, invoice_number, zoho_sync_error, zoho_books_retry_count, zoho_books_next_retry_at, updated_at', { count: 'exact' })
    .eq('zoho_sync_status', 'failed')
    .order('updated_at', { ascending: false });

  if (invoices) {
    for (const inv of invoices) {
      entities.push({
        type: 'invoice',
        id: inv.id,
        displayId: inv.invoice_number || inv.id.substring(0, 8),
        error: inv.zoho_sync_error || 'Unknown error',
        retryCount: inv.zoho_books_retry_count || 0,
        maxRetries: 5,
        nextRetryAt: inv.zoho_books_next_retry_at,
        lastAttempt: inv.updated_at,
      });
    }
  }

  // Get failed payments
  const { data: payments, count: paymentCount } = await supabase
    .from('payment_transactions')
    .select('id, reference, zoho_sync_error, zoho_books_retry_count, zoho_books_next_retry_at, updated_at', { count: 'exact' })
    .eq('zoho_sync_status', 'failed')
    .order('updated_at', { ascending: false });

  if (payments) {
    for (const p of payments) {
      entities.push({
        type: 'payment',
        id: p.id,
        displayId: p.reference || p.id.substring(0, 8),
        error: p.zoho_sync_error || 'Unknown error',
        retryCount: p.zoho_books_retry_count || 0,
        maxRetries: 5,
        nextRetryAt: p.zoho_books_next_retry_at,
        lastAttempt: p.updated_at,
      });
    }
  }

  // Sort all by lastAttempt descending
  entities.sort((a, b) => new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime());

  // Paginate
  const total = entities.length;
  const paginatedEntities = entities.slice(offset, offset + pageSize);

  const response: FailedEntitiesResponse = {
    entities: paginatedEntities,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  return NextResponse.json(response);
}
```

- [ ] **Step 2: Test endpoint**

```bash
curl "http://localhost:3000/api/admin/zoho/books/failed?page=1&pageSize=10" | jq
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/zoho/books/failed/route.ts
git commit -m "feat(admin): add Zoho Books failed entities endpoint"
```

---

### Task 3: Manual Sync Trigger Endpoint

**Files:**
- Create: `app/api/admin/zoho/books/sync/route.ts`

- [ ] **Step 1: Create sync trigger endpoint**

```typescript
// app/api/admin/zoho/books/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZohoBooksOrchestrator } from '@/lib/integrations/zoho/books-sync-orchestrator';

interface SyncRequest {
  type: 'full' | 'customers' | 'invoices' | 'payments';
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();
    const { type } = body;

    if (!['full', 'customers', 'invoices', 'payments'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sync type' },
        { status: 400 }
      );
    }

    const orchestrator = new ZohoBooksOrchestrator();
    let result;

    switch (type) {
      case 'full':
        result = await orchestrator.runFullSync();
        break;
      case 'customers':
        result = await orchestrator.syncCustomers();
        break;
      case 'invoices':
        result = await orchestrator.syncInvoices();
        break;
      case 'payments':
        result = await orchestrator.syncPayments();
        break;
    }

    return NextResponse.json({
      success: true,
      message: `${type} sync completed`,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed'
      },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/zoho/books/sync/route.ts
git commit -m "feat(admin): add Zoho Books manual sync trigger endpoint"
```

---

### Task 4: Single Entity Retry Endpoint

**Files:**
- Create: `app/api/admin/zoho/books/retry/route.ts`

- [ ] **Step 1: Create retry endpoint**

```typescript
// app/api/admin/zoho/books/retry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoBooksOrchestrator } from '@/lib/integrations/zoho/books-sync-orchestrator';

interface RetryRequest {
  entityType: 'customer' | 'invoice' | 'payment';
  entityId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RetryRequest = await request.json();
    const { entityType, entityId } = body;

    if (!['customer', 'invoice', 'payment'].includes(entityType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid entity type' },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { success: false, message: 'Entity ID required' },
        { status: 400 }
      );
    }

    const orchestrator = new ZohoBooksOrchestrator();
    const supabase = await createClient();

    // Reset status to pending for retry
    const table = entityType === 'customer' ? 'customers'
                : entityType === 'invoice' ? 'customer_invoices'
                : 'payment_transactions';

    await supabase
      .from(table)
      .update({ zoho_sync_status: 'pending' })
      .eq('id', entityId);

    // Trigger sync for this entity type
    let result;
    switch (entityType) {
      case 'customer':
        result = await orchestrator.syncCustomers();
        break;
      case 'invoice':
        result = await orchestrator.syncInvoices();
        break;
      case 'payment':
        result = await orchestrator.syncPayments();
        break;
    }

    // Check if entity was synced
    const { data: entity } = await supabase
      .from(table)
      .select(entityType === 'customer' ? 'zoho_books_contact_id'
            : entityType === 'invoice' ? 'zoho_books_invoice_id'
            : 'zoho_books_payment_id')
      .eq('id', entityId)
      .single();

    const zohoId = entity?.[
      entityType === 'customer' ? 'zoho_books_contact_id'
      : entityType === 'invoice' ? 'zoho_books_invoice_id'
      : 'zoho_books_payment_id'
    ];

    return NextResponse.json({
      success: !!zohoId,
      message: zohoId ? 'Entity synced successfully' : 'Sync attempted but entity not synced',
      zohoId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Retry failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/zoho/books/retry/route.ts
git commit -m "feat(admin): add Zoho Books single entity retry endpoint"
```

---

### Task 5: Retry All Endpoint

**Files:**
- Create: `app/api/admin/zoho/books/retry-all/route.ts`

- [ ] **Step 1: Create retry-all endpoint**

```typescript
// app/api/admin/zoho/books/retry-all/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoBooksOrchestrator } from '@/lib/integrations/zoho/books-sync-orchestrator';

export async function POST() {
  try {
    const supabase = await createClient();

    // Count failed entities before
    const { count: beforeCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: beforeInvoices } = await supabase
      .from('customer_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: beforePayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const processed = (beforeCustomers || 0) + (beforeInvoices || 0) + (beforePayments || 0);

    // Reset all failed to pending
    await supabase
      .from('customers')
      .update({ zoho_sync_status: 'pending' })
      .eq('zoho_sync_status', 'failed');

    await supabase
      .from('customer_invoices')
      .update({ zoho_sync_status: 'pending' })
      .eq('zoho_sync_status', 'failed');

    await supabase
      .from('payment_transactions')
      .update({ zoho_sync_status: 'pending' })
      .eq('zoho_sync_status', 'failed');

    // Run full sync
    const orchestrator = new ZohoBooksOrchestrator();
    await orchestrator.runFullSync();

    // Count still failed after
    const { count: afterCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: afterInvoices } = await supabase
      .from('customer_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: afterPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const failed = (afterCustomers || 0) + (afterInvoices || 0) + (afterPayments || 0);
    const succeeded = processed - failed;

    return NextResponse.json({
      success: true,
      processed,
      succeeded,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, processed: 0, succeeded: 0, failed: 0 },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/zoho/books/retry-all/route.ts
git commit -m "feat(admin): add Zoho Books retry all endpoint"
```

---

### Task 6: Reset Retry Count Endpoint

**Files:**
- Create: `app/api/admin/zoho/books/reset/route.ts`

- [ ] **Step 1: Create reset endpoint**

```typescript
// app/api/admin/zoho/books/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ResetRequest {
  entityType: 'customer' | 'invoice' | 'payment';
  entityId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetRequest = await request.json();
    const { entityType, entityId } = body;

    if (!['customer', 'invoice', 'payment'].includes(entityType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid entity type' },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { success: false, message: 'Entity ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const table = entityType === 'customer' ? 'customers'
                : entityType === 'invoice' ? 'customer_invoices'
                : 'payment_transactions';

    const { error } = await supabase
      .from(table)
      .update({
        zoho_books_retry_count: 0,
        zoho_books_next_retry_at: null,
        zoho_sync_status: 'pending',
        zoho_sync_error: null,
      })
      .eq('id', entityId);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Retry count reset successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Reset failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/zoho/books/reset/route.ts
git commit -m "feat(admin): add Zoho Books reset retry count endpoint"
```

---

## Chunk 2: Admin Page Component

### Task 7: Main Dashboard Page

**Files:**
- Create: `app/admin/integrations/zoho-books/page.tsx`

- [ ] **Step 1: Create page component**

```typescript
// app/admin/integrations/zoho-books/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiBooksBold,
  PiUsersBold,
  PiFilePdfBold,
  PiCreditCardBold,
  PiWarningBold,
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiClockBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';

interface HealthData {
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

interface FailedEntity {
  type: 'customer' | 'invoice' | 'payment';
  id: string;
  displayId: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastAttempt: string;
}

interface FailedResponse {
  entities: FailedEntity[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function ZohoBooksAdminPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [failed, setFailed] = useState<FailedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/zoho/books/health');
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  }, []);

  const fetchFailed = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/zoho/books/failed?page=${page}&pageSize=10`);
      const data = await res.json();
      setFailed(data);
    } catch (error) {
      console.error('Failed to fetch failed entities:', error);
    }
  }, [page]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchHealth(), fetchFailed()]);
      setLoading(false);
    };
    load();
  }, [fetchHealth, fetchFailed]);

  const handleSync = async (type: 'full' | 'customers' | 'invoices' | 'payments') => {
    setSyncing(type);
    try {
      await fetch('/api/admin/zoho/books/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      await Promise.all([fetchHealth(), fetchFailed()]);
    } finally {
      setSyncing(null);
    }
  };

  const handleRetry = async (entityType: string, entityId: string) => {
    await fetch('/api/admin/zoho/books/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId }),
    });
    await Promise.all([fetchHealth(), fetchFailed()]);
  };

  const handleReset = async (entityType: string, entityId: string) => {
    await fetch('/api/admin/zoho/books/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId }),
    });
    await fetchFailed();
  };

  const handleRetryAll = async () => {
    setSyncing('retry-all');
    try {
      await fetch('/api/admin/zoho/books/retry-all', { method: 'POST' });
      await Promise.all([fetchHealth(), fetchFailed()]);
    } finally {
      setSyncing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'customer': return <PiUsersBold className="w-4 h-4" />;
      case 'invoice': return <PiFilePdfBold className="w-4 h-4" />;
      case 'payment': return <PiCreditCardBold className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <PiBooksBold className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zoho Books Integration</h1>
            <p className="text-gray-500">Accounting sync for customers, invoices, payments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {health && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
              {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </span>
          )}
          <button
            onClick={() => Promise.all([fetchHealth(), fetchFailed()])}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <PiArrowsClockwiseBold className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {health && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Customers"
            value={`${health.stats.customersSynced}/${health.stats.customersTotal}`}
            subtitle="synced"
            icon={<PiUsersBold className="w-5 h-5" />}
          />
          <StatCard
            title="Invoices"
            value={`${health.stats.invoicesSynced}/${health.stats.invoicesTotal}`}
            subtitle="synced"
            icon={<PiFilePdfBold className="w-5 h-5" />}
          />
          <StatCard
            title="Payments"
            value={`${health.stats.paymentsSynced}/${health.stats.paymentsTotal}`}
            subtitle="synced"
            icon={<PiCreditCardBold className="w-5 h-5" />}
          />
          <StatCard
            title="Failed"
            value={health.stats.failedCount.toString()}
            subtitle="pending"
            icon={<PiWarningBold className="w-5 h-5" />}
            variant={health.stats.failedCount > 0 ? 'danger' : 'default'}
          />
        </div>
      )}

      {/* Health Checks & Quick Actions */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Health Checks */}
        <SectionCard title="Health Checks">
          <div className="space-y-3">
            {health && Object.entries(health.checks).map(([key, check]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  {check.status === 'pass' ? (
                    <PiCheckCircleBold className="w-5 h-5 text-green-500" />
                  ) : (
                    <PiXCircleBold className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{check.message}</span>
                  {check.duration_ms && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{check.duration_ms}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSync('full')}
                disabled={!!syncing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {syncing === 'full' && <span className="animate-spin">⟳</span>}
                Run Full Sync
              </button>
              <button
                onClick={() => handleSync('customers')}
                disabled={!!syncing}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {syncing === 'customers' ? '⟳' : ''} Customers
              </button>
              <button
                onClick={() => handleSync('invoices')}
                disabled={!!syncing}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {syncing === 'invoices' ? '⟳' : ''} Invoices
              </button>
              <button
                onClick={() => handleSync('payments')}
                disabled={!!syncing}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {syncing === 'payments' ? '⟳' : ''} Payments
              </button>
            </div>

            {health?.lastSync && (
              <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
                <PiClockBold className="w-4 h-4" />
                <span>Last sync: {new Date(health.lastSync.timestamp).toLocaleString()}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{health.lastSync.duration_ms}ms</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  health.lastSync.result === 'success' ? 'bg-green-100 text-green-700' :
                  health.lastSync.result === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {health.lastSync.result}
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Failed Entities Table */}
      <SectionCard
        title="Failed Entities"
        action={
          failed && failed.entities.length > 0 && (
            <button
              onClick={handleRetryAll}
              disabled={!!syncing}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
            >
              {syncing === 'retry-all' ? '⟳ Retrying...' : 'Retry All Failed'}
            </button>
          )
        }
      >
        {failed && failed.entities.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Entity ID</th>
                  <th className="pb-2">Error</th>
                  <th className="pb-2">Retries</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {failed.entities.map((entity) => (
                  <tr key={`${entity.type}-${entity.id}`} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(entity.type)}
                        <span className="capitalize">{entity.type}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-sm">{entity.displayId}</td>
                    <td className="py-3 text-sm text-gray-600 max-w-xs truncate" title={entity.error}>
                      {entity.error}
                    </td>
                    <td className="py-3">
                      <span className={`text-sm ${entity.retryCount >= entity.maxRetries ? 'text-red-600 font-medium' : ''}`}>
                        {entity.retryCount}/{entity.maxRetries}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRetry(entity.type, entity.id)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => handleReset(entity.type, entity.id)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {failed.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">
                  Page {failed.pagination.page} of {failed.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(failed.pagination.totalPages, p + 1))}
                    disabled={page === failed.pagination.totalPages}
                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <PiCheckCircleBold className="w-12 h-12 mx-auto mb-2 text-green-400" />
            <p>All entities synced successfully</p>
          </div>
        )}
      </SectionCard>

      {/* Details Footer */}
      {health && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex gap-6">
            <span>Region: <strong>{health.details.region}</strong></span>
            <span>Org ID: <strong>{health.details.organizationId}</strong></span>
            <span>API Latency: <strong>{health.details.apiLatencyMs}ms</strong></span>
          </div>
          <span>Last checked: {new Date(health.timestamp).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test page in browser**

Navigate to `http://localhost:3000/admin/integrations/zoho-books`

- [ ] **Step 3: Commit**

```bash
git add app/admin/integrations/zoho-books/page.tsx
git commit -m "feat(admin): add Zoho Books admin dashboard page"
```

---

### Task 8: Final Integration Commit

- [ ] **Step 1: Run type check**

```bash
npm run type-check:memory
```

- [ ] **Step 2: Test full flow**

1. Navigate to `/admin/integrations/zoho-books`
2. Verify health checks display
3. Verify stats display
4. Test manual sync buttons
5. Test retry/reset on failed entities (if any)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete Zoho Books integration dashboard

- Health check endpoint with credentials, token, API checks
- Sync stats for customers, invoices, payments
- Failed entities table with retry/reset actions
- Manual sync triggers (full, by entity type)
- Retry all failed entities in batch
- Real-time status updates"
```

---

## Verification Checklist

- [ ] All 7 API endpoints created and working
- [ ] Page loads without errors
- [ ] Health status badge updates correctly
- [ ] Stats reflect actual database counts
- [ ] Manual sync buttons trigger orchestrator
- [ ] Failed entities table displays and paginates
- [ ] Retry/reset buttons work
- [ ] Type check passes
- [ ] No console errors
