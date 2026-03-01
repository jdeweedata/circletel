# Context Loading Notes

Guide for efficient context management in CircleTel project.

## Large Files (Use Line Ranges)

These files exceed 1000 lines. Load specific sections, not the whole file.

| File | Lines | Key Sections |
|------|-------|--------------|
| `lib/notifications/notification-service.ts` | 2,388 | Templates: 100-300, Send functions: 500-800 |
| `app/admin/products/page.tsx` | 1,709 | Table: 200-400, Filters: 500-700, Actions: 1000-1200 |
| `app/admin/sales/feasibility/page.tsx` | 1,524 | Form: 100-400, Coverage check: 600-900, Results: 1100-1400 |
| `app/admin/sales/feasibility/components/SingleSiteStepper.tsx` | 1,363 | Steps: 100-300, Validation: 400-600 |
| `app/terms/page.tsx` | 1,243 | Legal content (rarely need to load) |
| `app/admin/quotes/new/page.tsx` | 1,201 | Form: 100-400, Preview: 600-900 |
| `components/business-dashboard/site-details/SiteDetailsForm.tsx` | 1,185 | Fields: 100-400, Validation: 600-800 |
| `lib/integrations/zoho/billing-client.ts` | 1,178 | Auth: 50-150, Invoice: 300-500, Customer: 600-800 |
| `app/admin/field-ops/page.tsx` | 1,156 | Jobs list: 100-400, Map: 500-700 |
| `app/admin/orders/[id]/page.tsx` | 1,122 | Overview: 100-300, Installation: 400-600, Financials: 700-900 |

### Loading Pattern

```
INSTEAD OF:
"Load lib/notifications/notification-service.ts"

DO THIS:
"Show me notification-service.ts lines 500-600"
"Find the sendInvoiceEmail function"
```

## Skip These (Run Commands Instead)

| Directory | Why | Alternative |
|-----------|-----|-------------|
| `__tests__/` | Run tests, don't read them | `npm test -- [testfile]` |
| `supabase/migrations/` | Reference by name | `ls supabase/migrations/` |
| `.worktrees/` | Duplicate of main code | Use main branch files |
| `coverage/` | Generated reports | `npm run test:coverage` |
| `node_modules/` | Dependencies | Check package.json |

## Load Together (Related Systems)

When working on these features, load these files together:

### Authentication
```
lib/supabase/server.ts
lib/supabase/client.ts
middleware.ts
app/api/auth/[...route]/route.ts
```

### Billing/Payments
```
lib/billing/paynow-billing-service.ts
lib/payments/providers/netcash/netcash-provider.ts
app/api/billing/*/route.ts
```

### Coverage Checks
```
lib/coverage/aggregation-service.ts
lib/coverage/mtn-provider.ts
app/api/coverage/*/route.ts
```

### Admin Dashboard
```
app/admin/layout.tsx
components/admin/AdminSidebar.tsx
lib/admin/permissions.ts
```

### B2B/Partner Portal
```
app/partners/*/page.tsx
lib/partners/compliance-requirements.ts
components/partners/*/
```

## Entry Points

Start here to understand the system:

| Purpose | File | Notes |
|---------|------|-------|
| App structure | `app/layout.tsx` | Root layout, providers |
| Auth flow | `middleware.ts` | Route protection |
| Database | `lib/supabase/server.ts` | Server-side client |
| Types | `types/database.ts` | All DB types |
| API patterns | `app/api/coverage/check/route.ts` | Good API example |

## Current Session Focus

<!-- Update this each session -->
**Working on**: [Current feature/task]
**Key files**: [Files being modified]
**Don't load**: [Files not relevant to current work]

---

## Token Budget Quick Reference

```
🟢 Green  (<70%)  - Load freely
🟡 Yellow (70-85%) - Use line ranges
🔴 Red    (>85%)  - Essentials only
```

**Estimate**: 1 token ≈ 4 characters ≈ 0.75 words

---

*Last updated: 2026-03-01*
