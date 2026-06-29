# Backend UI Kit

Shared component primitives for the **admin** (`/admin/*`), **consumer** (`/dashboard/*`), **partner** (`/partner/*`), **business customer** (`/business/dashboard/*`), and **portal** (`/portal/*`) dashboards. One kit, one look, so every logged-in surface feels like the same product.

- **Home:** `components/backend/` — import from `@/components/backend`.
- **Reference look:** hybrid console. Use Vercel-style density for navigation, filters, lists, metrics, and charts; use Gaiia-style workbenches for entity detail pages with an optional right inspector.
- **Tokens:** reuse `tailwind.config.ts` (`circleTel.*`), `app/globals.css`, `DESIGN.md`, `lib/design-system.ts`. Do not invent new tokens.

## Principles

- **Function first** — clarity over decoration. White cards, `border-gray-200`, `shadow-sm`, `p-6`, `space-y-6/8`.
- **Orange is an accent** — `circleTel-orange` only for active state, primary CTA, links, focus. Never body text on white.
- **One token, one meaning** — status colours come only from `StatusBadge`/`getStatusVariant`. No per-page status hex.
- **Predictable states** — every list/data view uses `LoadingState` / `EmptyState` / `ErrorState`.
- **Dense console typography** — Inter for UI/data text, Manrope only for entity/page headings. Console titles are 20-24px; rows, labels, and metadata are 12-14px with `tabular-nums` for numbers.
- **Flat portal surfaces** — logged-in pages prefer `rounded-md`/`rounded-lg`, gray borders, and light shadows. Avoid gradients and decorative card grids inside operational screens.

## Components

| Component | Use for |
|-----------|---------|
| `ConsoleShell` | Shared logged-in page frame: sidebar + sticky topbar + content + optional footer. |
| `ConsoleTopbar` | Compact 56px topbar with brand/title/search/actions slots. |
| `ConsoleNav` | Collapsible 64px/240px vertical nav with tooltip support and nested active states. |
| `PageHeader` | List/index page title + subtitle + actions. (Detail pages → `DetailPageHeader`.) |
| `EntityHeader` | Detail/workbench header with breadcrumbs, status, actions, tabs, and metadata. |
| `StatCard` | Metric cards. Replaces inline stat `<div>`s, admin `StatCard`, and `ModernStatCard`. |
| `MetricPanel` | Compact one-metric panel for observability/dashboard grids. |
| `ChartPanel` | Flat chart container with compact header and optional action. |
| `FilterToolbar` | Dense search/filter/action strip above lists and tables. |
| `DataTable` | Compact table with sorting hooks, loading/empty states, row actions, and dense rows. |
| `InspectorPanel` | Sticky right detail panel on desktop; sheet/drawer on tablet and mobile. |
| `ActivityTimeline` | Notes/activity feed inside inspectors and detail sidebars. |
| `StatusBadge` + `getStatusVariant` | Every status pill. Map raw DB strings with `getStatusVariant()`. |
| `SectionCard` | Card with a header for grouped content. |
| `InfoRow` | Key/value rows in detail panels. |
| `ConsoleTabsList` / `ConsoleTabsContent` | Pill tabs on list/overview pages. (Detail sub-nav → `UnderlineTabs`.) |
| `LoadingState` / `EmptyState` / `ErrorState` | The three data states. |

### Usage

```tsx
import {
  PageHeader, StatCard, StatusBadge, getStatusVariant,
  LoadingState, EmptyState, ErrorState,
  Tabs, ConsoleTabsList, ConsoleTabsContent,
  ConsoleShell, DataTable, FilterToolbar, InspectorPanel,
} from '@/components/backend';
import { PiFileTextBold } from 'react-icons/pi';

<ConsoleShell topbar={<Header />} sidebar={<Sidebar />}>
  <PageHeader title="Invoices" subtitle="Manage billing" />
</ConsoleShell>

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

## Console layout migration

The first adoption phase moves shared shells onto `ConsoleShell` without changing auth guards, route configs, API calls, or page content. Current shell adopters:

- `app/admin/AdminLayoutClient.tsx`
- `app/dashboard/DashboardLayoutClient.tsx`
- `app/partner/PartnerLayoutClient.tsx`
- `app/business/dashboard/layout.tsx`
- `app/portal/PortalLayoutClient.tsx`

Next page migrations should replace local table/stat/filter/detail markup with the primitives above. Do not redesign public marketing pages or checkout acquisition pages as part of this console kit.

## Admin List Pages

Admin list/index pages must follow the same operational stack so `/admin/dashboard`, `/admin/customers`, `/admin/unjani/onboarding`, and future pages feel like one console:

1. `PageHeader` with one concise title, one subtitle, and right-aligned actions.
2. Optional `StatCard`/`MetricPanel` row directly below the header when the page has summary counts.
3. `FilterToolbar` for search, selects, bulk actions, and reset controls.
4. `DataTable` for records, with `StatusBadge` for all statuses and shared loading/empty/error states.
5. No local shadcn `Card` wrappers around tables unless the table has a bespoke interaction that `DataTable` cannot express yet.

Current migrated reference list:

- `app/admin/customers/page.tsx`
- `app/admin/unjani/onboarding/page.tsx` (keeps a custom SLA/stage table, but uses the same header/card/state rules)

## Status variants

`success` (paid/active/approved) · `warning` (pending/unpaid/scheduled) · `error` (failed/overdue/cancelled) · `info` (new/draft) · `neutral` (fallback). All bordered pills (`bg-*-100 text-*-800 border-*-200`).

## Migrating a page

1. Shell frame -> `ConsoleShell` (already done for the top-level portal layouts).
2. Header markup -> `PageHeader` for list pages or `EntityHeader` for detail/workbench pages.
3. Filter rows -> `FilterToolbar`.
4. Local tables -> `DataTable`.
5. Stat divs / `ModernStatCard` -> `StatCard` or `MetricPanel`.
6. Local `getStatusBadge()` -> `StatusBadge` + `getStatusVariant`.
7. Right detail areas -> `InspectorPanel` + `ActivityTimeline`.
8. Loading/empty/error blocks -> `LoadingState` / `EmptyState` / `ErrorState`.
9. Tabs -> `ConsoleTabsList` / `ConsoleTabsContent` for overview/list pages, `UnderlineTabs` for detail sub-nav.
10. `npm run type-check:memory`; take Playwright screenshots for the route being migrated.

## Back-compat

`components/admin/shared/{StatCard,StatusBadge,SectionCard,InfoRow}` and `components/dashboard/ModernStatCard` are thin re-export shims pointing here, so unmigrated pages keep working. Prefer importing from `@/components/backend` in new/migrated code.
