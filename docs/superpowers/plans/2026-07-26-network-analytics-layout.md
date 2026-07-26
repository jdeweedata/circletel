# Network Analytics Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `/admin/network/analytics` into a dense single-scroll layout where empty panels collapse into one compact card instead of four full-height empty states.

**Architecture:** Pure presentational change. The page keeps its existing data fetch and derives a `panels` array with a `has` flag per panel, partitioning panels into "render normally" and "list as unavailable". Two existing components gain a variant, one new component is added. No API, schema, or data changes.

**Tech Stack:** Next.js 15 App Router (client component), React 19, Tailwind, shadcn/ui `Card`, `react-icons/pi` (Phosphor), Recharts, Jest + react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-07-26-network-analytics-layout-design.md`

## Global Constraints

- Work in the worktree `/home/circletel/.worktrees/network-analytics-layout` on branch `feat/network-analytics-layout`. Do not touch the primary checkout.
- Interface icons come from `react-icons/pi` (Phosphor). Do not introduce Iconify. Decorative icons get `aria-hidden="true"`. Per `.claude/rules/icon-system.md`.
- Card styling on this page is exactly `border border-slate-200/80 shadow-sm rounded-xl bg-white`. Card titles are `text-base font-semibold text-slate-900`. Use `slate-*` tokens, never `gray-*`.
- The repo's Jest env is `jest-environment-node` — no jsdom, so React Testing Library is unavailable. Component tests use `react-test-renderer` and must set `(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true`. Follow `__tests__/components/admin/layout/Sidebar.test.tsx`.
- Type check with `npm run type-check:memory` (4GB heap). The repo carries ~295 pre-existing type errors — only errors in the five files this plan touches matter.
- Do not change `/api/admin/network/analytics` or anything under `lib/network/`.
- Do not use `git commit --no-verify`.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `components/admin/network/performance/UnavailableDataPanel.tsx` | Create | Single card listing panels that have no data, one compact row each |
| `__tests__/components/admin/network/UnavailableDataPanel.test.tsx` | Create | Render assertions for the new component |
| `components/admin/network/performance/GroupTrafficCards.tsx` | Modify | Add opt-in `layout="list"` for narrow columns |
| `__tests__/components/admin/network/GroupTrafficCards.test.tsx` | Create | Render assertions for both layouts + selection callback |
| `components/admin/network/performance/index.ts` | Modify | Export `UnavailableDataPanel` |
| `components/admin/network/TrafficChart.tsx` | Modify | Restyle `TrafficChart` to page tokens, delete duplicated stat strip |
| `app/admin/network/analytics/page.tsx` | Modify | Row restructure + panel partitioning |

Tasks 1 and 2 are independent. Task 3 is independent. Task 4 consumes all three.

---

### Task 1: UnavailableDataPanel

**Files:**
- Create: `components/admin/network/performance/UnavailableDataPanel.tsx`
- Create: `__tests__/components/admin/network/UnavailableDataPanel.test.tsx`
- Modify: `components/admin/network/performance/index.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  export type UnavailablePanelItem = { key: string; title: string; reason: string };
  export function UnavailableDataPanel(props: {
    items: UnavailablePanelItem[];
    className?: string;
  }): JSX.Element | null;
  ```
  Task 4 imports `UnavailableDataPanel` and `UnavailablePanelItem` from `@/components/admin/network/performance`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/admin/network/UnavailableDataPanel.test.tsx`:

```tsx
/**
 * Render tests for UnavailableDataPanel.
 *
 * Renderer: react-test-renderer. The repo's jest env is jest-environment-node
 * (no jsdom), so RTL is unavailable.
 */
import { describe, it, expect } from '@jest/globals';
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { UnavailableDataPanel } from '@/components/admin/network/performance/UnavailableDataPanel';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Renderer = ReturnType<typeof TestRenderer.create>;

function textOf(tree: Renderer): string {
  return JSON.stringify(tree.toJSON());
}

describe('UnavailableDataPanel', () => {
  it('renders nothing when there are no items', () => {
    const tree = TestRenderer.create(<UnavailableDataPanel items={[]} />);
    expect(tree.toJSON()).toBeNull();
  });

  it('renders a row per item with its title and reason', () => {
    const tree = TestRenderer.create(
      <UnavailableDataPanel
        items={[
          { key: 'apps', title: 'Top Applications', reason: 'No app-flow data.' },
          { key: 'radio', title: 'Channel / Radio Util', reason: 'No radio utilization.' },
        ]}
      />
    );
    const out = textOf(tree);
    expect(out).toContain('Top Applications');
    expect(out).toContain('No app-flow data.');
    expect(out).toContain('Channel / Radio Util');
    expect(out).toContain('No radio utilization.');
  });

  it('names the card so the reason for the missing panels is visible', () => {
    const tree = TestRenderer.create(
      <UnavailableDataPanel items={[{ key: 'a', title: 'A', reason: 'r' }]} />
    );
    expect(textOf(tree)).toContain('Not available for this group');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/circletel/.worktrees/network-analytics-layout
npx jest __tests__/components/admin/network/UnavailableDataPanel.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/admin/network/performance/UnavailableDataPanel'`.

- [ ] **Step 3: Write the implementation**

Create `components/admin/network/performance/UnavailableDataPanel.tsx`:

```tsx
'use client';

import { PiInfoBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type UnavailablePanelItem = {
  key: string;
  title: string;
  reason: string;
};

type UnavailableDataPanelProps = {
  items: UnavailablePanelItem[];
  className?: string;
};

export function UnavailableDataPanel({ items, className }: UnavailableDataPanelProps) {
  if (!items.length) return null;

  return (
    <Card
      className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <PiInfoBold className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Not available for this group
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-0.5 px-6 py-2.5 sm:flex-row sm:items-baseline sm:gap-3"
            >
              <span className="text-sm font-medium text-slate-700 sm:w-48 sm:shrink-0">
                {item.title}
              </span>
              <span className="text-xs text-slate-500">{item.reason}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest __tests__/components/admin/network/UnavailableDataPanel.test.tsx
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Export from the barrel**

In `components/admin/network/performance/index.ts`, append after the `RadioUtilSummaryCard` export:

```ts
export { UnavailableDataPanel } from './UnavailableDataPanel';
export type { UnavailablePanelItem } from './UnavailableDataPanel';
```

- [ ] **Step 6: Commit**

```bash
git add components/admin/network/performance/UnavailableDataPanel.tsx \
        components/admin/network/performance/index.ts \
        __tests__/components/admin/network/UnavailableDataPanel.test.tsx
git commit -m "feat(network): add UnavailableDataPanel for analytics panels with no data"
```

---

### Task 2: GroupTrafficCards list layout

**Files:**
- Modify: `components/admin/network/performance/GroupTrafficCards.tsx:11-77`
- Create: `__tests__/components/admin/network/GroupTrafficCards.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `GroupTrafficCards` gains `layout?: 'grid' | 'list'`, defaulting to `'grid'`. The existing props (`groups`, `selectedGroupId`, `onSelectGroup`, `className`) are unchanged. Task 4 renders it with `layout="list"`.

The `GroupTrafficCard` shape (from `@/lib/network/analytics-aggregates`, already imported by the file) is:
`{ groupId: string; groupName: string; totalBytes: number; totalRxBytes: number; totalTxBytes: number; sampleCount: number }`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/admin/network/GroupTrafficCards.test.tsx`:

```tsx
/**
 * Render tests for GroupTrafficCards grid vs list layout.
 *
 * Renderer: react-test-renderer (jest env is node, no jsdom).
 */
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { GroupTrafficCards } from '@/components/admin/network/performance/GroupTrafficCards';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const GROUPS = [
  {
    groupId: 'g1',
    groupName: 'Unjani',
    totalBytes: 21_367_610_000,
    totalRxBytes: 20_294_000_000,
    totalTxBytes: 1_073_610_000,
    sampleCount: 2,
  },
  {
    groupId: 'g2',
    groupName: 'Newgen Network',
    totalBytes: 1_018_000_000,
    totalRxBytes: 991_200_000,
    totalTxBytes: 26_800_000,
    sampleCount: 2,
  },
];

type Renderer = ReturnType<typeof TestRenderer.create>;

function buttons(tree: Renderer) {
  return tree.root.findAllByType('button');
}

describe('GroupTrafficCards', () => {
  it('renders one button per group in the default grid layout', () => {
    const tree = TestRenderer.create(<GroupTrafficCards groups={GROUPS} />);
    expect(buttons(tree)).toHaveLength(2);
    expect(JSON.stringify(tree.toJSON())).toContain('Unjani');
  });

  it('renders one button per group in list layout', () => {
    const tree = TestRenderer.create(<GroupTrafficCards groups={GROUPS} layout="list" />);
    expect(buttons(tree)).toHaveLength(2);
    expect(JSON.stringify(tree.toJSON())).toContain('Newgen Network');
  });

  it('calls onSelectGroup with the group id in list layout', () => {
    const onSelectGroup = jest.fn();
    const tree = TestRenderer.create(
      <GroupTrafficCards groups={GROUPS} layout="list" onSelectGroup={onSelectGroup} />
    );
    act(() => {
      buttons(tree)[1].props.onClick();
    });
    expect(onSelectGroup).toHaveBeenCalledWith('g2');
  });

  it('falls back to the empty state when there are no groups', () => {
    const tree = TestRenderer.create(<GroupTrafficCards groups={[]} layout="list" />);
    expect(buttons(tree)).toHaveLength(0);
    expect(JSON.stringify(tree.toJSON())).toContain('Group Traffic');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest __tests__/components/admin/network/GroupTrafficCards.test.tsx
```

Expected: FAIL — the two `layout="list"` tests fail type-wise/behaviourally because the prop does not exist yet (TS error from ts-jest: `Property 'layout' does not exist on type 'GroupTrafficCardsProps'`).

- [ ] **Step 3: Add the layout prop**

In `components/admin/network/performance/GroupTrafficCards.tsx`, replace the props type and the `GroupTrafficCards` function body (lines 11–77) with:

```tsx
type GroupTrafficCardsProps = {
  groups: GroupTrafficCard[];
  selectedGroupId?: string | null;
  onSelectGroup?: (groupId: string) => void;
  layout?: 'grid' | 'list';
  className?: string;
};

export function GroupTrafficCards({
  groups,
  selectedGroupId,
  onSelectGroup,
  layout = 'grid',
  className,
}: GroupTrafficCardsProps) {
  if (!groups.length) {
    return (
      <AnalyticsEmptyState
        title="Group Traffic"
        description="No group traffic rollups in this window yet. Run a Ruijie sync to populate throughput."
        icon={<PiBroadcastBold className="w-10 h-10" aria-hidden="true" />}
        className={className}
      />
    );
  }

  const isList = layout === 'list';

  return (
    <Card
      className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">Group Traffic</CardTitle>
        <p className="text-xs text-slate-500">
          Summed Ruijie rollups in the selected time window
        </p>
      </CardHeader>
      <CardContent className={cn(isList ? 'space-y-1.5' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3')}>
        {groups.map((g) => {
          const active = g.groupId === selectedGroupId;
          return (
            <button
              key={g.groupId}
              type="button"
              onClick={() => onSelectGroup?.(g.groupId)}
              className={cn(
                'w-full text-left rounded-xl border transition-colors',
                isList ? 'px-3 py-2' : 'p-3',
                active
                  ? 'border-blue-300 bg-blue-50/60'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
              )}
            >
              {isList ? (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {g.groupName}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">
                    {formatBytes(g.totalBytes)}
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-900 truncate">{g.groupName}</p>
                  <p className="text-xl font-semibold tabular-nums text-slate-900 mt-1">
                    {formatBytes(g.totalBytes)}
                  </p>
                </>
              )}
              <p className={cn('text-xs text-slate-500', isList ? 'mt-0.5' : 'mt-1')}>
                ↓ {formatBytes(g.totalRxBytes)} · ↑ {formatBytes(g.totalTxBytes)} ·{' '}
                {g.sampleCount} samples
              </p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

Leave `SsidActivityCards` (lines 79 onward) untouched.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest __tests__/components/admin/network/GroupTrafficCards.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/admin/network/performance/GroupTrafficCards.tsx \
        __tests__/components/admin/network/GroupTrafficCards.test.tsx
git commit -m "feat(network): add list layout to GroupTrafficCards for narrow columns"
```

---

### Task 3: Restyle TrafficChart to the page's design tokens

**Files:**
- Modify: `components/admin/network/TrafficChart.tsx:175-251`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `TrafficChart`'s public props (`dataPoints`, `title`, `showLegend`, `height`) are unchanged. Task 4 keeps calling it the same way.

**Why no unit test:** this task changes only Tailwind classes and Recharts axis stroke colours. A test asserting class strings would restate the implementation without proving anything (see `.claude/rules/` — "Real Tests or No Tests"). Verification is the type check plus the visual check in Task 4.

`TrafficChart` has exactly one consumer, `app/admin/network/analytics/page.tsx`. `AppFlowChart`, `formatBytes` and `formatBps` live in the same file, are used elsewhere, and must not change.

- [ ] **Step 1: Restyle the empty state (lines 175–191)**

Replace with:

```tsx
  if (dataPoints.length === 0) {
    return (
      <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <PiChartLineBold className="w-4 h-4 text-slate-400" aria-hidden="true" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-slate-500">
            No traffic data available
          </div>
        </CardContent>
      </Card>
    );
  }
```

- [ ] **Step 2: Restyle the chart card header and delete the duplicated stat strip (lines 193–218)**

Replace the `<Card>` opening through the closing `</CardHeader>` with:

```tsx
    <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <PiChartLineBold className="w-4 h-4 text-slate-400" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
```

This removes the `Total DL / Avg / Total UL` block, which repeated the KPI row above it and forced the title onto two lines.

- [ ] **Step 3: Remove the now-unused stats calculation (lines 158–173)**

Delete the entire `const stats = useMemo(...)` block. Nothing else references `stats`.

- [ ] **Step 4: Switch the chart axes and grid to slate tokens (lines ~235–251)**

In the `<CartesianGrid>`, `<XAxis>` and `<YAxis>` elements, replace the colour values:
- `stroke="#E5E7EB"` → `stroke="#E2E8F0"` (slate-200) — both the `CartesianGrid` `stroke` and the `XAxis` `axisLine` stroke
- `stroke="#9CA3AF"` → `stroke="#94A3B8"` (slate-400) — on both `<XAxis>` and `<YAxis>`

Leave the `#10B981` / `#3B82F6` series colours and the gradient defs as they are.

- [ ] **Step 5: Remove now-unused imports**

`PiArrowDownBold` and `PiArrowUpBold` were only used by the deleted stat strip. Check whether `AppFlowChart` further down the file still uses them; if not, remove them from the `react-icons/pi` import. Verify with:

```bash
grep -n "PiArrowDownBold\|PiArrowUpBold\|formatBps" components/admin/network/TrafficChart.tsx
```

If `formatBps` is now unused inside the file, leave the `export function formatBps` declaration alone — `app/admin/network/analytics/page.tsx` imports it.

- [ ] **Step 6: Verify the file type-checks and existing tests still pass**

```bash
npx tsc --noEmit --jsx react --esModuleInterop --skipLibCheck \
  --moduleResolution bundler --module esnext --target es2020 \
  components/admin/network/TrafficChart.tsx 2>&1 | head -20
npx jest __tests__/components/admin/network/
```

Expected: no errors originating in `TrafficChart.tsx`; Task 1 and 2 tests still pass.

- [ ] **Step 7: Commit**

```bash
git add components/admin/network/TrafficChart.tsx
git commit -m "style(network): align TrafficChart with analytics page tokens, drop duplicated stat strip"
```

---

### Task 4: Restructure the analytics page

**Files:**
- Modify: `app/admin/network/analytics/page.tsx:187-372`

**Interfaces:**
- Consumes: `UnavailableDataPanel` and `UnavailablePanelItem` from Task 1; `layout="list"` on `GroupTrafficCards` from Task 2; the restyled `TrafficChart` from Task 3.
- Produces: nothing downstream.

- [ ] **Step 1: Add the new import**

In the `@/components/admin/network/performance` import block (lines 26–34), add `UnavailableDataPanel` to the named imports. Add a type import on the following line:

```ts
import type { UnavailablePanelItem } from '@/components/admin/network/performance';
```

- [ ] **Step 2: Derive the panel availability list**

After `const radio = data?.radio ?? emptyRadio;` (line 185), add:

```ts
  const panels = [
    {
      key: 'apps',
      title: 'Top Applications',
      has: appFlow.length > 0,
      reason: 'Ruijie EG app-flow returned no data for this group.',
    },
    {
      key: 'categories',
      title: 'Traffic by Category',
      has: appFlow.length > 0,
      reason: 'Needs app-flow groups from Ruijie.',
    },
    {
      key: 'ssid',
      title: 'SSID Activity',
      has: ssidActivity.length > 0,
      reason: 'No live STA associations carrying SSID names.',
    },
    {
      key: 'radio',
      title: 'Channel / Radio Util',
      has: radio.devicesWithRadio > 0,
      reason: 'No radio utilization in the device cache — sync live metrics first.',
    },
  ];

  const unavailablePanels: UnavailablePanelItem[] = panels
    .filter((p) => !p.has)
    .map(({ key, title, reason }) => ({ key, title, reason }));

  const hasApps = appFlow.length > 0;
  const hasSsid = ssidActivity.length > 0;
  const hasRadio = radio.devicesWithRadio > 0;
  const availableCount = panels.filter((p) => p.has).length;
```

- [ ] **Step 3: Rebuild the header row (lines 188–252)**

Replace the wrapper opening and the whole header block with:

```tsx
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Activity / Infrastructure / Analytics</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Network Analytics
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Group-scoped Ruijie throughput · app-flow · radio util from cache
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/health">System Health</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/devices">Devices</Link>
          </Button>
        </div>
      </div>
```

Note the wrapper loses the stray `-mx-1` and drops to `space-y-5`.

- [ ] **Step 4: Build the control strip**

The old source-badge block (lines 276–290) and the filter controls move into a single bar. Place this immediately after the header block from Step 3, **outside** the `{data ? ...}` conditional so the filters stay usable while data is null:

```tsx
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {data ? (
            <Badge
              variant="outline"
              className={
                data.source === 'live'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }
            >
              {data.source === 'live' ? 'Ruijie live' : 'Supabase rollups'}
            </Badge>
          ) : null}
          <span className="text-xs text-slate-400 truncate">
            {selectedGroup?.name || 'Network'} · {formatDuration(parseInt(selectedHours, 10))}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-[200px] rounded-lg border-slate-200">
              <SelectValue placeholder="Select network group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedHours} onValueChange={setSelectedHours}>
            <SelectTrigger className="w-[140px] rounded-lg border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 hours</SelectItem>
              <SelectItem value="12">Last 12 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="48">Last 2 days</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={preferLive ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const next = !preferLive;
              setPreferLive(next);
              fetchTrafficData(true, next);
            }}
          >
            <PiBroadcastBold className="w-4 h-4 mr-2" aria-hidden="true" />
            {preferLive ? 'Live' : 'Cached'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTrafficData(true)}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </div>
```

The error card and the "no network groups" card (lines 254–272) stay exactly as they are, immediately after this strip.

- [ ] **Step 5: Rebuild the chart row**

Inside `{data ? (<> ... </>) : null}`, the KPI grid (lines 292–321) is unchanged. Replace the standalone `<GroupTrafficCards …>` call (lines 323–327) and the chart grid (lines 329–343) with a single row:

```tsx
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TrafficChart
                dataPoints={data.traffic.dataPoints}
                title={`Traffic — ${selectedGroup?.name || 'Network'}`}
                height={340}
              />
            </div>
            <div className="space-y-4">
              <GroupTrafficCards
                groups={groupTraffic}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
                layout="list"
              />
              <BandwidthChart
                data={bandwidthSeries}
                title="Throughput (Mbps)"
                subtitle="From rollup avg rates"
                height={200}
              />
            </div>
          </div>
```

- [ ] **Step 6: Replace the two panel rows with conditional rendering plus the unavailable card**

Replace both panel grids (lines 345–362) with:

```tsx
          {availableCount > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {hasApps ? <TopApplicationsCard data={appFlow} maxItems={10} /> : null}
              {hasApps ? (
                <Card className="rounded-xl border border-slate-200/80 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Traffic by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AppCategoryBreakdown data={appFlow} />
                  </CardContent>
                </Card>
              ) : null}
              {hasSsid ? <SsidActivityCards ssids={ssidActivity} /> : null}
              {hasRadio ? <RadioUtilSummaryCard radio={radio} /> : null}
            </div>
          ) : null}

          <UnavailableDataPanel items={unavailablePanels} />
```

- [ ] **Step 7: Type check**

```bash
npm run type-check:memory 2>&1 | grep -E "app/admin/network/analytics|components/admin/network" | head -20
```

Expected: no output (no errors in the touched files). Pre-existing errors elsewhere are out of scope.

- [ ] **Step 8: Visual verification on the dev server**

```bash
npm run dev:memory
```

Open `/admin/network/analytics` and confirm:
1. Header is one row; filters and the source badge share the single control strip; no orphan badge row.
2. `Traffic — <group>` title renders on **one** line, with no `Total DL / Total UL` strip beside it.
3. Group Traffic renders as a list in the right column above Throughput.
4. With `UnjanihAPaxS` selected (no app-flow, no SSID, no radio): the 2-column panel grid does not render at all, and one "Not available for this group" card lists all four panels with their reasons.
5. Clicking a Group Traffic row still switches the selected group and refetches.
6. Narrow the window below `lg`: the right column stacks under the traffic chart and the control strip wraps without overlap.
7. No console errors.

- [ ] **Step 9: Commit**

```bash
git add app/admin/network/analytics/page.tsx
git commit -m "feat(network): dense single-scroll layout for /admin/network/analytics"
```

- [ ] **Step 10: Push**

```bash
git push
```

---

## Definition of Done

- All four tasks committed on `feat/network-analytics-layout` and pushed.
- `npx jest __tests__/components/admin/network/` passes (7 tests).
- `npm run type-check:memory` reports no errors in the five touched files.
- Visual checks 1–7 in Task 4 Step 8 confirmed against a running dev server.
