# Admin Operations Preview with Production Data — Design

**Date:** 2026-07-13

**Status:** Conversation design approved — pending written-spec review

**Target:** `staging` only

**Route:** `/admin/operations-preview`

**Prototype source:** `codex/dashboard-prototype` at `7c141bef`

**Implementation base:** current `origin/staging` at `75ee7dec`

---

## 1. Goal

Add an admin-only staging preview of the approved CircleTel staff operations dashboard and populate
it with live production aggregates. The preview must preserve the standalone prototype's CircleTel
look, Geist typography, white icon sidebar, responsive layout, and complete production capability
taxonomy while remaining strictly read-only.

The preview is an evaluation surface, not a replacement for `/admin/dashboard`. It must be possible
to turn it off without a code rollback, and its presence on staging must not expose production data
to unauthenticated or unauthorized users.

### Success criteria

- An active admin with `dashboard:view_analytics` can open
  `https://staging.circletel.co.za/admin/operations-preview` and see fresh production aggregates.
- The page is unavailable when the staging-only runtime flag is disabled.
- The page and API expose no customer, employee, ticket, invoice, order, or network PII.
- The preview cannot create, edit, delete, trigger, navigate into, or otherwise mutate production
  records.
- Query failures show an explicit unavailable state with retry; they never become plausible zeroes.
- `main`, production routing, `/admin/dashboard`, and the database schema are unchanged.

---

## 2. Scope and non-goals

### In scope

- New full-screen admin route: `/admin/operations-preview`.
- New authenticated, permission-checked `GET /api/admin/operations-preview` aggregate endpoint.
- Server-only read access to the existing production Supabase project already configured for staging.
- Existing production admin capability hierarchy adapted into the approved prototype navigation.
- Production-backed KPI, growth, operations, and finance summaries.
- Loading, unauthorized, forbidden, unavailable, and success states.
- Staging-only runtime flag, focused automated tests, authenticated browser verification, and rollback.

### Out of scope

- Replacing or modifying `/admin/dashboard`.
- Adding the preview to the production feature registry or normal admin sidebar in this first release.
- Creating mutation endpoints or enabling prototype quick actions and production navigation links.
- Customer-level drill-down, tables of records, search, export, or PII.
- Schema changes, migrations, materialized views, RPCs, or scheduled aggregation jobs.
- Deploying or enabling the route on `main`/production.

---

## 3. Delivery strategy

The prototype branch and staging have diverged. The implementation must therefore start from the
current `origin/staging` and selectively transplant the approved prototype rather than merge the
prototype branch history wholesale.

The implementation branch is `codex/staging-operations-preview`, created from `origin/staging`.
Only the route-local visual pieces, navigation adapter, interaction containment, relevant tests,
and required shared-component adjustments should be ported. Current staging auth, workspace
navigation, registry, middleware, and deployment behavior remain authoritative.

The first staging release is reachable by direct URL only. This avoids a client-side feature-flag
branch in the shared production navigation and keeps the preview isolated until it has been
validated with staff.

After the written design and implementation plan are approved, execution follows the requested
subagent-driven workflow: bounded implementation tasks are delegated one at a time, with a
requirements review and code-quality review before the next dependent task begins. The primary
agent remains responsible for integrating changes, running the final verification, and protecting
the shared worktree.

---

## 4. Security and access control

Security is enforced in layers. No single client check is treated as sufficient.

### 4.1 Runtime environment gate

- Server-only environment variable: `OPERATIONS_PREVIEW_ENABLED=true`.
- The page server component and API route both evaluate the flag at request time.
- When the flag is absent or not exactly `true`, both surfaces return a generic 404.
- The variable is added only to `/home/circletel/.env.staging` for the staging container. It is not
  added to public client environment variables or enabled in production.
- The route remains compiled into the image so disabling it requires only an environment change and
  container restart.

### 4.2 Authentication and permission

The data endpoint uses the repository's existing admin API pattern:

1. `authenticateAdmin(request)` validates Bearer token first and cookie session second.
2. The matching `admin_users` row must exist and have `is_active = true`.
3. `requirePermission(adminUser, PERMISSIONS.DASHBOARD.VIEW_ANALYTICS)` must pass. Super admins
   retain the helper's existing all-permissions behavior.

Response behavior:

- `401`: the client redirects to `/admin/login?redirect=/admin/operations-preview`.
- `403`: the page shows a contained access-denied state and no dashboard data.
- `404`: the feature is disabled; do not reveal that a hidden preview exists.

The route is added to `AdminLayoutClient` as an **auth-guarded full-screen route** so it keeps the
approved standalone shell without inheriting the normal admin header/sidebar. Unlike the existing
CMS full-screen bypass, this route must finish the existing `/api/admin/me` authentication check
before rendering its children. The preview client then renders a neutral data-loading state until
the permission-protected aggregate endpoint has succeeded; unauthenticated users must not see the
preview shell or any production-derived values.

### 4.3 Server-only data boundary

- The aggregate reader begins with `import 'server-only'`.
- It uses `createClient()` from `lib/supabase/server.ts`; the service-role key never reaches a client
  component or JSON response.
- The endpoint exports `GET` only. There are no `POST`, `PUT`, `PATCH`, or `DELETE` handlers.
- All UI actions and capability links are visibly contained in preview mode. They may expand nested
  groups, switch dashboard tabs, or change chart presentation, but they may not leave the preview,
  invoke an API mutation, or open a production admin record.
- Structured server logs may record request ID, timing, result, and the authenticated admin UUID.
  They must not log service-role credentials, query payloads, PII, or returned aggregates.

---

## 5. Architecture and data flow

```text
Authenticated staging admin
          |
          v
/admin/operations-preview  -- runtime flag --> 404 when disabled
          |
          | GET only
          v
/api/admin/operations-preview
  |-- runtime flag
  |-- authenticateAdmin
  |-- dashboard:view_analytics
  |-- private, no-store
          |
          v
server-only aggregate reader
          |
          | minimal columns, paginated reads, no writes
          v
Production Supabase project
          |
          v
PII-free typed aggregate response
```

### 5.1 Proposed module boundaries

Exact filenames may be adjusted to existing staging conventions during planning, but responsibilities
remain separated:

- `app/admin/operations-preview/page.tsx`: runtime gate and full-screen route entry.
- `app/admin/operations-preview/OperationsPreviewClient.tsx`: fetch lifecycle and dashboard states.
- Route-local dashboard components/navigation: selectively ported approved presentation and contained
  interactions from `/demo/dashboard`.
- `app/api/admin/operations-preview/route.ts`: feature gate, auth, permission, timeout, headers, and
  response mapping.
- `lib/admin/operations-preview/read.ts`: server-only minimal production queries and aggregation.
- `lib/admin/operations-preview/types.ts`: the PII-free response contract and metric primitives.
- `app/admin/AdminLayoutClient.tsx`: classify the route as full-screen while retaining the existing
  admin authentication check for this route only; do not change the CMS builder's current behavior.

The data module returns domain aggregates, not `NextResponse` objects. The route owns HTTP behavior;
the client owns only presentation and retry.

### 5.2 Query execution

- Independent table reads run concurrently after authorization.
- A request-level timeout bounds the aggregate operation. The initial target is eight seconds and
  can be adjusted from observed staging timings.
- Reads that can exceed Supabase/PostgREST's default row limit must paginate deterministic ranges.
  Sums and distinct counts must never silently use only the first page.
- Each query selects only the columns required for its aggregate and filters server-side as far as
  the existing schema permits.
- The initial contract is all-or-nothing: any required query error, parse error, or timeout rejects
  the aggregate rather than returning a partially plausible dashboard.

---

## 6. Metric definitions

All time boundaries use the `Africa/Johannesburg` timezone. Currency is returned as integer cents
and formatted as ZAR in the UI, avoiding floating-point rounding at the presentation boundary.

### 6.1 Headline KPIs

| UI label | Source | Definition |
|---|---|---|
| Active customers | `customer_services` | Count distinct `customer_id` where `status = 'active'`. |
| Active MRR | `customer_services` | Sum `monthly_price` for rows where `status = 'active'`. This is a recurring run-rate, not collected cash or recognized revenue. |
| Open tickets | `support_tickets` | Count where `status IN ('open', 'pending', 'in_progress')`. |
| Needs attention | `support_tickets` | Count open tickets above where `priority IN ('high', 'urgent')`. |
| Network incidents | `outage_incidents` | Count where `status != 'resolved' AND resolved_at IS NULL`. |
| Services impacted | `outage_incidents` | Sum `affected_customer_count` across the unresolved incidents above. A null count contributes zero. |

The ambiguous prototype label “Monthly revenue” is replaced with “Active MRR.” Empty but successful
datasets may show zero; only a successful response may produce zero-valued cards.

### 6.2 Twelve-month growth chart

The API returns twelve ordered calendar-month buckets ending with the current Johannesburg month.

- `totalCustomers`: cumulative count of `customers` rows with `created_at` on or before the end of
  that month.
- `billedCents`: sum `customer_invoices.total_amount` for invoices whose `invoice_date` falls in the
  month, excluding statuses `voided` and `cancelled`.

The chart labels the series “Total customers” and “Billed revenue.” It must not imply that invoice
totals equal cash collected.

### 6.3 Operations snapshot

| UI label | Source | Definition |
|---|---|---|
| Scheduled installs | `installation_schedules` | Count where `status IN ('scheduled', 'rescheduled')` and `scheduled_date >=` today's Johannesburg date. |
| Orders in progress | `consumer_orders` | Count where `status NOT IN ('active', 'suspended', 'cancelled', 'failed')`. |
| Priority tickets | `support_tickets` | Same open high/urgent subset used by “Needs attention.” |
| Available technicians | `technicians` | Count where `is_active = true AND status = 'available'`. |

No installation address, order number, ticket subject, technician identity, or customer identifier is
returned.

### 6.4 Current-month finance snapshot

The finance window is the current Johannesburg calendar month and uses `invoice_date` for cohorting.
Invoices with status `voided` or `cancelled` are excluded from every finance metric.

| UI label | Definition |
|---|---|
| Billed | Sum `customer_invoices.total_amount`. |
| Collected | Sum `customer_invoices.amount_paid`. |
| Outstanding | Sum `customer_invoices.amount_due`. |
| Paid invoices | Count invoices where `status = 'paid'`. |

These values describe the current invoice cohort; “Collected” is not a cash-ledger view of payments
received this month against older invoices. That broader accounting view is out of scope.

---

## 7. API contract

### 7.1 Success — `200`

```ts
type OperationsPreviewResponse = {
  success: true
  data: {
    generatedAt: string
    source: 'production'
    timeZone: 'Africa/Johannesburg'
    kpis: {
      activeCustomers: number
      activeMrrCents: number
      openTickets: number
      needsAttention: number
      networkIncidents: number
      servicesImpacted: number
    }
    growth: Array<{
      month: string       // YYYY-MM
      label: string       // short display label
      totalCustomers: number
      billedCents: number
    }>
    operations: {
      scheduledInstalls: number
      ordersInProgress: number
      priorityTickets: number
      availableTechnicians: number
    }
    finance: {
      periodStart: string // YYYY-MM-DD
      periodEnd: string   // YYYY-MM-DD, inclusive
      billedCents: number
      collectedCents: number
      outstandingCents: number
      paidInvoices: number
    }
  }
}
```

The response intentionally contains no generic row objects and no IDs, names, contact details,
addresses, descriptions, notes, subjects, invoice numbers, order numbers, or external references.

### 7.2 Failure responses

- Feature off: `404 { success: false, error: 'Not found' }`.
- Unauthenticated: existing `authenticateAdmin` 401 contract.
- Unauthorized: existing admin/permission 403 contract.
- Production data unavailable or timed out: `503` with a stable public code and request ID:

```json
{
  "success": false,
  "error": "Operations data is temporarily unavailable.",
  "code": "OPERATIONS_PREVIEW_DATA_UNAVAILABLE",
  "requestId": "<opaque UUID>"
}
```

Database details, table names, SQL/PostgREST messages, credentials, and stack traces are logged only
in sanitized server diagnostics and never returned to the browser.

### 7.3 Headers and caching

Every response from this endpoint, including auth and error paths, sets:

```text
Cache-Control: private, no-store, max-age=0
Pragma: no-cache
X-Request-Id: <opaque UUID>
```

The endpoint is dynamically rendered. Browser, CDN, and shared caches must not retain production
aggregates.

---

## 8. User experience and interaction behavior

The approved prototype visual system remains intact:

- Actual CircleTel logo and Geist font.
- White icon sidebar with the full nested production capability structure grouped for operations.
- Responsive desktop and mobile layouts.
- KPI cards, twelve-month chart, and operations/finance detail surfaces.

The production-backed preview adds:

- Persistent badge: **Production data · Read-only preview**.
- “Updated” timestamp based on `generatedAt`.
- Manual refresh/retry that only repeats the protected `GET` request.
- Skeleton/loading state before data is available.
- Contained 403 state for admins lacking analytics permission.
- Explicit unavailable state with request ID and Retry action for 503/network failures.

Preview restrictions:

- Sidebar groups and nested sections may expand and collapse, but production routes do not activate.
- Quick actions and “Create Work Item” remain visibly disabled or carry a “Preview only” affordance.
- Context menu, middle-click, modifier-click, keyboard activation, and touch long-press must not escape
  to production admin routes.
- The client performs no optimistic updates and sends no mutation requests.

---

## 9. Failure handling and observability

- Do not catch a failed table read and substitute `0`, `[]`, or the previous response.
- Do not serve fixture data when the live endpoint is unavailable on staging.
- A successful zero is distinguishable from failure because zeroes occur only inside a valid 200
  response with `generatedAt` and `source`.
- The client may retry only after user action; it does not create an unbounded polling loop.
- Server diagnostics correlate failures with `X-Request-Id` and include duration plus a normalized
  failure category. They do not log row data or credentials.
- The UI may display the request ID for support but not internal exception text.

---

## 10. Testing and verification

### 10.1 Pure aggregation tests

Fixture-driven unit tests cover:

- distinct active-customer counting with multiple services per customer;
- active MRR numeric-string conversion and cent rounding;
- ticket status and priority boundaries;
- unresolved incident counts and affected-customer sums;
- Johannesburg month boundaries, including UTC timestamps near midnight;
- cumulative customer buckets and non-cumulative monthly billed totals;
- exclusion of voided/cancelled invoices;
- scheduled/rescheduled future installation counts;
- terminal versus in-progress order status boundaries;
- current-month finance totals;
- pagination beyond 1,000 rows so totals cannot truncate silently.

### 10.2 Route tests

The API route tests prove:

- flag off returns 404 before data access;
- the page shell remains behind the existing admin authentication check even in full-screen mode;
- unauthenticated request returns 401;
- inactive/non-admin request returns 403;
- missing `dashboard:view_analytics` returns 403;
- permitted request returns the typed aggregate shape;
- the success payload contains no PII fields or source row objects;
- query failure and timeout return 503, not partial/zero data;
- every response includes private/no-store and request-ID headers;
- only `GET` exists for the endpoint.

### 10.3 Component tests

Cover loading, success, forbidden, unavailable/retry, updated timestamp, production/read-only badge,
ZAR formatting, and contained navigation/action behavior.

### 10.4 Local and staging verification

- Run focused Jest suites and the narrowest scoped TypeScript check that includes every touched file.
- Start the memory-aware local development server and inspect desktop plus 390 px mobile layouts in
  the user's chosen in-app browser.
- On staging, authenticate as an admin with the permission and as one without it.
- Compare displayed aggregates to an independent read-only production aggregate query for the same
  timestamp/window. Do not print PII during comparison.
- Inspect the browser network log: the preview should issue only its protected GET (plus existing
  authentication/session traffic) and no mutation requests.
- Confirm direct `/admin/dashboard` behavior and normal admin navigation are unchanged.

---

## 11. Staging rollout and rollback

### Rollout

1. Implement and verify on `codex/staging-operations-preview`, based on current `origin/staging`.
2. Review the focused diff; do not merge the old prototype branch history.
3. Push the feature branch and open a PR targeting `staging`.
4. Add `OPERATIONS_PREVIEW_ENABLED=true` to `/home/circletel/.env.staging` only.
5. Merge/push to `staging`; the existing staging deployment workflow builds and recreates the
   `circletel-staging` container.
6. Perform the authenticated live checks in §10.4 at `https://staging.circletel.co.za`.
7. Keep the route direct-link only while staff evaluates accuracy and usability.

No direct production deployment or production environment change is part of this work.

### Rollback

The fastest rollback is operational and does not require a code revert:

1. Set `OPERATIONS_PREVIEW_ENABLED=false` (or remove it) from `.env.staging`.
2. Recreate/restart the staging container so the runtime environment reloads.
3. Verify both the page and API return 404.

The feature commit can be reverted from `staging` later if desired. Because the feature adds no
migration, writes no production records, and does not replace `/admin/dashboard`, rollback has no
data migration or restoration step.

---

## 12. Residual risks and controls

| Risk | Control |
|---|---|
| Staging points to production Supabase | Server-only service role, admin + permission checks, aggregate-only contract, GET-only endpoint, no-store. |
| A query silently truncates at the API row limit | Deterministic pagination and >1,000-row regression test. |
| Metric meaning is misread | Explicit labels: Active MRR, Billed revenue, current invoice cohort; definitions fixed in this spec. |
| A backend failure looks like a healthy zero | All-or-nothing 503 and explicit retry state; no fixture or stale fallback. |
| Prototype navigation escapes to live admin tools | Existing containment logic retained and tested across click, keyboard, modifier, middle-click, and context-menu paths. |
| Hidden route leaks data through cache | Runtime flag on both surfaces and `private, no-store` on every API response. |
| Feature affects production | Branch and PR target `staging`; flag enabled only in staging; `/admin/dashboard` and `main` untouched. |

---

## 13. Approval checkpoint

Implementation planning begins only after the user reviews this written specification. Any change to
the route, access level, metric definitions, PII boundary, production-data source, or read-only
constraint requires an explicit design update before implementation.
