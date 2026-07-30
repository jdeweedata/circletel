# Billing + AR Analytics — Network Console Look

**Date:** 2026-07-30
**Branch:** `feat/billing-network-console-look`
**Status:** Design approved, ready for implementation plan

## Goal

Bring `/admin/billing` and `/admin/finance/ar-analytics` onto the same visual language as `/admin/network/analytics` and `/admin/network/devices`, so the admin reads as one product.

Presentation only. No data, API, query, or business-logic changes.

## Problem

Two design languages coexist in the admin, and a checked-in spec makes billing the wrong one.

`docs/design/BACKEND_UI_KIT.md` names `app/admin/billing/*` and `app/dashboard/billing` as the kit's **reference look**: `border-gray-200`, `p-6`, `StatCard`, `SectionCard`, orange accent.

The network console pages evolved a newer language and deliberately do not use the kit's `StatCard`/`SectionCard` for their metric cards: `border-slate-200/80`, `rounded-xl`, breadcrumb eyebrows, `MetricCard`, outline-only action rows, source/freshness meta strips.

Restyling the two billing pages without resolving this would hard-code a third variant of the same card while the spec still declares gray canonical — a blend, which `.claude/rules/` Rule 7 forbids. So the network console becomes the documented reference, and the metric card it uses moves into the shared kit.

## Approach

Promote `MetricCard` into `components/backend/` as the canonical metric card. Restyle only the two target pages onto it. Leave every other admin page visually untouched.

Rejected alternatives:

- **Retheme `StatCard`/`SectionCard` to slate.** One edit, instant consistency — but silently restyles every `/admin/*` and `/dashboard/*` page using them. Blast radius far beyond the request.
- **Copy slate classes into the two pages.** Fastest, but creates a third card variant and leaves the kit doc contradicting reality.

## The look, codified

Extracted from `app/admin/network/analytics/page.tsx` and `app/admin/network/devices/page.tsx` — measured, not invented.

| Element | Value |
|---|---|
| Page shell | `AdminPage` → `space-y-6` |
| Eyebrow breadcrumb | `text-xs text-slate-400 mb-1` |
| H1 | `text-2xl font-semibold text-slate-900 tracking-tight` |
| Subtitle | `text-sm text-slate-500 mt-1` |
| Action row | `variant="outline" size="sm"`; Selects `rounded-lg border-slate-200` |
| Meta strip | `<Badge variant="outline">` + `text-xs text-slate-400/500` |
| Card shell | `rounded-xl border-slate-200/80 shadow-sm bg-white` |
| Card header | `CardHeader pb-2`; title `text-base font-semibold text-slate-900`; desc `text-xs text-slate-500` |
| Inner tile | `rounded-xl border border-slate-100 bg-slate-50/50 p-3` |
| Metric value | `text-3xl font-semibold tracking-tight text-slate-900` |
| Metric label | `text-sm font-medium text-slate-500` |
| Grid gap | `gap-4` |
| Banner | `rounded-xl border-{color}-200/80 bg-{color}-50/80 shadow-sm` + `CardContent py-3` |
| Table header | `bg-slate-50`, `text-xs font-semibold uppercase tracking-wider text-slate-500` |
| Table body | `divide-y divide-slate-100`, row `hover:bg-slate-50` |
| Footer meta | right-aligned `text-sm text-slate-500` + `PiClockBold` |

Two shifts to note: the palette moves `gray-*` → `slate-*`, and metric values move `font-bold` → `font-semibold`. `MetricCard` also renders its icon as a **child below the value**, where `StatCard` puts it inline top-left — so converting moves the icon. Intended.

## Colour that carries meaning is preserved

The network palette is a warm amber ramp (`--chart-1..5` in `app/globals.css`). Several things on these two pages use colour as *data*, not decoration, and flattening them into that ramp would look consistent while destroying the signal. These keep their current values and adopt only the surrounding chrome:

- **AR aging buckets** — green → yellow → orange → red → dark-red encodes how overdue.
- **SMS blue / Email purple** — channel identity, used in chart, legend, and table badges.
- **`CashMatchStrip` green/red tint** and **`DayDoneBanner` green/red** — encodes whether cash is matched.
- **`ExceptionTable` red/amber severity text** — encodes exception severity.
- **`StatusBadge` variants** — the kit already owns status colour; no per-page status hex.

Orange stays an accent per the kit rule: one primary CTA, filter chips, links.

## Unit 1 — Promote MetricCard

| File | Change |
|---|---|
| `components/backend/MetricCard.tsx` | NEW — content moved verbatim from the network copy, plus `export` added to the existing `type MetricCardProps` (currently file-local) |
| `components/backend/index.ts` | Export `MetricCard` + `MetricCardProps` |
| `components/admin/network/performance/MetricCard.tsx` | Becomes a re-export shim |
| `docs/design/BACKEND_UI_KIT.md` | Reference look → network console; add `MetricCard` row; note `StatCard` is retained for unmigrated pages |

`components/admin/network/performance/index.ts` keeps re-exporting `MetricCard`, so `analytics`, `devices`, and `health` need **zero edits and render identically**. This is the same back-compat shim pattern the kit doc already uses for `components/admin/shared/*`.

No import cycle: the shim imports `@/components/backend/MetricCard` (the file) rather than the barrel.

Existing `MetricCard` consumers that must stay pixel-identical:

- `app/admin/network/analytics/page.tsx` (4 cards, all with icon children)
- `app/admin/network/devices/page.tsx` (2 cards, using `delta` / `deltaPositive`)
- `app/admin/network/health/page.tsx` (4+ cards with children)

The `MetricCardProps` **shape** is therefore frozen — no prop renames, removals, or default changes. Adding the `export` keyword is the only permitted edit to it.

## Unit 2 — `/admin/billing`

PR #644 rewrote this page into a cash-match recon hub. It is already substantially slate; only the shells are off-look.

| File | Change |
|---|---|
| `app/admin/billing/page.tsx` | Eyebrow `Finance / Billing / Cash Match`; network header markup replacing bare `PageHeader`; all actions `size="sm"`; one orange CTA at `size="sm"`; window Select `rounded-lg border-slate-200`; source/window meta strip; footer meta line with `PiClockBold` |
| `recon/CashMatchStrip.tsx` | `StatCard` boxed-icon variant → `MetricCard`; icon becomes a child; keep semantic green/red tint via `className` |
| `recon/SecondaryKpis.tsx` | `rounded-lg` → `rounded-xl`; dashed `border-slate-300` → `border-slate-100 bg-slate-50/50` matching `GroupTrafficCards` tiles |
| `recon/DayDoneBanner.tsx` | `rounded-lg` → `rounded-xl` `border-{c}-200/80 bg-{c}-50/80 shadow-sm`, matching the devices-page banner |
| `recon/ExceptionTable.tsx` | `SectionCard` wrapper → network `Card` + `CardHeader pb-2` + `text-base font-semibold` title. **Table markup untouched** — it already matches |
| `recon/DeepLinks.tsx` | `rounded-lg` → `rounded-xl`; `border-slate-200` → `border-slate-200/80` |

Where an import line is already being edited, switch `@/components/admin/shared` → `@/components/backend` (the kit doc's stated preference for migrated code). Not a separate sweep.

The `/admin/billing` API (`/api/admin/billing/recon-hub`), `ReconHubResponse` types, and `filterExceptions` logic are untouched.

## Unit 3 — `/admin/finance/ar-analytics`

Currently 725 lines. Restyling in place would push it past ~800, so the four tab bodies are extracted first — the restyle then lands as four readable diffs instead of one large one.

| File | Change |
|---|---|
| `app/admin/finance/ar-analytics/page.tsx` | Reduce to ~150 lines: fetch, state, formatters, header, tabs wiring. Eyebrow `Finance / Receivables / AR Analytics`; period Select + refresh at `size="sm"`; meta strip; footer meta |
| `components/admin/finance/ar/ArAgingPanel.tsx` | NEW — aging bar chart + aging summary table |
| `components/admin/finance/ar/DsoMetricsPanel.tsx` | NEW — 3 DSO cards + collection performance tiles |
| `components/admin/finance/ar/NotificationsPanel.tsx` | NEW — channel pie, delivery stats, recent notifications table |
| `components/admin/finance/ar/HistoryPanel.tsx` | NEW — AR/DSO trend + notifications/collections charts |

Restyle within those panels:

- 4 KPI cards: raw shadcn `Card` with `text-primary` / `text-muted-foreground` → `MetricCard`. This also sidesteps the known latent bug where global `:root` oklch values break `hsl(var())` consumers — slate classes are literal, not token-derived.
- Tabs: raw shadcn `TabsList` → kit `ConsoleTabsList` pill tabs. Same 4 tabs, same content, no reordering.
- Charts: onto shadcn chart primitives — `ChartContainer` + `ChartConfig`, `CartesianGrid vertical={false}`, `tickLine={false} axisLine={false}`, `linearGradient` fills, `ChartTooltip`/`ChartTooltipContent`. Bucket and channel colours preserved per the section above.
- Tinted stat tiles (`bg-green-50`, `bg-red-50`, `bg-blue-50`, `bg-purple-50`) → slate tiles, icon colour as the only signal.
- `text-4xl font-bold` DSO numbers → `text-3xl font-semibold tracking-tight text-slate-900`.
- The 4 tables keep the `ExceptionTable`/`DeviceTable` header + divider treatment.

Data contract is unchanged: `ARAnalyticsData` moves to a shared type import for the panels; `/api/admin/finance/ar-analytics` is untouched.

## Success criteria

1. `npm run type-check:memory` introduces no new errors in touched files (repo carries ~295 pre-existing; the pre-push hook only blocks on files in the push).
2. `npm run build:memory` succeeds.
3. `/admin/network/analytics`, `/admin/network/devices`, `/admin/network/health` are visually unchanged — verified by screenshot diff, since they share the promoted `MetricCard`.
4. `/admin/billing` and `/admin/finance/ar-analytics` render with: eyebrow, `text-2xl font-semibold text-slate-900` H1, outline `size="sm"` action row, `rounded-xl border-slate-200/80` cards, `gap-4` grids, footer meta line.
5. All four AR tabs render with data and with the empty state (History has a no-data branch).
6. Semantic colours still legible: aging buckets green→dark-red, SMS blue / Email purple, day-done green/red, severity red/amber.
7. No page grew a horizontal scrollbar at 1280px or 1440px.
8. No new console errors or React key/prop warnings.

## Out of scope

- Any other admin or consumer dashboard page.
- `StatCard`, `SectionCard`, `ConsoleTabsList` internals — used as-is.
- API routes, SQL, types under `lib/billing/recon-hub/`, `filterExceptions`.
- Consolidating the `components/admin/shared` shims.
- Dark mode. Neither reference page implements it; the `dark:` classes currently in ar-analytics' tinted tiles disappear with those tiles and are not replaced.

## Risks

| Risk | Mitigation |
|---|---|
| `MetricCard` move regresses 3 network pages | Shim + unchanged barrel export; screenshot-diff all three |
| AR chart migration breaks a chart silently | Migrate and verify one chart at a time; both empty and populated states |
| Extracting 4 panels drops a prop or state hook | Extract first as a pure move, verify, then restyle — two steps, not one |
| Semantic colour lost to "consistency" | Enumerated explicitly above; success criterion 6 checks it |
| `/admin/billing` diverges further mid-work | #644 landed today; rebase on `origin/main` before PR |
