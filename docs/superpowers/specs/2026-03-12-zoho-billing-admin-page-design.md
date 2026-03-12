# Zoho Billing Admin Page Design

**Date:** 2026-03-12
**Status:** Approved
**Author:** Claude Code

## Overview

Add a dedicated admin page for Zoho Billing integration at `/admin/integrations/zoho-billing`, following the same pattern as the existing Zoho Sign page.

## Problem Statement

Currently, CircleTel has extensive Zoho Billing integration (1080+ lines in `ZohoBillingClient`) but no dedicated admin UI to:
- Monitor API health status
- View billing statistics (plans, customers, subscriptions, invoices)
- Verify OAuth token scopes
- Troubleshoot integration issues

## Solution

Create a Zoho Billing admin page with:
1. Health checks (credentials, token, API connectivity)
2. Billing statistics dashboard
3. API scopes verification
4. Real-time status updates

## Architecture

```
/admin/integrations/zoho-billing
├── Page Component
│   └── app/admin/integrations/zoho-billing/page.tsx
├── Health Check API
│   └── app/api/admin/zoho/billing/health/route.ts
└── Reuses
    └── lib/integrations/zoho/billing-client.ts
```

## Health Checks

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| Credentials | ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORG_ID | All present |
| Token Refresh | Refresh access token | Returns valid access_token |
| Scopes | Verify ZohoSubscriptions scope present | Contains `ZohoSubscriptions` |
| API Connection | Call `/plans` endpoint | Returns code 0 |

## Statistics Dashboard

| Stat | API Endpoint | Icon |
|------|--------------|------|
| Plans | `/plans` count | PiListBulletsBold |
| Customers | `/customers` count | PiUsersBold |
| Active Subscriptions | `/subscriptions?status=active` count | PiRepeatBold |
| Pending Invoices | `/invoices?status=pending` count | PiFilePdfBold |

## UI Components

Reuse existing shared components:
- `StatCard` from `components/admin/shared/StatCard`
- `SectionCard` from `components/admin/shared/SectionCard`

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Zoho Billing Integration         [Status] [Refresh]│
├─────────────────────────────────────────────────────────────┤
│  Stats Grid (4 columns)                                      │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │  Plans   │Customers │  Subs    │ Invoices │              │
│  │   24     │   30     │    1     │   47     │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │   Health Checks     │  │    API Scopes       │           │
│  │ ✅ Credentials      │  │ ✅ ZohoCRM.*        │           │
│  │ ✅ Token Refresh    │  │ ✅ ZohoSubscriptions│           │
│  │ ✅ API Connection   │  │ ✅ ZohoSign.*       │           │
│  └─────────────────────┘  └─────────────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Last checked: 2026-03-12 08:30:00                          │
└─────────────────────────────────────────────────────────────┘
```

## API Response Shape

```typescript
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

interface CheckResult {
  status: 'pass' | 'fail';
  message: string;
  duration_ms?: number;
}
```

## Files to Create

1. `app/admin/integrations/zoho-billing/page.tsx` - Main page component
2. `app/api/admin/zoho/billing/health/route.ts` - Health check API endpoint

## Files to Reference

- `app/admin/integrations/zoho-sign/page.tsx` - Pattern to follow
- `app/api/admin/zoho/sign/health/route.ts` - API pattern to follow
- `lib/integrations/zoho/billing-client.ts` - Existing client to use

## Security

- Requires admin authentication via `authenticateAdmin()`
- No sensitive data exposed in responses
- Rate limited via existing Zoho rate limiter

## Testing

1. Verify health check returns correct status
2. Verify stats are accurate
3. Verify scopes are displayed correctly
4. Test unhealthy states (missing env vars, invalid token)

## Success Criteria

- [ ] Page loads at `/admin/integrations/zoho-billing`
- [ ] Shows healthy/unhealthy status correctly
- [ ] Displays all billing statistics
- [ ] Shows granted OAuth scopes
- [ ] Refresh button updates data
- [ ] Matches design system (slate-50 background, white cards)

---

**Approved by:** User
**Approval Date:** 2026-03-12
