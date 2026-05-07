## Context

CircleTel already has a mature corporate client data model (`corporate_accounts` → `corporate_sites`) with 21 Unjani sites seeded, complete type system (`lib/corporate/types.ts`), CRUD service (`lib/corporate/site-service.ts`), and admin management pages (`/admin/b2b-customers`). Monitoring infrastructure runs via Inngest: Ruijie Cloud sync every 5 minutes writes to `ruijie_device_cache` and `device_health_snapshots`, with anomaly detection in `network_health_alerts`. MikroTik sync captures bandwidth data.

The portal is a **thin presentation layer** on top of these existing services. The primary new work is authentication/authorization (a 4th auth context) and RLS-scoped API routes.

Existing auth contexts: Consumer (cookies, RLS), Partner (cookies + FICA, RLS), Admin (RBAC, service role). The portal adds a 4th: B2B Customer (cookies, RLS via `b2b_portal_users` table).

## Goals / Non-Goals

**Goals:**
- Self-service portal where B2B customers can view site status, billing, and support without contacting CircleTel
- Role-based access: head office (admin) sees all sites; site-level users see only their assigned site
- Reusable across any `corporate_account`, not Unjani-specific
- Leverage existing data model and monitoring infrastructure — no duplication
- Admin-provisioned accounts with invite flow (magic link or password reset)

**Non-Goals:**
- Customer self-registration (admin provisions all accounts)
- Portal users modifying site configuration or network settings
- Real-time WebSocket monitoring (polling/cached snapshots are sufficient)
- Payment processing from portal (view invoices only, payments go through existing NetCash flow)
- Mobile app (responsive web portal is sufficient)
- TDX/ad revenue visibility (CircleTel's internal margin mechanism, not customer-facing)

## Decisions

### 1. Auth: Supabase auth + `b2b_portal_users` junction table

**Choice**: Use Supabase's built-in auth (same as Consumer/Partner) with a `b2b_portal_users` table that maps `auth.uid()` to `organisation_id` + optional `site_id` + `role`.

**Alternatives considered**:
- Separate auth system (rejected: unnecessary complexity, Supabase handles it)
- Reuse `admin_users` table with B2B role (rejected: admin uses service role which bypasses RLS — B2B needs RLS-scoped access)
- JWT custom claims for org/site (rejected: requires edge function to set claims on login, adds complexity)

**Rationale**: RLS policies can directly reference `b2b_portal_users` via `auth.uid()`, keeping all scoping in Postgres. Simple, auditable, consistent with Consumer/Partner patterns.

### 2. Middleware: New `portal-auth.ts` handler in existing pipeline

**Choice**: Add Step 3.5 in the middleware pipeline — `handlePortalAuth()` for `/portal/*` routes, between admin and ambassador auth. Pattern mirrors `admin-auth.ts` exactly.

**Alternatives considered**:
- Separate middleware file (rejected: Next.js only supports one middleware.ts)
- Shared auth handler with admin (rejected: admin uses service role, portal uses RLS — different security models)

**Rationale**: Consistent with existing middleware architecture. Portal auth checks session cookie → queries `b2b_portal_users` → redirects to `/portal/login` if no valid mapping.

### 3. API routes: `/api/portal/*` with RLS-scoped queries

**Choice**: New route group under `/api/portal/` using `createClientWithSession()` (cookie-based, RLS-respecting). Each endpoint is a thin wrapper around existing data — no new service classes needed.

**Endpoints**:
| Endpoint | Data Source | RLS Scope |
|----------|------------|-----------|
| `GET /api/portal/me` | `b2b_portal_users` + `corporate_accounts` | Own user row |
| `GET /api/portal/sites` | `corporate_sites` | org_id (admin) or site_id (site_user) |
| `GET /api/portal/sites/[id]` | `corporate_sites` | Same + join device health |
| `GET /api/portal/sites/[id]/health` | `device_health_snapshots` | Via site's ruijie_device_sn |
| `GET /api/portal/billing` | `customer_invoices` | org account_number |
| `GET /api/portal/billing/[id]/download` | Invoice PDF | Same |
| `POST /api/portal/support` | Creates support ticket | org_id context |

**Alternatives considered**:
- Reuse admin API routes with permission filtering (rejected: admin routes use service role and bypass RLS — fundamentally different trust model)
- GraphQL (rejected: overkill for 7 endpoints, adds dependency)

### 4. RLS policies: Row-level security on existing tables

**Choice**: Add RLS policies to `corporate_accounts`, `corporate_sites`, `device_health_snapshots`, `customer_invoices` that grant SELECT to authenticated users whose `auth.uid()` maps to a `b2b_portal_users` row.

**Policy logic**:
```sql
-- corporate_sites: admin sees all org sites, site_user sees only their site
CREATE POLICY portal_sites_select ON corporate_sites FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM b2b_portal_users pu
    WHERE pu.auth_user_id = auth.uid()
    AND pu.organisation_id = corporate_sites.corporate_id
    AND (pu.role = 'admin' OR pu.site_id = corporate_sites.id)
  )
);
```

**Risk**: These are additive SELECT policies — they cannot interfere with existing admin service-role queries (service role bypasses RLS). Consumer RLS is on different tables.

### 5. UI: `/portal` route group with shared layout

**Choice**: `app/portal/layout.tsx` with `PortalAuthProvider` context. Pages render role-adaptive views using the portal user's role from `/api/portal/me`.

**Pages**:
| Route | Admin View | Site User View |
|-------|-----------|---------------|
| `/portal` | Aggregate dashboard (all sites) | Single-site dashboard |
| `/portal/sites` | Site list with search/filter | Redirect to their site |
| `/portal/sites/[id]` | Site detail (any site) | Site detail (their site only) |
| `/portal/billing` | Consolidated invoices | Same (org-level billing) |
| `/portal/support` | Submit ticket (org context) | Submit ticket (site context) |

### 6. Admin provisioning: Extend existing B2B admin pages

**Choice**: Add a "Portal Users" tab to `/admin/b2b-customers/[id]` (account detail page). Admin creates user → Supabase creates auth user → inserts `b2b_portal_users` row → sends invite email via Supabase's built-in invite flow.

**Alternatives considered**:
- Separate admin page (rejected: user management belongs with the account it governs)
- CSV bulk import (deferred: can add later, single-user invite is sufficient for 21 sites)

## Risks / Trade-offs

- **[RLS policy complexity]** → Mitigation: Keep policies simple (single EXISTS subquery), test with both roles before deploy, add integration tests
- **[4th auth context adds middleware latency]** → Mitigation: Portal auth check is a single DB query, only runs on `/portal/*` paths — no impact on other routes
- **[Ruijie device_sn linkage]** → Risk: Not all sites have `ruijie_device_sn` populated (MTN LTE sites don't have Ruijie APs). Mitigation: Health endpoint returns "no monitoring data" gracefully for sites without Ruijie devices
- **[Invoice scoping]** → Risk: `customer_invoices` may not have a `corporate_account_id` foreign key — need to verify schema and potentially link via account_number. Mitigation: Check schema in implementation, add FK or use account_number join
- **[Portal user email uniqueness]** → Risk: A nurse's email might already exist in Supabase auth (as a consumer). Mitigation: Supabase auth allows one user per email — the portal user table maps the SAME auth user to a B2B context, so this is actually fine (same auth user, different portal mapping)
