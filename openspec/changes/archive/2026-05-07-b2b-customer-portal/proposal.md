## Why

CircleTel manages B2B clients (Unjani Clinics: 21 sites) with no customer-facing visibility. Nurses running individual clinics cannot see their site's connectivity status, and head office has no aggregate view across all locations. All monitoring data (Ruijie health scores, MikroTik bandwidth, uptime) already flows into the system via Inngest jobs but is only accessible through admin pages. A self-service portal eliminates support calls for basic status checks and positions CircleTel for multi-tenant B2B growth beyond Unjani.

## What Changes

- **New auth context**: Fourth authentication context (`/portal/*`) alongside Consumer, Partner, and Admin — with `b2b_portal_users` table linking Supabase auth users to `corporate_accounts` and optionally to specific `corporate_sites`
- **Role-based views**: `admin` role (head office) sees all sites in aggregate; `site_user` role (nurse) sees only their assigned site
- **Portal API routes**: RLS-scoped endpoints that wrap existing `CorporateSiteService`, Ruijie health snapshots, and `customer_invoices`
- **Portal UI**: Login, dashboard (adaptive by role), site list, site detail (status/bandwidth/uptime), billing (consolidated invoices with per-site line items), and support ticket submission
- **Admin provisioning**: User management added to existing `/admin/b2b-customers` pages — invite flow with magic link or password-based onboarding
- **Reusable design**: Built as a generic B2B portal, not Unjani-specific — any `corporate_account` can be portal-enabled via user provisioning

## Capabilities

### New Capabilities
- `portal-auth`: Fourth auth context — b2b_portal_users table, RLS policies, middleware handler, PortalAuthProvider, login/logout flows, admin invite/provisioning
- `portal-dashboard`: Role-adaptive dashboard — aggregate view (admin) vs single-site view (site_user), health score summaries, alert highlights, spending overview
- `portal-site-monitoring`: Site status pages consuming existing Ruijie health snapshots and MikroTik bandwidth data — uptime history, device health, connected clients, anomaly alerts
- `portal-billing`: Consolidated invoice view with per-site line items, invoice download, payment status
- `portal-support`: Support ticket submission from portal with site context pre-populated, ticket history view

### Modified Capabilities
- None — builds on existing `corporate_accounts`/`corporate_sites` data model and monitoring infrastructure without changing their requirements

## Impact

- **Database**: New `b2b_portal_users` table + RLS policies on `corporate_accounts`, `corporate_sites`, `customer_invoices`, monitoring snapshot tables
- **Middleware**: New `portal-auth.ts` handler added to the 5-step middleware pipeline
- **API routes**: New `/api/portal/*` route group (5-6 endpoints)
- **UI routes**: New `/portal/*` route group with layout, 6 pages
- **Auth providers**: New `PortalAuthProvider` context — must exclude from Consumer/Partner/Admin providers
- **Admin pages**: Extended `/admin/b2b-customers` with portal user management
- **Existing services reused**: `CorporateSiteService`, `ruijie-health-monitor` snapshots, `customer_invoices` queries, MikroTik sync data
