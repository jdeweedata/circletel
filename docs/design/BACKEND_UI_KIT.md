# Backend UI Kit

Shared component primitives for the **admin** (`/admin/*`) and **consumer** (`/dashboard/*`) dashboards.

- **Home:** `components/backend/` — import from `@/components/backend`.
- **Admin reference look:** `/admin/unjani/onboarding` — Archivo, `--pm-*` tokens (`#13274A` navy, `#F5841E` accent), 40px extrabold titles, 10px uppercase metric labels, `--pm-ground` page, `--pm-divider` rules. Applied automatically via `AdminModernistProvider` (`.portal-root`) + `components/admin/modernist/admin-kit.css`. Do not copy `--pm-*` into page files.
- **Customer `/dashboard` look:** unchanged slate / gray Tailwind on the same JSX. Dashboard is not inside `.portal-root`, so `admin-kit.css` does not apply.
- **Tokens:** admin chrome uses `components/portal/modernist/tokens.ts` (`portalModernist` → `--pm-*`). Dashboard keeps `tailwind.config.ts` (`circleTel.*`), `app/globals.css`, `DESIGN.md`. Do not invent new hex in either surface.

## Principles

- **Function first** — clarity over decoration. Admin cards are white on `--pm-ground` with `--pm-divider` rules. Dashboard cards stay `border-gray-200`, `shadow-sm`, `p-6`.
- **Orange is an accent** — admin primary CTA is `--pm-accent` fill with navy text. Accessible orange text is `--pm-accent-active` (`#D76026`), never `#F5841E` on white. Dashboard still uses `circleTel-orange` for CTA/active only. Never body text on white.
- **One token, one meaning** — status colours come only from `StatusBadge`/`getStatusVariant`. No per-page status hex.
- **Predictable states** — every list/data view uses `LoadingState` / `EmptyState` / `ErrorState`.

## Components

| Component | Use for |
|-----------|---------|
| `AdminPage` | Page body shell (`space-y-6`). No extra padding/min-h-screen — AdminLayout already shells. |
| `PageHeader` | List/index page title + subtitle + actions. Optional `eyebrow` (uppercase kicker). (Detail pages → `DetailPageHeader`.) |
| `DetailPageHeader` | Detail title + optional breadcrumbs/status. Type scale matches `PageHeader`. |
| `MetricCard` | **Preferred** metric card — network console look. Label above, big `font-semibold` value, optional `children` (icon or inline chart) below. |
| `StatCard` | Legacy metric card (gray, three layout variants). Retained for unmigrated pages — prefer `MetricCard` for new work. |
| `StatusBadge` + `getStatusVariant` | Every status pill. Map raw DB strings with `getStatusVariant()`. |
| `SectionCard` | Card with a header for grouped content. |
| `InfoRow` | Key/value rows in detail panels. |
| `ConsoleTabsList` / `ConsoleTabsContent` | Pill tabs on list/overview pages. (Detail sub-nav → `UnderlineTabs`.) |
| `LoadingState` / `EmptyState` / `ErrorState` | The three data states. |

### Usage

```tsx
import {
  AdminPage, PageHeader, DetailPageHeader, StatCard, StatusBadge, getStatusVariant,
  LoadingState, EmptyState, ErrorState,
  Tabs, ConsoleTabsList, ConsoleTabsContent,
} from '@/components/backend';
import { PiFileTextBold } from 'react-icons/pi';

<PageHeader title="Invoices" subtitle="Manage billing" actions={<Button>New</Button>} />

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard title="Current Balance" value="R0.00" icon={<PiWalletBold className="h-5 w-5" />}
    subtitle="No balance due" />
</div>

<StatusBadge status="Paid" variant={getStatusVariant('paid')} />

<Tabs value={tab} onValueChange={setTab}>
  <ConsoleTabsList items={[{ value: 'invoices', label: 'Invoices', icon: <PiFileTextBold className="h-5 w-5" />, hideLabelOnMobile: true }]} />
  <ConsoleTabsContent value="invoices">…</ConsoleTabsContent>
</Tabs>

{loading ? <LoadingState /> : rows.length === 0
  ? <EmptyState icon={<PiFileTextBold />} title="No invoices yet" description="They'll appear here once generated." />
  : rows.map(/* … */)}
```

## Status variants

`success` (paid/active/approved) · `warning` (pending/unpaid/scheduled) · `error` (failed/overdue/cancelled) · `info` (new/draft) · `neutral` (fallback). All bordered pills (`bg-*-100 text-*-800 border-*-200`).

## Migrating a page

1. Wrap body in `AdminPage` (no page-level `p-6` / `min-h-screen`).
2. Header markup → `PageHeader` / `DetailPageHeader`.
3. Stat divs / `ModernStatCard` → `StatCard`.
4. Local `getStatusBadge()` → `StatusBadge` + `getStatusVariant`.
5. Loading/empty/error blocks → `LoadingState` / `EmptyState` / `ErrorState`.
6. Tabs → `ConsoleTabsList` / `ConsoleTabsContent` (where tabs exist).
7. `npm run type-check:memory`; on admin, visual-diff against `/admin/unjani/onboarding`. On `/dashboard`, visual-diff against the consumer billing reference (slate).

## Colour that carries meaning

Status colour comes only from `StatusBadge`/`getStatusVariant`. Beyond that, some
surfaces use colour as *data* — AR aging buckets (green→dark-red by age), notification
channels (SMS blue / Email purple), cash-match day-done state (green/red), and exception
severity (red/amber). Preserve those hues when restyling; do not flatten them into the
chart palette. Consistency of *chrome* (grid, axes, tooltips, card shells), not of hue.

## Back-compat

`components/admin/shared/{StatCard,StatusBadge,SectionCard,InfoRow}` and `components/dashboard/ModernStatCard` are thin re-export shims pointing here, so unmigrated pages keep working. Prefer importing from `@/components/backend` in new/migrated code.
