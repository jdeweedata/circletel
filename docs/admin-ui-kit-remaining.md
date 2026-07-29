---
title: Admin UI kit — remaining and optional work
status: open
created: 2026-07-27
related:
  - docs/admin-ui-consistency-audit.md
  - docs/admin-nav-map.md
  - docs/design/BACKEND_UI_KIT.md
---

# Admin UI kit — remaining and optional

## Done (hubs)

Major workspaces migrated to `AdminPage` + `PageHeader` (+ kit states where applied):

- Billing hub + billing subpages
- Finance (outstanding, AR, reconciliation) + Payments
- Ops (orders, fulfillment, field-ops)
- Customers / B2B / corporate / partners / Unjani / vetting
- Network / coverage / marketing / CMS / competitor analysis / diagnostics
- Integrations / settings / users / notifications / workflow / orchestrator / audit-logs / zoho

Primitives added: `AdminPage`, aligned `DetailPageHeader` (backend), double-shell layout fixes.

---

## Left to do (recommended)

### 1. Detail / deep-link routes (`*/[id]`)

Many list hubs are on the kit; detail pages are uneven.

Priority examples:

- [ ] `/admin/orders/[id]` (partially wrapped — finish full DetailPageHeader)
- [ ] `/admin/customers/[id]` (partial)
- [ ] `/admin/billing/invoices/[id]` (+ preview)
- [ ] `/admin/b2b-customers/[id]`, site-details `[id]`
- [ ] `/admin/corporate/[id]`, sites `[siteId]`
- [ ] `/admin/partners/[id]`
- [ ] `/admin/network/devices/[sn]`, outages `[id]`, mikrotik `[id]`
- [ ] `/admin/diagnostics/[id]`
- [ ] `/admin/b2b/vetting/[submissionId]`

**Standard:** `AdminPage` + `DetailPageHeader` (breadcrumbs + status) + `SectionCard` / `InfoRow` + `StatusBadge`.

### 2. Remaining list / tool pages not in hub pass

- [ ] Coverage: analytics, maps, monitoring, base-stations (+ map), dfa-buildings (+ map), mtn-maps, providers, configuration, testing
- [ ] Network: analytics, map, mikrotik list
- [ ] Marketing: announcements, assets, campaign-builder, contract-map
- [ ] Competitor: matching, analytics, providers `[slug]`
- [ ] Integrations: interstellio, zoho-billing/books/sign, whatsapp-campaign, `[slug]` + logs
- [ ] CMS: media (stub/thin); builder **keep full-screen** (do not force AdminPage)

### 3. Consistency hardening

- [ ] Replace remaining local `getStatusBadge` / `STATUS_COLORS` with `StatusBadge` + variant maps
- [ ] Replace shadcn metric `Card` stacks with `StatCard` on migrated pages still using old cards
- [ ] Prefer `@/components/backend` over `@/components/admin/shared` in new code
- [ ] Remove dead `MetricStatCard` / `RevenueStatCard` when unused
- [ ] ESLint (or codemod): ban page-level `min-h-screen` under `app/admin` except allowlist (cms/builder, auth)

### 4. Visual QA

- [ ] Spot-check each workspace against consumer billing reference + admin billing hub
- [ ] Mobile: PageHeader actions stack; sidebar + content padding

---

## Optional (nice-to-have)

- [ ] Codemod: bulk convert remaining `text-3xl font-bold` headers → `PageHeader`
- [ ] Shared `AdminDataPage` helper (loading/error/empty wiring)
- [ ] Role-based empty states (viewer vs editor CTAs)
- [ ] Storybook / Chromatic for `PageHeader`, `StatCard`, `StatusBadge`, `AdminPage`
- [ ] Nav audit: hide orphan routes or add missing nav leaves (see `docs/admin-nav-map.md`)
- [ ] Performance: reduce client-only data pages where SSR is safe
- [ ] Token cleanup: finish `slate-*` → `gray-*` on long-tail admin pages

---

## Do not change (by design)

- Auth: `/admin/login`, signup, forgot/reset password (no shell)
- Full-screen: `/admin/cms/builder`
- Public design preview routes (e.g. feasibility designs)

---

## Definition of done (for a page)

1. Body wrapped in `<AdminPage>` (no extra `p-6` / `min-h-screen` shell)
2. List → `PageHeader`; detail → `DetailPageHeader`
3. Metrics → `StatCard`; status → `StatusBadge`
4. Loading/empty/error → kit states
5. Imports from `@/components/backend`
