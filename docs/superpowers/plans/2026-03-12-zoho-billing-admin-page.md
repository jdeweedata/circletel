# Zoho Billing Admin Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated admin page for Zoho Billing integration at `/admin/integrations/zoho-billing` with health checks and statistics dashboard.

**Architecture:** Two files following existing Zoho Sign pattern - a health check API endpoint that verifies OAuth credentials and API connectivity, and a React page component that displays health status and billing statistics.

**Tech Stack:** Next.js 15, TypeScript, React, Tailwind CSS, Zoho Billing API (ZohoSubscriptions)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/api/admin/zoho/billing/health/route.ts` | Health check API - verifies credentials, token, API, returns stats |
| Create | `app/admin/integrations/zoho-billing/page.tsx` | Admin UI - displays health, stats, scopes |

---

## Chunk 1: Health Check API

### Task 1: Create Health Check API Endpoint

**Files:**
- Create: `app/api/admin/zoho/billing/health/route.ts`
- Reference: `app/api/admin/zoho/sign/health/route.ts` (pattern)
- Reference: `lib/integrations/zoho/billing-client.ts` (client)

- [ ] **Step 1: Create the route file with imports and types**

```typescript
/**
 * Zoho Billing Health Check Endpoint
 * GET /api/admin/zoho/billing/health
 *
 * Verifies Zoho Billing integration is properly configured and working.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface CheckResult {
  status: 'pass' | 'fail';
  message: string;
  duration_ms?: number;
}

interface ZohoBillingHealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: CheckResult;
    tokenRefresh: CheckResult;
    apiConnection: CheckResult;
  };
  stats: {
    plansCount: number;
    customersCount: number;
    activeSubscriptionsCount: number;
    pendingInvoicesCount: number;
  };
  details: {
    region: string;
    organizationId: string;
    scopes: string[];
    apiLatencyMs: number;
  };
}
```

- [ ] **Step 2: Add the GET handler with credentials check**

```typescript
export async function GET(request: NextRequest) {
  // Authenticate admin
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const result: ZohoBillingHealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      credentials: { status: 'fail', message: 'Not checked' },
      tokenRefresh: { status: 'fail', message: 'Not checked' },
      apiConnection: { status: 'fail', message: 'Not checked' },
    },
    stats: {
      plansCount: 0,
      customersCount: 0,
      activeSubscriptionsCount: 0,
      pendingInvoicesCount: 0,
    },
    details: {
      region: 'US',
      organizationId: '',
      scopes: [],
      apiLatencyMs: 0,
    },
  };

  // Check 1: Credentials configured
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const orgId = process.env.ZOHO_ORG_ID;
  const region = process.env.ZOHO_REGION || 'US';

  if (!clientId || !clientSecret || !refreshToken || !orgId) {
    const missing = [];
    if (!clientId) missing.push('ZOHO_CLIENT_ID');
    if (!clientSecret) missing.push('ZOHO_CLIENT_SECRET');
    if (!refreshToken) missing.push('ZOHO_REFRESH_TOKEN');
    if (!orgId) missing.push('ZOHO_ORG_ID');

    result.checks.credentials = {
      status: 'fail',
      message: `Missing environment variables: ${missing.join(', ')}`,
    };
    result.status = 'unhealthy';

    return NextResponse.json(result, { status: 503 });
  }

  result.checks.credentials = {
    status: 'pass',
    message: 'All required credentials configured',
  };
  result.details.region = region;
  result.details.organizationId = orgId;
```

- [ ] **Step 3: Add token refresh check**

```typescript
  // Check 2: Token refresh
  const tokenStartTime = Date.now();
  let billingClient: ZohoBillingClient;

  try {
    billingClient = new ZohoBillingClient();
    // Force token refresh by making a lightweight API call
    await billingClient.getPlans({ page: 1, per_page: 1 });

    result.checks.tokenRefresh = {
      status: 'pass',
      message: 'Successfully refreshed access token',
      duration_ms: Date.now() - tokenStartTime,
    };
    result.details.scopes = [
      'ZohoCRM.modules.ALL',
      'ZohoCRM.settings.ALL',
      'ZohoSubscriptions.fullaccess.all',
      'ZohoSign.documents.ALL',
    ];
  } catch (error) {
    result.checks.tokenRefresh = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Token refresh failed',
      duration_ms: Date.now() - tokenStartTime,
    };
    result.status = 'unhealthy';

    return NextResponse.json(result, { status: 503 });
  }
```

- [ ] **Step 4: Add API connection check and stats gathering**

```typescript
  // Check 3: API connection and gather stats
  const apiStartTime = Date.now();

  try {
    // Fetch stats in parallel
    const [plansRes, customersRes, subscriptionsRes, invoicesRes] = await Promise.all([
      billingClient.getPlans({ page: 1, per_page: 1 }),
      billingClient.getCustomers({ page: 1, per_page: 1 }),
      billingClient.getSubscriptions({ status: 'live', page: 1, per_page: 1 }),
      billingClient.getInvoices({ status: 'pending', page: 1, per_page: 1 }),
    ]);

    result.checks.apiConnection = {
      status: 'pass',
      message: 'Successfully connected to Zoho Billing API',
      duration_ms: Date.now() - apiStartTime,
    };
    result.details.apiLatencyMs = Date.now() - apiStartTime;

    // Extract counts from page_context
    result.stats.plansCount = plansRes.page_context?.total || 0;
    result.stats.customersCount = customersRes.page_context?.total || 0;
    result.stats.activeSubscriptionsCount = subscriptionsRes.page_context?.total || 0;
    result.stats.pendingInvoicesCount = invoicesRes.page_context?.total || 0;
  } catch (error) {
    result.checks.apiConnection = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'API connection failed',
      duration_ms: Date.now() - apiStartTime,
    };
    result.status = 'degraded';
  }
```

- [ ] **Step 5: Add status determination and return response**

```typescript
  // Determine overall status
  const allPassed = Object.values(result.checks).every(c => c.status === 'pass');
  const anyFailed = Object.values(result.checks).some(c => c.status === 'fail');

  if (allPassed) {
    result.status = 'healthy';
  } else if (anyFailed) {
    result.status = 'unhealthy';
  } else {
    result.status = 'degraded';
  }

  return NextResponse.json(result, {
    status: result.status === 'healthy' ? 200 : 503
  });
}
```

- [ ] **Step 6: Verify the file compiles**

Run: `npx tsc --noEmit app/api/admin/zoho/billing/health/route.ts`
Expected: No errors

- [ ] **Step 7: Commit the health check API**

```bash
git add app/api/admin/zoho/billing/health/route.ts
git commit -m "feat(admin): add Zoho Billing health check API endpoint

- Verifies OAuth credentials, token refresh, and API connectivity
- Returns billing statistics (plans, customers, subscriptions, invoices)
- Follows existing Zoho Sign health check pattern

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Chunk 2: Admin Page Component

### Task 2: Create Admin Page Component

**Files:**
- Create: `app/admin/integrations/zoho-billing/page.tsx`
- Reference: `app/admin/integrations/zoho-sign/page.tsx` (pattern)
- Reference: `components/admin/shared/StatCard.tsx`
- Reference: `components/admin/shared/SectionCard.tsx`

- [ ] **Step 1: Create the page file with imports and types**

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  PiCheckCircleBold,
  PiWarningBold,
  PiXCircleBold,
  PiArrowClockwiseBold,
  PiListBulletsBold,
  PiUsersBold,
  PiRepeatBold,
  PiFilePdfBold,
  PiClockBold,
  PiLinkBold
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';

interface CheckResult {
  status: 'pass' | 'fail';
  message: string;
  duration_ms?: number;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: CheckResult;
    tokenRefresh: CheckResult;
    apiConnection: CheckResult;
  };
  stats: {
    plansCount: number;
    customersCount: number;
    activeSubscriptionsCount: number;
    pendingInvoicesCount: number;
  };
  details: {
    region: string;
    organizationId: string;
    scopes: string[];
    apiLatencyMs: number;
  };
}
```

- [ ] **Step 2: Add the component with state and fetch logic**

```typescript
export default function ZohoBillingPage() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/zoho/billing/health');
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);
```

- [ ] **Step 3: Add helper functions for status display**

```typescript
  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return <PiCheckCircleBold className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <PiWarningBold className="h-6 w-6 text-yellow-500" />;
      case 'unhealthy':
        return <PiXCircleBold className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getCheckStatusIcon = (status: 'pass' | 'fail') => {
    return status === 'pass'
      ? <PiCheckCircleBold className="h-5 w-5 text-green-500" />
      : <PiXCircleBold className="h-5 w-5 text-red-500" />;
  };
```

- [ ] **Step 4: Add the header JSX**

```typescript
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <PiRepeatBold className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Zoho Billing Integration</h1>
                <p className="text-slate-500">Subscription management and invoicing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {health && (
                <div className={`px-4 py-2 rounded-full border font-medium flex items-center gap-2 ${getStatusColor(health.status)}`}>
                  {getStatusIcon(health.status)}
                  <span className="capitalize">{health.status}</span>
                </div>
              )}
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <PiArrowClockwiseBold className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
```

- [ ] **Step 5: Add error state and stats grid**

```typescript
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <PiXCircleBold className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Plans"
              value={health.stats.plansCount.toString()}
              icon={<PiListBulletsBold className="h-5 w-5" />}
            />
            <StatCard
              label="Customers"
              value={health.stats.customersCount.toString()}
              icon={<PiUsersBold className="h-5 w-5" />}
            />
            <StatCard
              label="Active Subscriptions"
              value={health.stats.activeSubscriptionsCount.toString()}
              icon={<PiRepeatBold className="h-5 w-5" />}
            />
            <StatCard
              label="Pending Invoices"
              value={health.stats.pendingInvoicesCount.toString()}
              icon={<PiFilePdfBold className="h-5 w-5" />}
            />
          </div>
        )}
```

- [ ] **Step 6: Add health checks and scopes sections**

```typescript
        {/* Health Checks and Scopes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Health Checks" icon={PiCheckCircleBold}>
            {loading && !health ? (
              <div className="flex items-center justify-center py-8">
                <PiArrowClockwiseBold className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                {Object.entries(health.checks).map(([key, check]) => (
                  <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    {getCheckStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {check.duration_ms && (
                          <span className="text-sm text-slate-500">{check.duration_ms}ms</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{check.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="API Scopes" icon={PiUsersBold}>
            {health?.details?.scopes ? (
              <div className="space-y-2">
                {health.details.scopes.map((scope) => (
                  <div key={scope} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <PiCheckCircleBold className="h-4 w-4 text-green-500" />
                    <code className="text-sm text-slate-700">{scope}</code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Scopes will appear once connected</p>
            )}
          </SectionCard>
        </div>
```

- [ ] **Step 7: Add details section and close the component**

```typescript
        {/* Details Section */}
        {health && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <PiLinkBold className="h-4 w-4" />
                Region
              </div>
              <p className="font-medium text-slate-900">{health.details.region}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <PiLinkBold className="h-4 w-4" />
                Organization ID
              </div>
              <p className="font-medium text-slate-900">{health.details.organizationId}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <PiClockBold className="h-4 w-4" />
                API Latency
              </div>
              <p className="font-medium text-slate-900">{health.details.apiLatencyMs}ms</p>
            </div>
          </div>
        )}

        {/* Last Check */}
        {health && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify the file compiles**

Run: `npx tsc --noEmit app/admin/integrations/zoho-billing/page.tsx`
Expected: No errors

- [ ] **Step 9: Commit the admin page**

```bash
git add app/admin/integrations/zoho-billing/page.tsx
git commit -m "feat(admin): add Zoho Billing integration admin page

- Displays health status, billing statistics, and API scopes
- Shows plans, customers, subscriptions, and pending invoices counts
- Follows existing Zoho Sign page pattern with shared components

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Chunk 3: Verification

### Task 3: Verify Implementation

- [ ] **Step 1: Run type check**

Run: `npm run type-check:memory`
Expected: No errors related to new files

- [ ] **Step 2: Start dev server and test page**

Run: `npm run dev:memory`
Navigate to: `http://localhost:3000/admin/integrations/zoho-billing`
Expected: Page loads with health status and stats

- [ ] **Step 3: Verify health check API**

Run: `curl http://localhost:3000/api/admin/zoho/billing/health`
Expected: JSON response with status, checks, stats, details

- [ ] **Step 4: Final commit with verification**

```bash
git add .
git commit -m "docs: add Zoho Billing admin page implementation plan

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] Page loads at `/admin/integrations/zoho-billing`
- [ ] Shows healthy/unhealthy status correctly
- [ ] Displays all billing statistics (plans, customers, subscriptions, invoices)
- [ ] Shows granted OAuth scopes
- [ ] Refresh button updates data
- [ ] Matches design system (slate-50 background, white cards)
