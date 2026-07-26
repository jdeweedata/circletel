# Network Analytics Layout — Design

**Date**: 2026-07-26
**Page**: `/admin/network/analytics`
**Branch**: `feat/network-analytics-layout` (worktree off `origin/main`)

---

## Problem

The page renders correctly but wastes roughly half its vertical space and reads as two different
design systems stitched together.

1. **Four of the eight panels are empty.** `Top Applications`, `Traffic by Category`,
   `SSID Activity` and `Channel / Radio Util` each render a full-height `AnalyticsEmptyState`
   (~230px, full or half width). Ruijie does not return app-flow or radio data for these groups,
   so this is the normal state, not an edge case.
2. **`TrafficChart` does not match the page.** It uses the default `Card` styling with `text-lg`
   titles and `gray-*` tokens, while every other card on the page uses
   `border-slate-200/80 shadow-sm rounded-xl bg-white` with `text-base font-semibold text-slate-900`.
   Its inline stat strip (`Total DL / Avg / Total UL`) repeats the KPI row verbatim and squeezes the
   title onto two lines.
3. **The toolbar mixes three concerns** in one wrapping row — navigation (`System Health`, `Devices`),
   filters (group, window) and actions (Live/Cached, Refresh) — and the source badge sits alone on a
   full-width row underneath it.

## Non-goals

- **Sparse chart data.** The 24-hour window contains 2 rollup samples, so the area chart draws a
  straight line. That is a sync-cadence problem in the Ruijie rollup job, not a layout problem.
- **API changes.** `/api/admin/network/analytics` is untouched; every value the new layout shows is
  already in the current response.
- **The `avgRxRate` calculation** in `TrafficChart` (it divides by `dataPoints.length` as if samples
  were hourly). The stat strip that surfaces it is being removed, so the value stops being displayed.
  Fixing the maths is separate work.

---

## Layout

| Row | Now | After |
|---|---|---|
| 1 | Title + six mixed controls wrapping | Title + subtitle left; `System Health` / `Devices` nav right |
| 2 | Source badge alone on a full row | **Control strip** — source badge + scope text left; group ▾, window ▾, Live/Cached, Refresh right |
| 3 | 4 KPI cards | unchanged |
| 4 | Group Traffic, full width | *removed — folded into row 5* |
| 5 | Traffic (2/3) + Throughput (1/3) | Traffic (2/3) + right column stacking **Group Traffic (list)** over **Throughput** |
| 6–7 | 4 full-height empty cards across two rows | Only panels **with** data, in a 2-column grid |
| 8 | — | **`UnavailableDataPanel`** — one card, one compact row per missing panel |
| 9 | Last updated | unchanged |

Rows 1 and 2 collapse two rows of chrome into one. Row 4 disappears into row 5's right column.
Rows 6–8 replace up to ~460px of empty cards with a single card of one-line rows.

---

## Components

### `app/admin/network/analytics/page.tsx` (modified)

Restructured per the table above. Adds one derivation, replacing the four unconditional panel
renders:

```ts
const panels = [
  { key: 'apps',  title: 'Top Applications',     has: appFlow.length > 0,
    reason: 'Ruijie EG app-flow returned no data for this group.' },
  { key: 'cat',   title: 'Traffic by Category',  has: appFlow.length > 0,
    reason: 'Needs app-flow groups from Ruijie.' },
  { key: 'ssid',  title: 'SSID Activity',        has: ssidActivity.length > 0,
    reason: 'No live STA associations carrying SSID names.' },
  { key: 'radio', title: 'Channel / Radio Util', has: radio.devicesWithRadio > 0,
    reason: 'No radio utilization in the device cache — sync live metrics first.' },
];
```

`panels.filter(p => p.has)` render into the 2-column grid; `panels.filter(p => !p.has)` feed
`UnavailableDataPanel`. Also drops the stray `-mx-1` on the page wrapper.

### `components/admin/network/TrafficChart.tsx` (modified)

Restyled to the page's language: `border border-slate-200/80 shadow-sm rounded-xl bg-white`,
`CardTitle` at `text-base font-semibold text-slate-900`, `slate-*` in place of `gray-*` for the
axes, tooltip and empty state. The inline `Total DL / Avg / Total UL` strip is deleted — it
duplicates the KPI row and is what forces the two-line title.

`TrafficChart` has exactly one consumer (this page), so the restyle has no blast radius.
`AppFlowChart` and the `formatBytes` / `formatBps` exports in the same file are used elsewhere and
are left alone.

### `components/admin/network/performance/GroupTrafficCards.tsx` (modified)

Adds `layout?: 'grid' | 'list'`, defaulting to `'grid'` so existing behaviour is unchanged.
`'list'` renders vertical rows sized for the narrow right column: group name and total on one line,
`↓ rx · ↑ tx · n samples` muted underneath. Selection behaviour (`onSelectGroup`, active styling) is
identical in both layouts.

### `components/admin/network/performance/UnavailableDataPanel.tsx` (new)

```ts
type UnavailableDataPanelProps = {
  items: Array<{ key: string; title: string; reason: string }>;
  className?: string;
};
```

Returns `null` when `items` is empty. Otherwise one card titled "Not available for this group",
with a row per item: title in `text-sm font-medium text-slate-700`, reason in `text-xs text-slate-500`,
separated by `border-t border-slate-100`.

### `components/admin/network/performance/index.ts` (modified)

Exports `UnavailableDataPanel`.

### Unchanged

`AnalyticsEmptyState` stays as-is. The page no longer routes into it, but `TopApplicationsCard`,
`SsidActivityCards` and `RadioUtilSummaryCard` keep their internal empty guards as a defensive
fallback for any other caller.

---

## Verification

1. `npm run type-check:memory` — no new errors in the five touched files.
2. Dev server, `/admin/network/analytics`:
   - **Group with partial data** (`UnjanihAPaxS`): all four panels land in `UnavailableDataPanel`;
     the 2-column panel grid renders nothing; page height drops materially.
   - **Group selection**: clicking a row in the Group Traffic list still switches `selectedGroupId`
     and refetches.
   - **Responsive**: at `lg` and below the right column stacks under the traffic chart; the control
     strip wraps without overlapping.
3. No console errors.
