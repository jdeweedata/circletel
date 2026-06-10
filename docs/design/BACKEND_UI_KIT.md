# Backend UI Kit

Shared component primitives for the **admin** (`/admin/*`) and **consumer** (`/dashboard/*`) dashboards. One kit, one look — so both surfaces feel like the same product.

- **Home:** `components/backend/` — import from `@/components/backend`.
- **Reference look:** the consumer billing dashboard (`app/dashboard/billing/page.tsx`) — functional minimalism: white surfaces, soft gray borders, restrained orange accent, generous spacing, `tabular-nums` numbers.
- **Tokens:** reuse `tailwind.config.ts` (`circleTel.*`), `app/globals.css`, `DESIGN.md`, `lib/design-system.ts`. Do not invent new tokens.

## Principles

- **Function first** — clarity over decoration. White cards, `border-gray-200`, `shadow-sm`, `p-6`, `space-y-6/8`.
- **Orange is an accent** — `circleTel-orange` only for active state, primary CTA, links, focus. Never body text on white.
- **One token, one meaning** — status colours come only from `StatusBadge`/`getStatusVariant`. No per-page status hex.
- **Predictable states** — every list/data view uses `LoadingState` / `EmptyState` / `ErrorState`.

## Components

| Component | Use for |
|-----------|---------|
| `PageHeader` | List/index page title + subtitle + actions. (Detail pages → `DetailPageHeader`.) |
| `StatCard` | Metric cards. Replaces inline stat `<div>`s, admin `StatCard`, and `ModernStatCard`. |
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

1. Header markup → `PageHeader`.
2. Stat divs / `ModernStatCard` → `StatCard`.
3. Local `getStatusBadge()` → `StatusBadge` + `getStatusVariant`.
4. Loading/empty/error blocks → `LoadingState` / `EmptyState` / `ErrorState`.
5. Tabs → `ConsoleTabsList` / `ConsoleTabsContent` (where tabs exist).
6. `npm run type-check:memory`; visual-diff against the billing reference.

## Back-compat

`components/admin/shared/{StatCard,StatusBadge,SectionCard,InfoRow}` and `components/dashboard/ModernStatCard` are thin re-export shims pointing here, so unmigrated pages keep working. Prefer importing from `@/components/backend` in new/migrated code.
