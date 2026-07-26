# Admin UI Consistency Audit

> Date: 2026-07-26  
> Host: Contabo VPS (`/home/circletel`)  
> Scope: `/admin/*` UI pages (170 `page.tsx` files)  
> Related: `docs/design/BACKEND_UI_KIT.md`, `docs/admin-nav-map.md`

---

## Verdict

A Backend UI Kit already exists (`components/backend/` + `docs/design/BACKEND_UI_KIT.md`), with a clear reference look (consumer billing). **Adoption was ~4% of admin pages.** Most pages grew as one-off UIs, which is why layouts, headers, badges, and loading states feel inconsistent.

| Pattern | Intended (kit) | Pre-migration reality |
|---|---|---|
| List page header | `PageHeader` | ~7 / 170 pages |
| Detail header | `DetailPageHeader` | ~1 admin page (+ few components) |
| Loading / empty / error | `LoadingState` / `EmptyState` / `ErrorState` | ~4 pages |
| Tabs (list) | `ConsoleTabsList` | ~1 (dashboard) |
| Tabs (detail) | `UnderlineTabs` | ~12 |
| Metric cards | `StatCard` from `@/components/backend` | Mixed: shared shims, shadcn Card, inline divs |
| Status | `StatusBadge` + `getStatusVariant` | 26+ local `getStatusBadge` / colour maps |
| Cards | `SectionCard` | ~89 files still use raw shadcn `Card` |

---

## Competing layout systems

```
AdminLayoutClient (shell)
  sidebar + header + main p-4 sm:p-6 lg:p-8
  bg-gray-50
  ├── billing/layout     (was space-y-6 only)
  ├── mits-cpq/layout    (was min-h-screen bg-slate-50 max-w-7xl)  ← double shell
  ├── ~48 pages with own min-h-screen                             ← fights parent
  ├── cms/builder        fullScreen (no shell)
  └── auth routes        no shell
```

### Shell problems
1. **Double shells** — pages re-add `min-h-screen`, `max-w-7xl`, extra `bg-slate-50` inside a shell that already pads and backgrounds.
2. **Nested layouts diverge** — billing vs mits-cpq used different frame rules.
3. **Full-bleed detail headers** — old `DetailPageHeader` used full-width white bar + `text-3xl extrabold` + `slate` tokens while list kit used `text-2xl semibold` + `gray`.

---

## Visual inconsistencies (measured 2026-07-26)

| Dimension | Split |
|---|---|
| Title size | `text-3xl` on ~70 pages vs `text-2xl` on ~101 |
| Vertical rhythm | `space-y-6` ~116 vs `space-y-8` ~9 |
| Colour palette | `gray-*` ~119 vs `slate-*` ~81 |
| Width constraint | `max-w-7xl` on ~32 pages; most fill main width |
| Client vs server | ~152 client pages / 170 total |

### Header styles in the wild
| Style | Example | Look |
|---|---|---|
| Kit `PageHeader` | customers, invoices, dashboard | `text-2xl font-semibold` |
| Kit `DetailPageHeader` (old) | settings/finance | breadcrumb + `text-3xl extrabold` full-bleed |
| Inline ad-hoc | billing, network, marketing | raw `<h1 className="text-2xl/3xl font-bold">` |
| Domain component | products, orders | feature-local headers |

### Status / badge chaos
- shadcn `<Badge className="bg-green-100…">`
- local `STATUS_COLORS` maps
- local `getStatusBadge()` switches
- kit `StatusBadge` + `getStatusVariant` (sparse)

### Tabs chaos
| System | Where |
|---|---|
| shadcn `Tabs` | integrations, users, many others |
| `UnderlineTabs` | orders, some detail flows |
| `ConsoleTabsList` | dashboard only |

---

## Root causes
1. Kit landed after years of feature velocity.
2. `admin/shared` re-export shims hide incomplete adoption.
3. No `AdminPage` body primitive (until Phase 1).
4. Feature-local design systems (sales-engine, products, coverage).
5. Almost all pages are client components reimplementing data states.

---

## Standardization plan

### Phase 0 — Contract
- List: `AdminPage` + `PageHeader` + optional `StatCard` grid + data states
- Detail: `DetailPageHeader` (aligned type scale with list)
- Status: only `StatusBadge` / `getStatusVariant`
- Tabs: list → `ConsoleTabs*`; detail → `UnderlineTabs`
- Forbid page-level `min-h-screen` / second `bg-*` shells (except fullScreen allowlist)
- Tokens: **`gray-*` only** for new admin work

### Phase 1 — Shell + primitives ✅ (2026-07-26)
- [x] Add `components/backend/AdminPage.tsx`
- [x] Export `AdminPage` + `DetailPageHeader` from `@/components/backend`
- [x] Align `DetailPageHeader` to `text-2xl font-semibold`, `gray-*`, no full-bleed bar
- [x] Shim `components/admin/shared/DetailPageHeader.tsx` → backend
- [x] Fix `app/admin/billing/layout.tsx` (passthrough)
- [x] Fix `app/admin/mits-cpq/layout.tsx` (remove double shell)

### Phase 2 — Billing hub template ✅ (2026-07-26)
Migrated to kit:
| Route | Changes |
|---|---|
| `/admin/billing` | AdminPage, PageHeader, StatCard, SectionCard, StatusBadge, states |
| `/admin/billing/invoices` | AdminPage, StatCard, SectionCard (was partial kit) |
| `/admin/billing/customers` | Full kit migration |
| `/admin/billing/payment-methods` | Full kit migration |
| `/admin/billing/whatsapp` | Full kit migration |
| `/admin/billing/cron-logs` | Full kit migration |

**Billing hub is the reference template** for other sections.

### Phase 2b — Finance workspace ✅ (2026-07-26)

Migrated to kit (Finance workspace nav: Billing & Revenue + Payments):

| Route | Migration depth |
|---|---|
| `/admin/finance/outstanding` | Full kit |
| `/admin/finance/ar-analytics` | Shell + StatusBadge + AdminPage (charts retained) |
| `/admin/finance/reconciliation` | Shell + StatCards + AdminPage |
| `/admin/payments/monitoring` | Shell + StatusBadge + AdminPage |
| `/admin/payments/transactions` | Shell + StatCards + StatusBadge + AdminPage |
| `/admin/payments/webhooks` | Full kit |
| `/admin/payments/settings` | Full kit |

### Phase 2c — Ops workspace ✅ (2026-07-26)

Migrated Ops & Onboarding surfaces (orders, fulfillment, field-ops):

| Route | Migration depth |
|---|---|
| `/admin/orders` | AdminPage + LoadingState; `OrdersListHeader` → PageHeader |
| `/admin/orders/consumer` | Shell + StatusBadge + PageHeader |
| `/admin/orders/installations` | Shell + StatusBadge + PageHeader |
| `/admin/orders/technicians` | Shell + PageHeader |
| `/admin/orders/[id]` | AdminPage + LoadingState |
| `/admin/fulfillment` | Full kit (removed double shell) |
| `/admin/field-ops` | AdminPage + PageHeader (was SharedPageHeader) |
| `/admin/field-ops/jobs` | Shell + PageHeader |
| `/admin/field-ops/technicians` | Shell + PageHeader + LoadingState |

### Phase 2d — Customers / B2B / Corporate ✅ (2026-07-26)

Migrated CRM / Support customer surfaces:

| Route | Migration depth |
|---|---|
| `/admin/customers` | Full kit |
| `/admin/customers/[id]` | AdminPage + LoadingState |
| `/admin/b2b-customers` | Shell + PageHeader + StatusBadge |
| `/admin/b2b-customers/site-details` | Shell + PageHeader |
| `/admin/b2b/manual-intake` | PageHeader + AdminPage wrap |
| `/admin/b2b/vetting` | AdminPage wrap (already had kit states) |
| `/admin/unjani/onboarding` | AdminPage wrap (already had kit states) |
| `/admin/corporate` | AdminPage + PageHeader (removed double shell) |
| `/admin/corporate/new` | AdminPage (removed full-page gradient shell) |
| `/admin/partners` | Shell + PageHeader + StatusBadge |
| `/admin/partners/approvals` | Shell + PageHeader |

### Phase 2e — Network / Coverage / Marketing ✅ (2026-07-26)

Migrated Platform + Sales marketing surfaces:

| Route | Migration depth |
|---|---|
| `/admin/network` | AdminPage + PageHeader + Loading/Error states |
| `/admin/network/devices` | AdminPage + PageHeader |
| `/admin/network/health` | AdminPage + PageHeader |
| `/admin/network/outages` | AdminPage + PageHeader |
| `/admin/coverage` | AdminPage + PageHeader (removed min-h double shell) |
| `/admin/coverage/checker` | AdminPage + PageHeader |
| `/admin/diagnostics` | AdminPage + PageHeader |
| `/admin/marketing` | AdminPage + PageHeader |
| `/admin/marketing/promotions` | AdminPage + PageHeader |
| `/admin/marketing/no-coverage-leads` | AdminPage + PageHeader |
| `/admin/competitor-analysis` | AdminPage + PageHeader + states |
| `/admin/competitor-analysis/providers` | AdminPage + PageHeader |
| `/admin/cms` | AdminPage + PageHeader |

Skipped: `/admin/cms/builder` (full-screen route).

### Phase 2f — Integrations / Settings / Users ✅ (2026-07-26)

Completed admin shell / administration workspace migration:

| Route | Migration depth |
|---|---|
| `/admin/dashboard` | AdminPage wrap (already had PageHeader/StatCard) |
| `/admin/integrations` | AdminPage + PageHeader (removed full-page min-h shell) |
| `/admin/integrations/webhooks` | AdminPage + PageHeader |
| `/admin/integrations/oauth` | AdminPage + PageHeader |
| `/admin/integrations/api-health` | AdminPage + PageHeader |
| `/admin/integrations/cron-jobs` | AdminPage + PageHeader |
| `/admin/settings` | Full kit |
| `/admin/settings/finance` | AdminPage wrap |
| `/admin/settings/notifications` | AdminPage wrap |
| `/admin/users` | AdminPage + PageHeader |
| `/admin/users/roles` | AdminPage + PageHeader |
| `/admin/users/activity` | AdminPage + PageHeader |
| `/admin/notifications` | AdminPage + PageHeader |
| `/admin/workflow` | AdminPage + PageHeader |
| `/admin/orchestrator` | Full kit |
| `/admin/audit-logs` | AdminPage + PageHeader |
| `/admin/zoho` | AdminPage + PageHeader |
| `/admin/zoho-sync` | AdminPage + PageHeader |

## Rollout complete (hubs)

Major admin workspaces now use `AdminPage` + `PageHeader` (+ kit states where applicable).
Remaining work: deep-link detail routes (`*/[id]`), map tools, and any pages still using feature-local stat cards.
Prefer `@/components/backend` for all new admin UI.






### Phase 3 — Remaining hubs (priority)
1. Finance (outstanding, AR, reconciliation) + payments
2. Orders / fulfillment / field-ops
3. Customers / B2B / corporate
4. Network / coverage
5. Integrations / marketing / sales-engine
6. Settings / users / workflow
7. Long tail

### Phase 4 — Kill duplicates
- Prefer `@/components/backend` over `@/components/admin/shared`
- Remove unused `MetricStatCard` / `RevenueStatCard` when unused
- Lint/codemod: ban local `getStatusBadge` redefinitions in `app/admin`

---

## Per-page migration checklist

From `docs/design/BACKEND_UI_KIT.md`:

1. Wrap body in `<AdminPage>` (no extra `p-6` / `min-h-screen`)
2. Header → `PageHeader` or `DetailPageHeader`
3. Stat divs / shadcn metric cards → `StatCard`
4. Grouped panels → `SectionCard`
5. Local status helpers → `StatusBadge` + variant map
6. Loading/empty/error → `LoadingState` / `EmptyState` / `ErrorState`
7. Tabs → Console / Underline where appropriate
8. Visual-diff against billing hub + `/dashboard/billing`

### Example (list page)

```tsx
import {
  AdminPage, PageHeader, StatCard, SectionCard,
  StatusBadge, LoadingState, EmptyState, ErrorState,
} from '@/components/backend';

if (loading) return <AdminPage><LoadingState message="Loading…" /></AdminPage>;
if (error) return <AdminPage><ErrorState message={error} onRetry={refetch} /></AdminPage>;

return (
  <AdminPage>
    <PageHeader title="…" subtitle="…" actions={…} />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard label="…" value={…} icon={…} />
    </div>
    <SectionCard title="…">{/* table or content */}</SectionCard>
  </AdminPage>
);
```

---

## Source of truth

| Piece | Path |
|---|---|
| UI kit | `components/backend/` |
| Spec | `docs/design/BACKEND_UI_KIT.md` |
| Admin shell | `app/admin/AdminLayoutClient.tsx` |
| Nav registry | `lib/admin/feature-registry.ts` |
| This audit | `docs/admin-ui-consistency-audit.md` |
| Nav map | `docs/admin-nav-map.md` |

---

## Maintenance notes

- **Do not** add page-level `min-h-screen` or second background shells under AdminLayout.
- **Do not** invent new status colour maps — extend `getStatusVariant` or page-local variant maps that feed `StatusBadge`.
- New admin list pages **must** start from the billing hub pattern.
- Prefer `gray-*` tokens over `slate-*` on new/migrated admin work.

## Remaining work tracking

See **[docs/admin-ui-kit-remaining.md](./admin-ui-kit-remaining.md)** for checklist of left-to-do vs optional follow-ups (updated 2026-07-27).
