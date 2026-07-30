# Billing + AR Analytics Network Console Look — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/admin/billing` and `/admin/finance/ar-analytics` to match the visual language of `/admin/network/analytics` and `/admin/network/devices`, with zero visual change to any other page.

**Architecture:** Promote `MetricCard` from `components/admin/network/performance/` into the shared `components/backend/` kit, leaving a re-export shim so the three network pages are untouched. Then restyle the two target pages onto the promoted card plus the network card/table/banner class conventions. Presentation only — no data, API, or logic changes.

**Tech Stack:** Next.js 15 (App Router, client components), TypeScript, Tailwind, shadcn/ui (`Card`, `Select`, `Badge`, `Tabs`, `chart`), Recharts 2.15, `react-icons/pi` (Phosphor), Jest 30 (node env).

**Spec:** `docs/superpowers/specs/2026-07-30-billing-ar-network-console-look-design.md`

---

## Global Constraints

- **Working directory is the worktree:** `/home/circletel/.worktrees/billing-console` on branch `feat/billing-network-console-look`. Never edit `/home/circletel` directly.
- **Presentation only.** Do not change data fetching, API routes, SQL, types under `lib/billing/recon-hub/`, `filterExceptions`, or any `/api/*` handler. If a restyle appears to need a data change, stop and report.
- **No new dependencies.** Do not `npm install` anything. There is no React component test infrastructure (see "Verification model" below) and adding it is out of scope.
- **`MetricCardProps` shape is frozen.** No prop renames, removals, or default changes. Adding the `export` keyword is the only permitted edit.
- **Palette:** `slate-*`, not `gray-*`. Metric values `font-semibold`, not `font-bold`. Grid gaps `gap-4`.
- **Icons:** Phosphor via `react-icons/pi` only. Decorative icons get `aria-hidden="true"`.
- **Preserve semantic colour.** These encode data, not decoration — keep their current hex/classes and restyle only the surrounding chrome:
  - AR aging buckets: `current #22c55e`, `1-30 #eab308`, `31-60 #f97316`, `61-90 #ef4444`, `90+ #991b1b`
  - Channels: `sms #3b82f6`, `email #8b5cf6`
  - `CashMatchStrip` day-done green/red tint; `DayDoneBanner` green/red
  - `ExceptionTable` red/amber severity text
  - All `StatusBadge` variants
- **Orange is an accent only:** one primary CTA on billing, filter chips, links. Never body text.
- **No dark mode.** Neither reference page implements it. `dark:` classes removed with the tinted tiles are not replaced.
- **Commit after every task.** Never `git commit --no-verify`.

### Verification model (read before Task 1)

This repo has **no working React component test infrastructure**, verified at plan time:

- `jest.config.js` sets `testEnvironment: 'jest-environment-node'` — no DOM.
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom` are all **not installed**.
- The only `.test.tsx` in the repo (`components/admin/compliance/__tests__/compliance-queue.test.tsx`) imports from `vitest` and cannot execute. It is dead code. Do not use it as a pattern.

A restyle introduces **no new logic**, so there is nothing meaningful to unit test. Writing tests that assert Tailwind class strings would be the fake-test anti-pattern (`.claude/rules/anti-patterns.md`, Rule 11) and adding four dev dependencies would violate Rule 12. **Do not write component tests for this work.**

Verification for every task is therefore:

1. **Type-check delta** — the repo carries pre-existing `tsc` errors, so "zero errors" is not the bar. Compare against the Task 0 baseline; your touched files must contribute **no new** errors.

   Measured at plan time on `origin/main` (`8b481677`): **211 errors** — note this is lower than the "~295" figure in `.claude/rules/pre-push-hook.md`, which is stale. Capture your own baseline in Task 0 rather than trusting either number.

   **Crucially, all 16 files this plan touches are currently type-clean, as are the three network consumer pages.** Verified:

   ```
   grep -E "app/admin/billing/page|ar-analytics|recon/|components/backend/|network/performance/MetricCard" → NONE
   grep -E "app/admin/network/(analytics|devices|health)"                                                   → NONE
   ```

   This is why each task's verification can simply grep the baseline output for its own filenames and expect nothing: any hit is a regression you just introduced, not pre-existing noise.
2. **Build** — `npm run build:memory` must succeed (run once in Task 14, not per task; it takes 10–18 min).
3. **Existing Jest suites stay green** — the recon-hub and network aggregate suites.
4. **Content-identity proof** for the `MetricCard` move (Task 1) — deterministic, and a stronger guarantee than a screenshot that the three network pages are unchanged.
5. **Visual inspection** against a local dev server (Task 14).

### Two environment traps (both verified at plan time)

**Trap 1 — Jest finds zero tests inside a worktree.** `jest.config.js` sets:

```js
modulePathIgnorePatterns: ['/.worktrees/', '/.claude/worktrees/'],
testPathIgnorePatterns: ['/node_modules/', '/.next/', '/coverage/', '/dist/', '/.worktrees/', '/.claude/worktrees/'],
```

Because the worktree's absolute path contains `/.worktrees/`, a bare `npx jest <path>` reports `0 matches` and **exits 1** — which reads like "no tests" rather than "tests were skipped". Always override on the CLI:

```bash
npx jest <paths> --modulePathIgnorePatterns=/node_modules/ --testPathIgnorePatterns=/node_modules/
```

**Trap 2 — `/admin/*` requires auth locally.** `middleware/admin-auth.ts` has an opt-in dev bypass requiring **all** of: `ALLOW_DEV_ADMIN_BYPASS=true`, `NODE_ENV=development`, and a `localhost`/`127.0.0.1` Host header. Start the dev server as:

```bash
ALLOW_DEV_ADMIN_BYPASS=true npm run dev:memory
```

Then browse `http://localhost:3000/admin/...`. Without the env var you get redirected to login.

---

## File Structure

**Unit 1 — promote the card (4 files)**

| File | Responsibility |
|---|---|
| `components/backend/MetricCard.tsx` | CREATE. Canonical metric card. Content identical to the network original + `export` on the type. |
| `components/backend/index.ts` | MODIFY. Export `MetricCard`, `MetricCardProps`. |
| `components/admin/network/performance/MetricCard.tsx` | MODIFY. Two-line re-export shim. |
| `docs/design/BACKEND_UI_KIT.md` | MODIFY. Network console becomes the documented reference; add `MetricCard` row. |

**Unit 2 — `/admin/billing` (6 files)**

| File | Responsibility |
|---|---|
| `app/admin/billing/page.tsx` | MODIFY. Header, eyebrow, `size="sm"` actions, meta strip, footer meta. |
| `components/admin/billing/recon/CashMatchStrip.tsx` | MODIFY. `StatCard` → `MetricCard`. |
| `components/admin/billing/recon/SecondaryKpis.tsx` | MODIFY. Tile shell → network tile. |
| `components/admin/billing/recon/DayDoneBanner.tsx` | MODIFY. Banner shell → network banner. |
| `components/admin/billing/recon/ExceptionTable.tsx` | MODIFY. `SectionCard` → network `Card`. Table markup untouched. |
| `components/admin/billing/recon/DeepLinks.tsx` | MODIFY. Card shell radius/border. |

**Unit 3 — `/admin/finance/ar-analytics` (6 files)**

| File | Responsibility |
|---|---|
| `app/admin/finance/ar-analytics/page.tsx` | MODIFY. Shrinks to fetch + state + header + tabs wiring (~170 lines). |
| `components/admin/finance/ar/shared.tsx` | CREATE. `ARAnalyticsData` type, panel prop types, `AGING_COLORS`, `CHANNEL_COLORS`, `formatCurrency`, `formatShortDate`, `TrendIcon`. |
| `components/admin/finance/ar/ArAgingPanel.tsx` | CREATE. Aging bar chart + aging summary table. |
| `components/admin/finance/ar/DsoMetricsPanel.tsx` | CREATE. 3 DSO cards + collection performance tiles. |
| `components/admin/finance/ar/NotificationsPanel.tsx` | CREATE. Channel donut, delivery stats, recent notifications table. |
| `components/admin/finance/ar/HistoryPanel.tsx` | CREATE. AR/DSO trend + notifications/collections charts. |

**Total: 17 files changed** — 16 under `app/`/`components/` plus `docs/design/BACKEND_UI_KIT.md`.

Count reconciliation against the spec's estimate of 15:

| | Files |
|---|---|
| Spec estimate | 15 |
| `+ components/admin/finance/ar/shared.tsx` | 16 |
| `+ components/admin/finance/ar/index.ts` | 17 |

Both additions are new files inside the already-approved `components/admin/finance/ar/` directory. `shared.tsx` holds the `ARAnalyticsData` type, the aging/channel colour constants, and the formatters that currently live inside `page.tsx` — all four panels need them, and duplicating them four times would violate DRY. `index.ts` is the barrel, matching the `performance/index.ts` convention.

---

## Task 0: Prepare the worktree and capture baselines

The worktree has no `node_modules`, and every later task's "no new type errors" check needs a baseline to diff against.

**Files:**
- Create: `.scratch/baseline-typecheck.txt` (gitignored — do not commit)
- Create: `.scratch/baseline-jest.txt` (gitignored — do not commit)

**Interfaces:**
- Consumes: nothing.
- Produces: `.scratch/baseline-typecheck.txt` — the pre-change `tsc --noEmit` output, used by every subsequent task's verification step.

- [ ] **Step 1: Confirm you are in the worktree on the right branch**

```bash
cd /home/circletel/.worktrees/billing-console
git status -sb
```

Expected: `## feat/billing-network-console-look...origin/feat/billing-network-console-look`

- [ ] **Step 2: Install dependencies**

```bash
npm ci
```

This also runs the `prepare` script (`git config core.hooksPath .githooks`), which the pre-push hook needs. Takes several minutes.

- [ ] **Step 3: Capture the type-check baseline**

```bash
mkdir -p .scratch
npm run type-check:memory 2>&1 | tee .scratch/baseline-typecheck.txt | tail -5
grep -c "error TS" .scratch/baseline-typecheck.txt || true
```

Expected: **211** `error TS` lines on `origin/main` `8b481677`; a different base commit will differ. Record the count — this is the number to compare against in Task 13. A non-zero exit is expected and correct.

Then confirm your touched files start clean, so later per-task greps are trustworthy:

```bash
grep -E "app/admin/billing/page|ar-analytics|recon/|components/backend/|network/performance/MetricCard|finance/ar/" .scratch/baseline-typecheck.txt \
  || echo "ALL TARGET FILES CLEAN — per-task greps are meaningful"
```

Expected: `ALL TARGET FILES CLEAN — per-task greps are meaningful`. If a target file already has errors, note them — that file's per-task check must then diff rather than expect zero hits.

- [ ] **Step 4: Capture the Jest baseline (note the worktree override)**

```bash
npx jest __tests__/lib/billing __tests__/lib/network \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/ 2>&1 | tee .scratch/baseline-jest.txt | tail -8
```

Expected, measured at plan time: `Test Suites: 2 skipped, 17 passed, 17 of 19 total` and `Tests: 12 skipped, 142 passed, 154 total`. The 2 skipped suites are pre-existing and not your concern.

If you see `0 matches` and exit 1, you omitted the override flags — see Trap 1.

- [ ] **Step 5: Verify `.scratch/` is gitignored**

```bash
git check-ignore -v .scratch/baseline-typecheck.txt && echo "IGNORED — good"
git status --porcelain
```

Expected: `IGNORED — good`, and `git status --porcelain` shows nothing. If `.scratch/` is NOT ignored, add it to `.gitignore` and commit that one-line change:

```bash
echo ".scratch/" >> .gitignore
git add .gitignore && git commit -m "chore: gitignore .scratch baseline dir"
```

---

## Task 1: Promote MetricCard into the backend kit

The whole restyle depends on this card, and the three network pages must not move a pixel.

**Files:**
- Create: `components/backend/MetricCard.tsx`
- Modify: `components/backend/index.ts`
- Modify: `components/admin/network/performance/MetricCard.tsx` (all 52 lines replaced)
- Modify: `docs/design/BACKEND_UI_KIT.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `MetricCard` and `MetricCardProps` from `@/components/backend`. Signature — all props except `title` and `value` are optional:
  ```ts
  export type MetricCardProps = {
    title: string;
    value: string;
    subtitle?: string;
    delta?: string | null;
    deltaPositive?: boolean | null;
    children?: ReactNode;
    className?: string;
  };
  ```
  Note `value` is `string` — numeric callers must template it (`` `${n}` ``). `children` renders **below** the value/subtitle/delta block.

- [ ] **Step 1: Snapshot the original for the identity proof**

```bash
cp components/admin/network/performance/MetricCard.tsx /tmp/metriccard-original.tsx
wc -l /tmp/metriccard-original.tsx
```

Expected: `52`.

- [ ] **Step 2: Create `components/backend/MetricCard.tsx`**

This is the original file verbatim, with `export` added to the type declaration and the doc comment updated.

```tsx
'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Canonical metric card for backend UIs — the network console look.
 * Promoted from components/admin/network/performance/MetricCard.tsx, which is
 * now a re-export shim so the network pages render identically.
 *
 * Use this (not StatCard) for new/migrated pages. `children` renders below the
 * value block — pass a small icon or an inline chart.
 */
export type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string | null;
  deltaPositive?: boolean | null;
  children?: ReactNode;
  className?: string;
};

export function MetricCard({
  title,
  value,
  subtitle,
  delta,
  deltaPositive,
  children,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
          {delta ? (
            <p
              className={cn(
                'text-xs mt-1 font-medium',
                deltaPositive === true && 'text-blue-600',
                deltaPositive === false && 'text-amber-600',
                deltaPositive == null && 'text-slate-500'
              )}
            >
              {delta}
            </p>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Prove the render body is byte-identical to the original**

This is the regression proof for the three network pages. It compares everything from `export function MetricCard` onward.

```bash
diff <(sed -n '/^export function MetricCard/,$p' /tmp/metriccard-original.tsx) \
     <(sed -n '/^export function MetricCard/,$p' components/backend/MetricCard.tsx) \
  && echo "IDENTICAL RENDER BODY — network pages cannot change"
```

Expected: `IDENTICAL RENDER BODY — network pages cannot change`. If `diff` prints anything, you altered the JSX or classes — revert to the original text and retry.

- [ ] **Step 4: Prove the prop shape is unchanged**

```bash
diff <(sed -n '/MetricCardProps = {/,/^};\?$/p' /tmp/metriccard-original.tsx | sed 's/^export //') \
     <(sed -n '/MetricCardProps = {/,/^};\?$/p' components/backend/MetricCard.tsx | sed 's/^export //') \
  && echo "PROP SHAPE UNCHANGED"
```

Expected: `PROP SHAPE UNCHANGED`.

- [ ] **Step 5: Replace the network file with a re-export shim**

Overwrite all 52 lines of `components/admin/network/performance/MetricCard.tsx` with exactly:

```tsx
/**
 * Back-compat shim. MetricCard was promoted to the shared backend kit —
 * see components/backend/MetricCard.tsx and docs/design/BACKEND_UI_KIT.md.
 * Imports the file directly (not the @/components/backend barrel) to avoid a cycle.
 */
export { MetricCard } from '@/components/backend/MetricCard';
export type { MetricCardProps } from '@/components/backend/MetricCard';
```

- [ ] **Step 6: Export from the kit barrel**

In `components/backend/index.ts`, insert immediately after the `StatCard` export lines:

```ts
export { MetricCard } from './MetricCard';
export type { MetricCardProps } from './MetricCard';
```

- [ ] **Step 7: Confirm the network barrel still resolves and no cycle was introduced**

```bash
grep -n "MetricCard" components/admin/network/performance/index.ts
grep -rn "from '@/components/backend'" components/backend/MetricCard.tsx || echo "no barrel self-import — good"
```

Expected: the barrel still has `export { MetricCard } from './MetricCard';` (unchanged), and `no barrel self-import — good`.

- [ ] **Step 8: Confirm the three network pages were not edited**

```bash
git status --porcelain app/admin/network/
```

Expected: **empty output.** If any network page shows as modified, revert it — this task must not touch them.

- [ ] **Step 9: Type-check the moved module and its consumers**

```bash
npm run type-check:memory 2>&1 | grep -E "components/backend/MetricCard|performance/MetricCard|app/admin/network/(analytics|devices|health)" || echo "NO ERRORS in moved module or network consumers"
```

Expected: `NO ERRORS in moved module or network consumers`.

- [ ] **Step 10: Update the kit doc**

In `docs/design/BACKEND_UI_KIT.md`:

Replace the `**Reference look:**` bullet with:

```markdown
- **Reference look:** the network console (`app/admin/network/analytics`, `app/admin/network/devices`) — functional minimalism on `slate`: white surfaces, `border-slate-200/80`, `rounded-xl`, `shadow-sm`, breadcrumb eyebrow above the H1, outline `size="sm"` action rows, source/freshness meta strips, `tabular-nums` numbers, restrained orange accent.
```

Add to the Components table, directly after the `StatCard` row:

```markdown
| `MetricCard` | **Preferred** metric card — network console look. Label above, big `font-semibold` value, optional `children` (icon or inline chart) below. |
```

Change the existing `StatCard` row's description to:

```markdown
| `StatCard` | Legacy metric card (gray, three layout variants). Retained for unmigrated pages — prefer `MetricCard` for new work. |
```

Add this paragraph immediately above the `## Back-compat` heading:

```markdown
## Colour that carries meaning

Status colour comes only from `StatusBadge`/`getStatusVariant`. Beyond that, some
surfaces use colour as *data* — AR aging buckets (green→dark-red by age), notification
channels (SMS blue / Email purple), cash-match day-done state (green/red), and exception
severity (red/amber). Preserve those hues when restyling; do not flatten them into the
chart palette. Consistency of *chrome* (grid, axes, tooltips, card shells), not of hue.
```

- [ ] **Step 11: Commit**

```bash
git add components/backend/MetricCard.tsx components/backend/index.ts \
        components/admin/network/performance/MetricCard.tsx \
        docs/design/BACKEND_UI_KIT.md
git commit -m "refactor(backend-kit): promote MetricCard to shared kit

Network console becomes the kit's documented reference look. The network
copy is now a re-export shim, so analytics/devices/health render identically
(render body verified byte-identical). Adds a note that semantic colour
(aging buckets, channels, day-done, severity) survives restyles."
```

---

## Task 2: Billing page header and chrome

**Files:**
- Modify: `app/admin/billing/page.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing consumed by later tasks. `PageHeader` is no longer imported by this file.

- [ ] **Step 1: Swap the imports**

Remove `PageHeader` from the `@/components/backend` import (keep `AdminPage`, `LoadingState`, `ErrorState`). Add `Badge`, and add `PiClockBold` to the existing `react-icons/pi` import.

```tsx
import { PiArrowsClockwiseBold, PiClockBold, PiFileTextBold, PiPlayBold } from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { AdminPage, LoadingState, ErrorState } from '@/components/backend';
```

- [ ] **Step 2: Replace the `<PageHeader …/>` block (currently lines 131–177) with the network header**

```tsx
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Finance / Billing / Cash Match</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Billing</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Daily cash match — NetCash completed payments to CircleTel invoices
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={window} onValueChange={(value) => setWindow(value as ReconWindow)}>
            <SelectTrigger className="w-[160px] rounded-lg border-slate-200" aria-label="Recon window">
              <SelectValue placeholder="Window" />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchHub} disabled={loading || triggerLoading}>
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerPayNow}
            disabled={triggerLoading || loading}
          >
            <PiPlayBold className="w-4 h-4 mr-2" />
            {triggerLoading ? 'Triggering…' : 'Trigger PayNow recon'}
          </Button>
          <Button size="sm" className="bg-circleTel-orange hover:bg-circleTel-orange-dark" asChild>
            <Link href="/admin/billing/invoices">
              <PiFileTextBold className="w-4 h-4 mr-2" />
              View All Invoices
            </Link>
          </Button>
        </div>
      </div>
```

Note the CTA changed from `<Link><Button>` to `<Button asChild><Link>` — that is the pattern the network pages use and it avoids nesting a button inside an anchor.

- [ ] **Step 3: Restyle the inline error to the network banner**

Replace the existing `{error && data && (…)}` block with:

```tsx
      {error && data && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50/80 shadow-sm px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
```

- [ ] **Step 4: Add the meta strip directly below the header**

Insert immediately after the header `</div>`, before the error block:

```tsx
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
          Supabase recon hub
        </Badge>
        <span className="text-xs text-slate-400">Window · {windowLabel(window)}</span>
        {summary ? (
          <span className="text-xs text-slate-500">
            {summary.netcashCompletedInWindow} NetCash completed ·{' '}
            {summary.netcashMatchedInWindow} matched
          </span>
        ) : null}
      </div>
```

`summary` is declared at line 127 (`const summary = data?.summary;`) — move that declaration above this JSX if it is not already before the `return`. It is: it sits just before `return (`, so no move is needed.

- [ ] **Step 5: Add the footer meta line as the last child of `<AdminPage>`**

Insert immediately after `<DeepLinks />`:

```tsx
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <PiClockBold className="w-4 h-4" aria-hidden="true" />
          {loading ? 'Refreshing…' : `Recon window · ${windowLabel(window)}`}
        </span>
      </div>
```

- [ ] **Step 6: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "app/admin/billing/page.tsx" || echo "NO ERRORS in billing page"
```

Expected: `NO ERRORS in billing page`.

- [ ] **Step 7: Confirm `PageHeader` is genuinely unused here now**

```bash
grep -n "PageHeader" app/admin/billing/page.tsx || echo "PageHeader removed — good"
```

Expected: `PageHeader removed — good`.

- [ ] **Step 8: Commit**

```bash
git add app/admin/billing/page.tsx
git commit -m "style(billing): network console header, meta strip, sm action row"
```

---

## Task 3: CashMatchStrip onto MetricCard

**Files:**
- Modify: `components/admin/billing/recon/CashMatchStrip.tsx`

**Interfaces:**
- Consumes: `MetricCard`, from `@/components/backend` (Task 1).
- Produces: nothing. `CashMatchStripProps` is unchanged — `page.tsx` needs no edit.

- [ ] **Step 1: Swap the import**

Replace `import { StatCard } from '@/components/admin/shared';` with:

```tsx
import { MetricCard } from '@/components/backend';
```

- [ ] **Step 2: Replace the four cards in the returned grid**

`MetricCard` has no `icon`/`iconBgColor`/`iconColor` props — the icon becomes a child, and `value` must be a string. The semantic green/red/amber tint moves to `className`.

```tsx
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Unmatched NetCash→CT"
        value={`${unmatchedNetcashToCt}`}
        subtitle={unmatchedClear ? 'Day-done clear' : 'Needs invoice match'}
        className={
          unmatchedClear
            ? 'border-green-200/80 bg-green-50/40'
            : 'border-red-200/80 bg-red-50/40'
        }
      >
        {unmatchedClear ? (
          <PiCheckCircleBold className="w-5 h-5 text-green-600" aria-hidden="true" />
        ) : (
          <PiWarningBold className="w-5 h-5 text-red-600" aria-hidden="true" />
        )}
      </MetricCard>

      <MetricCard
        title="NetCash completed"
        value={`${netcashCompletedInWindow}`}
        subtitle={`${netcashMatchedInWindow} matched in window`}
      >
        <PiCurrencyCircleDollarBold className="w-5 h-5 text-slate-500" aria-hidden="true" />
      </MetricCard>

      <MetricCard
        title="Zoho payment sync lag"
        value={`${zohoPaymentLagCount}`}
        subtitle="Pending or failed sync"
        className={zohoPaymentLagCount > 0 ? 'border-amber-200/80 bg-amber-50/40' : undefined}
      >
        <PiWarningBold
          className={`w-5 h-5 ${zohoPaymentLagCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}
          aria-hidden="true"
        />
      </MetricCard>

      <MetricCard
        title="PayNow recon last run"
        value={paynowLabel}
        subtitle={formatLastRunAt(paynowRecon.lastRunAt)}
      >
        <span className={paynowIconColor}>{paynowIcon}</span>
      </MetricCard>
    </div>
  );
```

- [ ] **Step 3: Replace the `paynowIcon` block with icon + colour**

The old code derived `iconBgColor`/`iconColor` in the JSX. Replace the existing `const paynowIcon = …` declaration with both of these:

```tsx
  const paynowIcon =
    paynowStatus === 'success' ? (
      <PiCheckCircleBold className="w-5 h-5" aria-hidden="true" />
    ) : paynowStatus === 'failed' ? (
      <PiXCircleBold className="w-5 h-5" aria-hidden="true" />
    ) : (
      <PiClockBold className="w-5 h-5" aria-hidden="true" />
    );

  const paynowIconColor =
    paynowStatus === 'success'
      ? 'text-green-600'
      : paynowStatus === 'failed'
        ? 'text-red-600'
        : paynowStatus === 'partial'
          ? 'text-amber-600'
          : 'text-slate-400';
```

- [ ] **Step 4: Confirm the `href` drop is intentional and restore navigation**

The old Zoho card passed `href="/admin/integrations/zoho-books"`; `MetricCard` has no `href`. Wrap only that card in a `Link` so the navigation is not silently lost. Add `import Link from 'next/link';` at the top and wrap:

```tsx
      <Link href="/admin/integrations/zoho-books" className="block">
        <MetricCard
          title="Zoho payment sync lag"
          value={`${zohoPaymentLagCount}`}
          subtitle="Pending or failed sync"
          className={
            zohoPaymentLagCount > 0
              ? 'border-amber-200/80 bg-amber-50/40 transition-shadow hover:shadow-md'
              : 'transition-shadow hover:shadow-md'
          }
        >
          <PiWarningBold
            className={`w-5 h-5 ${zohoPaymentLagCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}
            aria-hidden="true"
          />
        </MetricCard>
      </Link>
```

Use this wrapped version in place of the bare Zoho `MetricCard` from Step 2.

- [ ] **Step 5: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "CashMatchStrip" || echo "NO ERRORS in CashMatchStrip"
```

Expected: `NO ERRORS in CashMatchStrip`. A `Type 'number' is not assignable to type 'string'` here means you missed a `` `${…}` `` on a `value`.

- [ ] **Step 6: Commit**

```bash
git add components/admin/billing/recon/CashMatchStrip.tsx
git commit -m "style(billing): CashMatchStrip onto MetricCard, keep day-done tint"
```

---

## Task 4: Billing tiles, banner, and deep links

Three small shell changes. A reviewer would accept or reject them together.

**Files:**
- Modify: `components/admin/billing/recon/SecondaryKpis.tsx`
- Modify: `components/admin/billing/recon/DayDoneBanner.tsx`
- Modify: `components/admin/billing/recon/DeepLinks.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. All three prop interfaces unchanged.

- [ ] **Step 1: `SecondaryKpis` — tile shell to the network tile**

Change the grid gap and the tile wrapper. Replace the `<div key={label} …>` className with the `GroupTrafficCards` tile treatment, and the label/value classes:

```tsx
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="truncate text-xl font-semibold tabular-nums text-slate-900 mt-0.5">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
```

The uppercase `text-[11px] … uppercase tracking-wide` label is dropped: the network tiles use plain sentence-case `text-xs text-slate-500`.

- [ ] **Step 2: `DayDoneBanner` — both branches to the network banner shell**

Change only the two wrapper classNames. Day-done branch:

```tsx
        className="flex items-start gap-3 rounded-xl border border-green-200/80 bg-green-50/80 shadow-sm px-4 py-3"
```

Unmatched branch:

```tsx
        className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/80 shadow-sm px-4 py-3"
```

Leave the icons, `role="status"` / `role="alert"`, and all text classes exactly as they are — the green/red is semantic state.

- [ ] **Step 3: `DeepLinks` — card shell radius and border**

Change the grid gap and the `<Link>` className:

```tsx
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {LINKS.map(({ href, title, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-circleTel-orange/40 hover:bg-orange-50/40"
        >
```

Leave the orange icon chip and hover-orange title — orange as accent is the kit rule.

- [ ] **Step 4: Verify no new type errors (these are class-only edits, so expect none)**

```bash
npm run type-check:memory 2>&1 | grep -E "SecondaryKpis|DayDoneBanner|DeepLinks" || echo "NO ERRORS in the three shells"
```

Expected: `NO ERRORS in the three shells`.

- [ ] **Step 5: Commit**

```bash
git add components/admin/billing/recon/SecondaryKpis.tsx \
        components/admin/billing/recon/DayDoneBanner.tsx \
        components/admin/billing/recon/DeepLinks.tsx
git commit -m "style(billing): rounded-xl slate shells for KPI tiles, banner, deep links"
```

---

## Task 5: ExceptionTable card shell

The table markup already matches the network treatment. Only the wrapper changes.

**Files:**
- Modify: `components/admin/billing/recon/ExceptionTable.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. `ExceptionTableProps` unchanged.

- [ ] **Step 1: Swap the imports**

Replace:

```tsx
import { SectionCard, StatusBadge } from '@/components/admin/shared';
import type { StatusVariant } from '@/components/admin/shared';
```

with:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/backend';
import type { StatusVariant } from '@/components/backend';
```

- [ ] **Step 2: Replace the `<SectionCard>` wrapper with the network `Card`**

The opening becomes:

```tsx
    <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">Exceptions</CardTitle>
          <p className="text-xs text-slate-500">
            Unmatched cash, Zoho sync lag, and open AR needing action
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500">{rows.length} shown</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
```

and the closing `</SectionCard>` becomes:

```tsx
        </div>
      </CardContent>
    </Card>
```

Keep the filter-chip block, the empty state, and the entire `<table>` exactly as they are.

- [ ] **Step 3: Round the empty state and table container to match**

Two class-only changes inside the body. Empty state:

```tsx
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
```

Table container:

```tsx
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
```

- [ ] **Step 4: Confirm the table markup was not touched**

```bash
git diff components/admin/billing/recon/ExceptionTable.tsx | grep -E "^[-+].*(uppercase tracking-wider|divide-slate-100|hover:bg-slate-50|<th |<td )" || echo "TABLE MARKUP UNTOUCHED — good"
```

Expected: `TABLE MARKUP UNTOUCHED — good`.

- [ ] **Step 5: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "ExceptionTable" || echo "NO ERRORS in ExceptionTable"
```

Expected: `NO ERRORS in ExceptionTable`.

- [ ] **Step 6: Commit**

```bash
git add components/admin/billing/recon/ExceptionTable.tsx
git commit -m "style(billing): ExceptionTable onto network Card shell

Table markup untouched — it already matched the network treatment."
```

---

## Task 6: Extract the four AR panels as a pure move

**No restyling in this task.** Move the markup unchanged so that if the page breaks, it is a move bug and not a style bug. Restyling happens in Tasks 8–12.

**Files:**
- Create: `components/admin/finance/ar/shared.tsx`
- Create: `components/admin/finance/ar/ArAgingPanel.tsx`
- Create: `components/admin/finance/ar/DsoMetricsPanel.tsx`
- Create: `components/admin/finance/ar/NotificationsPanel.tsx`
- Create: `components/admin/finance/ar/HistoryPanel.tsx`
- Modify: `app/admin/finance/ar-analytics/page.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, all from `@/components/admin/finance/ar/shared`:
  ```ts
  export interface ARAnalyticsData { /* moved verbatim from page.tsx lines 68-131 */ }
  export const AGING_COLORS: { current: string; overdue_1_30: string; overdue_31_60: string; overdue_61_90: string; overdue_90_plus: string };
  export const CHANNEL_COLORS: { sms: string; email: string };
  export function formatCurrency(amount: number): string;
  export function formatShortDate(dateStr: string): string;
  export function TrendIcon({ trend }: { trend: string }): React.ReactElement;
  export interface AgingBucket { name: string; amount: number; count: number; fill: string }
  export function buildAgingBuckets(aging: ARAnalyticsData['ar_aging']): AgingBucket[];
  ```
  And each panel takes exactly one prop, `data: ARAnalyticsData`:
  ```ts
  export function ArAgingPanel({ data }: { data: ARAnalyticsData }): React.ReactElement;
  export function DsoMetricsPanel({ data }: { data: ARAnalyticsData }): React.ReactElement;
  export function NotificationsPanel({ data }: { data: ARAnalyticsData }): React.ReactElement;
  export function HistoryPanel({ data }: { data: ARAnalyticsData }): React.ReactElement;
  ```

- [ ] **Step 1: Create `components/admin/finance/ar/shared.tsx`**

```tsx
'use client';

import { PiMinusBold, PiTrendDownBold, PiTrendUpBold } from 'react-icons/pi';

/** Response shape of GET /api/admin/finance/ar-analytics — moved from the page. */
export interface ARAnalyticsData {
  ar_aging: {
    total_outstanding_invoices: number;
    total_outstanding_amount: number;
    current_count: number;
    current_amount: number;
    overdue_1_30_count: number;
    overdue_1_30_amount: number;
    overdue_31_60_count: number;
    overdue_31_60_amount: number;
    overdue_61_90_count: number;
    overdue_61_90_amount: number;
    overdue_90_plus_count: number;
    overdue_90_plus_amount: number;
    avg_days_overdue: number;
  };
  dso: {
    dso_current: number;
    dso_30_day_avg: number;
    dso_trend: 'improving' | 'stable' | 'worsening';
    best_possible_dso: number;
    collection_effectiveness_index: number;
  };
  collection: {
    total_notifications_sent: number;
    total_amount_collected: number;
    collection_rate: number;
    avg_days_to_payment: number;
    response_rate: number;
  };
  notifications: {
    total_sms: number;
    total_email: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
  };
  daily_analytics: Array<{
    date: string;
    notification_type: string;
    total_sent: number;
    delivered: number;
    failed: number;
    total_amount_notified: number;
  }>;
  recent_notifications: Array<{
    id: string;
    invoice_number: string;
    notification_type: string;
    recipient: string;
    status: string;
    amount_due: number;
    days_overdue: number;
    created_at: string;
  }>;
  historical: Array<{
    snapshot_date: string;
    total_outstanding: number;
    dso_current: number;
    sms_sent_count: number;
    email_sent_count: number;
    payments_received_amount: number;
  }> | null;
}

/**
 * Aging severity ramp — green to dark red by age. Semantic, NOT the chart palette.
 * Do not replace with --chart-* vars; the hue is the "how overdue" signal.
 */
export const AGING_COLORS = {
  current: '#22c55e',
  overdue_1_30: '#eab308',
  overdue_31_60: '#f97316',
  overdue_61_90: '#ef4444',
  overdue_90_plus: '#991b1b',
} as const;

/** Notification channel identity — used in chart, legend, and table badges. */
export const CHANNEL_COLORS = {
  sms: '#3b82f6',
  email: '#8b5cf6',
} as const;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
  });
}

/** Down = improving for DSO (fewer days is better), so the arrow is inverted on purpose. */
export function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') {
    return <PiTrendDownBold className="h-4 w-4 text-green-600" aria-hidden="true" />;
  }
  if (trend === 'worsening') {
    return <PiTrendUpBold className="h-4 w-4 text-red-600" aria-hidden="true" />;
  }
  return <PiMinusBold className="h-4 w-4 text-slate-400" aria-hidden="true" />;
}

export interface AgingBucket {
  name: string;
  amount: number;
  count: number;
  fill: string;
}

export function buildAgingBuckets(aging: ARAnalyticsData['ar_aging']): AgingBucket[] {
  return [
    { name: 'Current', amount: aging.current_amount, count: aging.current_count, fill: AGING_COLORS.current },
    { name: '1-30 Days', amount: aging.overdue_1_30_amount, count: aging.overdue_1_30_count, fill: AGING_COLORS.overdue_1_30 },
    { name: '31-60 Days', amount: aging.overdue_31_60_amount, count: aging.overdue_31_60_count, fill: AGING_COLORS.overdue_31_60 },
    { name: '61-90 Days', amount: aging.overdue_61_90_amount, count: aging.overdue_61_90_count, fill: AGING_COLORS.overdue_61_90 },
    { name: '90+ Days', amount: aging.overdue_90_plus_amount, count: aging.overdue_90_plus_count, fill: AGING_COLORS.overdue_90_plus },
  ];
}
```

- [ ] **Step 2: Create the four panel files by moving markup verbatim**

For each panel, create the file with this skeleton and paste the **exact current JSX** from the matching `<TabsContent>` body in `page.tsx` — inner content only, without the `<TabsContent>` wrapper. Replace local references: `formatCurrency` → imported, `formatDate` → `formatShortDate`, `getTrendIcon(x)` → `<TrendIcon trend={x} />`, `agingChartData` → `buildAgingBuckets(data.ar_aging)`, `COLORS.sms` → `CHANNEL_COLORS.sms`, `COLORS.email` → `CHANNEL_COLORS.email`.

Source ranges in the current `page.tsx`:

| Panel | `<TabsContent>` | Body lines |
|---|---|---|
| `ArAgingPanel` | `value="aging"` | 358–431 |
| `DsoMetricsPanel` | `value="dso"` | 436–502 |
| `NotificationsPanel` | `value="notifications"` | 507–631 |
| `HistoryPanel` | `value="history"` | 636–720 |

Skeleton (shown for `ArAgingPanel`; the other three follow the same shape with their own imports):

```tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildAgingBuckets, formatCurrency, type ARAnalyticsData } from './shared';

export function ArAgingPanel({ data }: { data: ARAnalyticsData }) {
  const agingChartData = buildAgingBuckets(data.ar_aging);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* paste lines 359-430 verbatim here */}
    </div>
  );
}
```

Each panel keeps the outer wrapper that its `<TabsContent>` currently has. `HistoryPanel` must keep its `data.historical && data.historical.length > 0` conditional and the no-data `<Card>` branch.

- [ ] **Step 3: Create a barrel for the panels**

`components/admin/finance/ar/index.ts`:

```ts
export { ArAgingPanel } from './ArAgingPanel';
export { DsoMetricsPanel } from './DsoMetricsPanel';
export { NotificationsPanel } from './NotificationsPanel';
export { HistoryPanel } from './HistoryPanel';
export {
  AGING_COLORS,
  CHANNEL_COLORS,
  buildAgingBuckets,
  formatCurrency,
  formatShortDate,
  TrendIcon,
} from './shared';
export type { ARAnalyticsData, AgingBucket } from './shared';
```

The barrel matches the convention of `components/admin/network/performance/index.ts` and keeps `page.tsx`'s import to one line. It is the 17th changed file — see the count reconciliation under File Structure.

- [ ] **Step 4: Rewrite `page.tsx` to fetch + header + tabs wiring only**

Delete the moved `ARAnalyticsData` interface, `COLORS`, `formatCurrency`, `formatDate`, `getTrendIcon`, `agingChartData`, `notificationPieData`, all recharts imports, and all four `<TabsContent>` bodies. Keep the KPI card grid inline for now — Task 8 restyles it.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { PiArrowsClockwiseBold, PiClockBold, PiCurrencyDollarBold, PiPulseBold, PiTargetBold } from 'react-icons/pi';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPage, PageHeader, LoadingState, ErrorState } from '@/components/backend';
import {
  ArAgingPanel,
  DsoMetricsPanel,
  HistoryPanel,
  NotificationsPanel,
  TrendIcon,
  formatCurrency,
  type ARAnalyticsData,
} from '@/components/admin/finance/ar';

export default function ARAnalyticsPage() {
  const [data, setData] = useState<ARAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/finance/ar-analytics?days=${period}&history=true`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch AR analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading AR analytics..." />
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage>
        <ErrorState title="Failed to load AR analytics" onRetry={handleRefresh} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="AR Analytics & Collections"
        subtitle="Accounts Receivable, DSO tracking, and notification effectiveness"
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
              <PiArrowsClockwiseBold className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* KPI cards — restyled in Task 8. Paste the current lines 272-345 grid here verbatim. */}

      <Tabs defaultValue="aging" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aging">AR Aging</TabsTrigger>
          <TabsTrigger value="dso">DSO &amp; Metrics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="aging" className="space-y-4">
          <ArAgingPanel data={data} />
        </TabsContent>
        <TabsContent value="dso" className="space-y-4">
          <DsoMetricsPanel data={data} />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <NotificationsPanel data={data} />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <HistoryPanel data={data} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
```

- [ ] **Step 5: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep -E "finance/ar|ar-analytics" || echo "NO ERRORS in AR page or panels"
```

Expected: `NO ERRORS in AR page or panels`. Unused-import errors here mean you left an import behind after moving markup out.

- [ ] **Step 6: Confirm this was a pure move — no class changes**

```bash
git diff --stat
git diff app/admin/finance/ar-analytics/page.tsx | grep -cE "^\+.*(slate-|rounded-xl|MetricCard|ConsoleTabs)" \
  && echo "WARNING: restyle leaked into the move task — revert those" \
  || echo "PURE MOVE — good"
```

Expected: `PURE MOVE — good`.

- [ ] **Step 7: Visually confirm the page still works before restyling**

```bash
ALLOW_DEV_ADMIN_BYPASS=true npm run dev:memory
```

Open `http://localhost:3000/admin/finance/ar-analytics`, click all four tabs. Every chart, table, and number must render exactly as before. Stop the server when done.

- [ ] **Step 8: Commit**

```bash
git add components/admin/finance/ar app/admin/finance/ar-analytics/page.tsx
git commit -m "refactor(ar-analytics): extract 4 tab panels, no visual change

Pure move ahead of the restyle so move bugs and style bugs stay separable.
Shared types, aging/channel colours, and formatters go to ar/shared.tsx."
```

---

## Task 7: AR page header, tabs, and chrome

**Files:**
- Modify: `app/admin/finance/ar-analytics/page.tsx`

**Interfaces:**
- Consumes: the four panels from Task 6.
- Produces: nothing.

- [ ] **Step 1: Swap `PageHeader` and raw tabs for the network header and kit pill tabs**

Change the `@/components/backend` import to bring in the kit tabs and drop `PageHeader`:

```tsx
import { Badge } from '@/components/ui/badge';
import {
  AdminPage,
  LoadingState,
  ErrorState,
  Tabs,
  ConsoleTabsList,
  ConsoleTabsContent,
} from '@/components/backend';
```

Remove `Tabs, TabsContent, TabsList, TabsTrigger` from the `@/components/ui/tabs` import (delete the line entirely — `Tabs` now comes from the kit).

- [ ] **Step 2: Replace `<PageHeader …/>` with the network header**

```tsx
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Finance / Receivables / AR Analytics</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            AR Analytics &amp; Collections
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Accounts Receivable, DSO tracking, and notification effectiveness
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] rounded-lg border-slate-200" aria-label="Reporting period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
```

The icon-only refresh button becomes a labelled `size="sm"` button to match the network action rows.

- [ ] **Step 3: Add the meta strip below the header**

```tsx
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
          Supabase AR snapshot
        </Badge>
        <span className="text-xs text-slate-400">Last {period} days</span>
        <span className="text-xs text-slate-500">
          {data.ar_aging.total_outstanding_invoices} open invoices ·{' '}
          {formatCurrency(data.ar_aging.total_outstanding_amount)} outstanding
        </span>
      </div>
```

- [ ] **Step 4: Replace the tabs block with kit pill tabs**

```tsx
      <Tabs defaultValue="aging" className="space-y-4">
        <ConsoleTabsList
          items={[
            { value: 'aging', label: 'AR Aging' },
            { value: 'dso', label: 'DSO & Metrics' },
            { value: 'notifications', label: 'Notifications' },
            { value: 'history', label: 'History' },
          ]}
        />
        <ConsoleTabsContent value="aging">
          <ArAgingPanel data={data} />
        </ConsoleTabsContent>
        <ConsoleTabsContent value="dso">
          <DsoMetricsPanel data={data} />
        </ConsoleTabsContent>
        <ConsoleTabsContent value="notifications">
          <NotificationsPanel data={data} />
        </ConsoleTabsContent>
        <ConsoleTabsContent value="history">
          <HistoryPanel data={data} />
        </ConsoleTabsContent>
      </Tabs>
```

`ConsoleTabsList` styles a 4-item list as `grid-cols-2 sm:grid-cols-4`, and `ConsoleTabsContent` already applies `mt-6` — so drop the per-content `className="space-y-4"`.

- [ ] **Step 5: Add the footer meta line as the last child of `<AdminPage>`**

```tsx
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <PiClockBold className="w-4 h-4" aria-hidden="true" />
          {refreshing ? 'Refreshing…' : `AR snapshot · last ${period} days`}
        </span>
      </div>
```

- [ ] **Step 6: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "ar-analytics/page.tsx" || echo "NO ERRORS in AR page"
```

Expected: `NO ERRORS in AR page`.

- [ ] **Step 7: Commit**

```bash
git add app/admin/finance/ar-analytics/page.tsx
git commit -m "style(ar-analytics): network console header, pill tabs, meta strip"
```

---

## Task 8: AR KPI cards onto MetricCard

**Files:**
- Modify: `app/admin/finance/ar-analytics/page.tsx`

**Interfaces:**
- Consumes: `MetricCard` from `@/components/backend` (Task 1); `TrendIcon`, `formatCurrency` from the AR barrel (Task 6).
- Produces: nothing.

- [ ] **Step 1: Add `MetricCard` to the kit import and drop the now-unused card imports**

Add `MetricCard` to the `@/components/backend` import. Delete the `@/components/ui/card` import line entirely — after this step the page no longer renders a raw `Card`.

- [ ] **Step 2: Replace the whole four-card KPI grid**

These four cards currently use `text-primary` and `text-muted-foreground`, which resolve through the global `:root` oklch variables. Moving to literal slate classes also removes that dependency.

```tsx
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Outstanding"
          value={formatCurrency(data.ar_aging.total_outstanding_amount)}
          subtitle={`${data.ar_aging.total_outstanding_invoices} invoices`}
        >
          <PiCurrencyDollarBold className="w-5 h-5 text-amber-600" aria-hidden="true" />
        </MetricCard>

        <MetricCard
          title="Days Sales Outstanding"
          value={data.dso.dso_current.toFixed(1)}
          subtitle={`30-day avg: ${data.dso.dso_30_day_avg.toFixed(1)} days`}
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <TrendIcon trend={data.dso.dso_trend} />
            <span className="capitalize">{data.dso.dso_trend}</span>
          </span>
        </MetricCard>

        <MetricCard
          title="Collection Rate"
          value={`${data.collection.collection_rate.toFixed(1)}%`}
          subtitle={`${formatCurrency(data.collection.total_amount_collected)} collected`}
        >
          <PiTargetBold className="w-5 h-5 text-emerald-600" aria-hidden="true" />
        </MetricCard>

        <MetricCard
          title="Notifications Sent"
          value={`${data.notifications.total_sms + data.notifications.total_email}`}
          subtitle={`${data.notifications.delivery_rate.toFixed(1)}% delivery rate`}
        >
          <PiPulseBold className="w-5 h-5 text-blue-600" aria-hidden="true" />
        </MetricCard>
      </div>
```

The DSO trend arrow moves from beside the value into the `children` slot, where `MetricCard` renders it below — the trend keeps its green/red meaning via `TrendIcon`.

- [ ] **Step 3: Verify no new type errors and no leftover raw Card usage**

```bash
npm run type-check:memory 2>&1 | grep "ar-analytics/page.tsx" || echo "NO ERRORS in AR page"
grep -n "components/ui/card" app/admin/finance/ar-analytics/page.tsx || echo "no raw Card import — good"
```

Expected: `NO ERRORS in AR page` and `no raw Card import — good`.

- [ ] **Step 4: Commit**

```bash
git add app/admin/finance/ar-analytics/page.tsx
git commit -m "style(ar-analytics): KPI cards onto MetricCard, drop theme-token colours"
```

---

## Task 9: ArAgingPanel — chart chrome and table

**Files:**
- Modify: `components/admin/finance/ar/ArAgingPanel.tsx`

**Interfaces:**
- Consumes: `buildAgingBuckets`, `formatCurrency`, `ARAnalyticsData` from `./shared`.
- Produces: nothing.

- [ ] **Step 1: Replace the file entirely**

```tsx
'use client';

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { buildAgingBuckets, formatCurrency, type ARAnalyticsData } from './shared';

const chartConfig = {
  amount: { label: 'Outstanding' },
} satisfies ChartConfig;

export function ArAgingPanel({ data }: { data: ARAnalyticsData }) {
  const buckets = buildAgingBuckets(data.ar_aging);
  const total = data.ar_aging.total_outstanding_amount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            AR Aging Breakdown
          </CardTitle>
          <p className="text-xs text-slate-500">Outstanding amounts by aging bucket</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart accessibilityLayer data={buckets} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(v) => `R${(Number(v) / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {buckets.map((bucket) => (
                  <Cell key={bucket.name} fill={bucket.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">Aging Summary</CardTitle>
          <p className="text-xs text-slate-500">Invoice counts and amounts by bucket</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Bucket
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoices
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buckets.map((bucket) => (
                  <tr key={bucket.name} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: bucket.fill }}
                        />
                        <span className="text-slate-700">{bucket.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {bucket.count}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(bucket.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                      {total > 0 ? ((bucket.amount / total) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">Total</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    {data.ar_aging.total_outstanding_invoices}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    {formatCurrency(total)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

The `shadcn` `Table` primitive is replaced with the same raw `<table>` markup `ExceptionTable` and `DeviceTable` use — that is what produces the network table look. The `0` in the percent cell became `'0.0'` so the column stays aligned when a bucket is empty.

- [ ] **Step 2: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "ArAgingPanel" || echo "NO ERRORS in ArAgingPanel"
```

Expected: `NO ERRORS in ArAgingPanel`.

- [ ] **Step 3: Confirm the semantic colours survived**

```bash
grep -c "bucket.fill" components/admin/finance/ar/ArAgingPanel.tsx
grep -n "chart-1\|chart-2\|chart-3" components/admin/finance/ar/ArAgingPanel.tsx || echo "no chart-palette leak — good"
```

Expected: `2` (chart `Cell` + table dot) and `no chart-palette leak — good`.

- [ ] **Step 4: Commit**

```bash
git add components/admin/finance/ar/ArAgingPanel.tsx
git commit -m "style(ar-analytics): aging chart + table onto network chrome

Keeps the green-to-dark-red bucket ramp; only grid, axes, tooltip, and
table treatment change."
```

---

## Task 10: DsoMetricsPanel

**Files:**
- Modify: `components/admin/finance/ar/DsoMetricsPanel.tsx`

**Interfaces:**
- Consumes: `formatCurrency`, `TrendIcon`, `ARAnalyticsData` from `./shared`; `MetricCard` from `@/components/backend`.
- Produces: nothing.

- [ ] **Step 1: Replace the file entirely**

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/backend';
import { TrendIcon, formatCurrency, type ARAnalyticsData } from './shared';

export function DsoMetricsPanel({ data }: { data: ARAnalyticsData }) {
  const gap = data.dso.dso_current - data.dso.best_possible_dso;

  const performance = [
    { label: 'Notifications sent', value: `${data.collection.total_notifications_sent}` },
    { label: 'Amount collected', value: formatCurrency(data.collection.total_amount_collected) },
    { label: 'Avg days to payment', value: data.collection.avg_days_to_payment.toFixed(1) },
    { label: 'Response rate', value: `${data.collection.response_rate.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Current DSO"
          value={data.dso.dso_current.toFixed(1)}
          subtitle="days"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <TrendIcon trend={data.dso.dso_trend} />
            <span className="capitalize">{data.dso.dso_trend}</span>
          </span>
        </MetricCard>

        <MetricCard
          title="Best Possible DSO"
          value={data.dso.best_possible_dso.toFixed(1)}
          subtitle="days"
          delta={`Gap: ${gap.toFixed(1)} days`}
          deltaPositive={gap <= 0}
        />

        <MetricCard
          title="Collection Effectiveness"
          value={`${data.dso.collection_effectiveness_index.toFixed(1)}%`}
          subtitle="CEI"
          delta="Target: 80%+"
          deltaPositive={data.dso.collection_effectiveness_index >= 80}
        />
      </div>

      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Collection Performance
          </CardTitle>
          <p className="text-xs text-slate-500">Notification volume and payment response</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {performance.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-semibold tabular-nums text-slate-900 mt-1">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

The `text-4xl font-bold` DSO numbers become `MetricCard`'s `text-3xl font-semibold`. `deltaPositive` drives blue (good) vs amber (attention) via `MetricCard`'s existing logic — note it is deliberately *not* green/red, because these are targets rather than states.

- [ ] **Step 2: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "DsoMetricsPanel" || echo "NO ERRORS in DsoMetricsPanel"
```

Expected: `NO ERRORS in DsoMetricsPanel`.

- [ ] **Step 3: Commit**

```bash
git add components/admin/finance/ar/DsoMetricsPanel.tsx
git commit -m "style(ar-analytics): DSO panel onto MetricCard + slate tiles"
```

---

## Task 11: NotificationsPanel

**Files:**
- Modify: `components/admin/finance/ar/NotificationsPanel.tsx`

**Interfaces:**
- Consumes: `CHANNEL_COLORS`, `formatCurrency`, `ARAnalyticsData` from `./shared`; `StatusBadge`, `StatusVariant` from `@/components/backend`.
- Produces: nothing.

- [ ] **Step 1: Replace the file entirely**

```tsx
'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { PiCalendarBold, PiChatBold, PiCheckCircleBold, PiEnvelopeBold, PiPulseBold, PiXCircleBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { StatusBadge, type StatusVariant } from '@/components/backend';
import { CHANNEL_COLORS, formatCurrency, type ARAnalyticsData } from './shared';

const chartConfig = {
  value: { label: 'Sent' },
  SMS: { label: 'SMS', color: CHANNEL_COLORS.sms },
  Email: { label: 'Email', color: CHANNEL_COLORS.email },
} satisfies ChartConfig;

const NOTIF_STATUS_VARIANT: Record<string, StatusVariant> = {
  sent: 'success',
  delivered: 'success',
  failed: 'error',
  bounced: 'error',
  opened: 'info',
  clicked: 'info',
};

function notifStatusBadge(status: string) {
  const label =
    status === 'sent' || status === 'delivered'
      ? 'Delivered'
      : status.charAt(0).toUpperCase() + status.slice(1);
  return <StatusBadge status={label} variant={NOTIF_STATUS_VARIANT[status] ?? 'neutral'} />;
}

export function NotificationsPanel({ data }: { data: ARAnalyticsData }) {
  const channelData = [
    { name: 'SMS', value: data.notifications.total_sms, fill: CHANNEL_COLORS.sms },
    { name: 'Email', value: data.notifications.total_email, fill: CHANNEL_COLORS.email },
  ];

  const deliveryTiles = [
    {
      label: 'Delivered',
      value: `${data.notifications.total_delivered}`,
      icon: <PiCheckCircleBold className="h-5 w-5 text-emerald-600" aria-hidden="true" />,
    },
    {
      label: 'Failed',
      value: `${data.notifications.total_failed}`,
      icon: <PiXCircleBold className="h-5 w-5 text-red-600" aria-hidden="true" />,
    },
    {
      label: 'Delivery rate',
      value: `${data.notifications.delivery_rate.toFixed(1)}%`,
      icon: <PiPulseBold className="h-5 w-5 text-blue-600" aria-hidden="true" />,
    },
    {
      label: 'Avg days overdue',
      value: data.ar_aging.avg_days_overdue.toFixed(0),
      icon: <PiCalendarBold className="h-5 w-5 text-amber-600" aria-hidden="true" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Notification Channels
            </CardTitle>
            <p className="text-xs text-slate-500">Share of sends by channel</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} strokeWidth={2}>
                  {channelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 flex justify-center gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <PiChatBold className="h-4 w-4" style={{ color: CHANNEL_COLORS.sms }} aria-hidden="true" />
                SMS: <span className="tabular-nums font-medium text-slate-900">{data.notifications.total_sms}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-slate-600">
                <PiEnvelopeBold className="h-4 w-4" style={{ color: CHANNEL_COLORS.email }} aria-hidden="true" />
                Email: <span className="tabular-nums font-medium text-slate-900">{data.notifications.total_email}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-xl border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Delivery Statistics
            </CardTitle>
            <p className="text-xs text-slate-500">Outcome of sends in the selected window</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deliveryTiles.map(({ label, value, icon }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                {icon}
                <p className="text-xs text-slate-500 mt-2">{label}</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900 mt-0.5">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Recent Notifications
            </CardTitle>
            <p className="text-xs text-slate-500">Last 20 notifications sent</p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {data.recent_notifications.length} shown
          </span>
        </CardHeader>
        <CardContent>
          {data.recent_notifications.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-sm text-slate-400">
              No notifications sent yet
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['Invoice', 'Type', 'Recipient', 'Amount', 'Days overdue', 'Status', 'Sent'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                          i === 3 || i === 4 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent_notifications.map((notif) => (
                    <tr key={notif.id} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                        {notif.invoice_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                          {notif.notification_type === 'sms' ? (
                            <>
                              <PiChatBold className="h-3 w-3" style={{ color: CHANNEL_COLORS.sms }} aria-hidden="true" />
                              SMS
                            </>
                          ) : (
                            <>
                              <PiEnvelopeBold className="h-3 w-3" style={{ color: CHANNEL_COLORS.email }} aria-hidden="true" />
                              Email
                            </>
                          )}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-700">
                        {notif.recipient}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(notif.amount_due)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {notif.days_overdue}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">{notifStatusBadge(notif.status)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                        {new Date(notif.created_at).toLocaleString('en-ZA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

The four tinted tiles (`bg-green-50`, `bg-red-50`, `bg-blue-50`, `bg-purple-50` and their `dark:` variants) become slate tiles with the icon carrying the colour. The "Days Overdue" `days` suffix moved into the column header so the cell stays numeric and right-aligned.

- [ ] **Step 2: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "NotificationsPanel" || echo "NO ERRORS in NotificationsPanel"
```

Expected: `NO ERRORS in NotificationsPanel`.

- [ ] **Step 3: Confirm channel colours were not flattened**

```bash
grep -c "CHANNEL_COLORS" components/admin/finance/ar/NotificationsPanel.tsx
```

Expected: `8` or more (chart config ×2, chart data ×2, legend ×2, table badge ×2).

- [ ] **Step 4: Commit**

```bash
git add components/admin/finance/ar/NotificationsPanel.tsx
git commit -m "style(ar-analytics): notifications panel onto network chrome

Channel blue/purple preserved; tinted tiles become slate with coloured icons."
```

---

## Task 12: HistoryPanel

Two composed charts (`Area` + `Line`, and `Bar` + `Line`). Recharts requires `ComposedChart` for mixed marks — the current code nests `<Line>` inside `<AreaChart>`/`<BarChart>`, which Recharts tolerates inconsistently. Switching to `ComposedChart` is required for the mixed series to render reliably.

**Files:**
- Modify: `components/admin/finance/ar/HistoryPanel.tsx`

**Interfaces:**
- Consumes: `CHANNEL_COLORS`, `formatCurrency`, `formatShortDate`, `ARAnalyticsData` from `./shared`.
- Produces: nothing.

- [ ] **Step 1: Replace the file entirely**

```tsx
'use client';

import { Area, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { PiCalendarBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { CHANNEL_COLORS, formatCurrency, formatShortDate, type ARAnalyticsData } from './shared';

const trendConfig = {
  total_outstanding: { label: 'Outstanding', color: 'var(--chart-1)' },
  dso_current: { label: 'DSO', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const activityConfig = {
  sms_sent_count: { label: 'SMS', color: CHANNEL_COLORS.sms },
  email_sent_count: { label: 'Email', color: CHANNEL_COLORS.email },
  payments_received_amount: { label: 'Payments', color: '#22c55e' },
} satisfies ChartConfig;

export function HistoryPanel({ data }: { data: ARAnalyticsData }) {
  const history = data.historical;

  if (!history || history.length === 0) {
    return (
      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardContent className="py-12 text-center">
          <PiCalendarBold className="mx-auto mb-4 h-12 w-12 text-slate-300" aria-hidden="true" />
          <p className="text-slate-600">No historical data available yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Historical snapshots are created daily by the system
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">AR &amp; DSO Trend</CardTitle>
          <p className="text-xs text-slate-500">Historical outstanding amount and DSO</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="aspect-auto h-[300px] w-full">
            <ComposedChart accessibilityLayer data={history} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="snapshot_date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={formatShortDate}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(v) => `R${(Number(v) / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatShortDate(String(value))}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {trendConfig[name as keyof typeof trendConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {name === 'total_outstanding'
                            ? formatCurrency(Number(value))
                            : Number(value).toFixed(1)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillOutstanding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total_outstanding)" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="var(--color-total_outstanding)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <Area
                yAxisId="left"
                dataKey="total_outstanding"
                type="natural"
                fill="url(#fillOutstanding)"
                stroke="var(--color-total_outstanding)"
                strokeWidth={1.5}
              />
              <Line
                yAxisId="right"
                dataKey="dso_current"
                type="natural"
                stroke="var(--color-dso_current)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Notifications &amp; Collections
          </CardTitle>
          <p className="text-xs text-slate-500">
            Daily notification activity and payments received
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityConfig} className="aspect-auto h-[300px] w-full">
            <ComposedChart accessibilityLayer data={history} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="snapshot_date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={formatShortDate}
              />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} width={40} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(v) => `R${(Number(v) / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatShortDate(String(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="left" dataKey="sms_sent_count" fill="var(--color-sms_sent_count)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="email_sent_count" fill="var(--color-email_sent_count)" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                dataKey="payments_received_amount"
                type="natural"
                stroke="var(--color-payments_received_amount)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

The AR/DSO trend is the one chart that legitimately adopts the warm `--chart-*` palette: outstanding-over-time is a plain quantity with no severity meaning, so it should look like the network traffic charts. The hardcoded `#F5831F` it used before is replaced by `var(--chart-1)`.

- [ ] **Step 2: Verify no new type errors**

```bash
npm run type-check:memory 2>&1 | grep "HistoryPanel" || echo "NO ERRORS in HistoryPanel"
```

Expected: `NO ERRORS in HistoryPanel`.

- [ ] **Step 3: Commit**

```bash
git add components/admin/finance/ar/HistoryPanel.tsx
git commit -m "style(ar-analytics): history charts onto ComposedChart + network chrome

ComposedChart is required for the mixed Area+Line / Bar+Line series;
nesting Line inside AreaChart/BarChart renders inconsistently."
```

---

## Task 13: Full verification pass

**Files:** none modified unless a defect is found.

**Interfaces:**
- Consumes: everything from Tasks 1–12, and `.scratch/baseline-typecheck.txt` from Task 0.
- Produces: a green build and a visual sign-off.

- [ ] **Step 1: Confirm no new type errors against the Task 0 baseline**

```bash
npm run type-check:memory 2>&1 | tee .scratch/after-typecheck.txt | tail -3
echo "baseline: $(grep -c 'error TS' .scratch/baseline-typecheck.txt)"
echo "after:    $(grep -c 'error TS' .scratch/after-typecheck.txt)"
diff <(grep "error TS" .scratch/baseline-typecheck.txt | sort) \
     <(grep "error TS" .scratch/after-typecheck.txt | sort) \
  && echo "IDENTICAL ERROR SET — no regressions"
```

Expected: the after-count is `<=` baseline, and either `IDENTICAL ERROR SET` or a diff showing only **removed** lines (the AR page dropped theme-token usage, so some errors may disappear). **Any added `+` line is a regression — fix it before continuing.**

- [ ] **Step 2: Confirm the existing Jest suites are still green**

```bash
npx jest __tests__/lib/billing __tests__/lib/network \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/ 2>&1 | tail -8
```

Expected: same pass count as `.scratch/baseline-jest.txt`. These cover `filterExceptions` and the network aggregates, which this work must not have touched.

- [ ] **Step 3: Confirm no unintended files were changed**

```bash
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD | grep -E "^(app|components|lib)/" | sort
```

Expected exactly these 16 code paths, and nothing else — in particular **no `app/admin/network/*` and no `lib/*`**. (`docs/design/BACKEND_UI_KIT.md` is the 17th changed file but is filtered out by the `grep`.)

```
app/admin/billing/page.tsx
app/admin/finance/ar-analytics/page.tsx
components/admin/billing/recon/CashMatchStrip.tsx
components/admin/billing/recon/DayDoneBanner.tsx
components/admin/billing/recon/DeepLinks.tsx
components/admin/billing/recon/ExceptionTable.tsx
components/admin/billing/recon/SecondaryKpis.tsx
components/admin/finance/ar/ArAgingPanel.tsx
components/admin/finance/ar/DsoMetricsPanel.tsx
components/admin/finance/ar/HistoryPanel.tsx
components/admin/finance/ar/NotificationsPanel.tsx
components/admin/finance/ar/index.ts
components/admin/finance/ar/shared.tsx
components/admin/network/performance/MetricCard.tsx
components/backend/MetricCard.tsx
components/backend/index.ts
```

- [ ] **Step 4: Run the production build**

```bash
npm run build:memory 2>&1 | tail -30
```

Expected: `✓ Compiled successfully`, no errors on `/admin/billing` or `/admin/finance/ar-analytics`. Takes 10–18 minutes. Per `.claude/rules/vps-devops.md`, do not run this while another heavy CircleTel build is running on the VPS.

- [ ] **Step 5: Visual pass — the two restyled pages**

```bash
ALLOW_DEV_ADMIN_BYPASS=true npm run dev:memory
```

At **1440px** then **1280px**, check `http://localhost:3000/admin/billing`:

- [ ] Eyebrow `Finance / Billing / Cash Match` above a `text-2xl font-semibold` slate H1
- [ ] Action row is all `size="sm"`, one orange CTA
- [ ] Meta strip badge + window text below the header
- [ ] Four `MetricCard`s, `rounded-xl`, value `font-semibold`, icon **below** the value
- [ ] Day-done banner still green when clear / red when not
- [ ] Exceptions card is `rounded-xl` slate; filter chips still orange when active; table unchanged
- [ ] Footer meta line, right-aligned with clock icon
- [ ] No horizontal scrollbar on `<body>`

And `http://localhost:3000/admin/finance/ar-analytics`:

- [ ] Eyebrow `Finance / Receivables / AR Analytics`, same H1 treatment
- [ ] Four `MetricCard` KPIs; DSO trend arrow renders below the value
- [ ] Pill tabs (white active pill), all four switch correctly
- [ ] **AR Aging** — bars still green→dark-red, soft grid, no axis lines, tooltip shows ZAR
- [ ] **DSO & Metrics** — three `MetricCard`s + four slate tiles
- [ ] **Notifications** — donut still blue/purple, four slate tiles, table has slate uppercase headers
- [ ] **History** — both composed charts render *both* series (area **and** line; bars **and** line)
- [ ] No console errors, and no React key or unknown-prop warnings

- [ ] **Step 6: Visual regression check — the three network pages**

Task 1 proved the `MetricCard` render body is byte-identical, so this is a confirmation, not a discovery. With the dev server still running, load each and confirm the metric cards look unchanged:

- [ ] `http://localhost:3000/admin/network/analytics` — four metric cards with coloured arrow/lightning/database icons below the values
- [ ] `http://localhost:3000/admin/network/devices` — Online Devices / Telemetry Coverage cards with their `delta` lines
- [ ] `http://localhost:3000/admin/network/health` — three metric cards with their inline `DotMatrixChart` / `SegmentedBar` / `BandwidthChart` children

Stop the dev server.

- [ ] **Step 7: Clean up the scratch baselines**

```bash
rm -rf .scratch/baseline-typecheck.txt .scratch/baseline-jest.txt .scratch/after-typecheck.txt
git status --porcelain
```

Expected: empty output.

- [ ] **Step 8: Rebase onto latest main and push**

`/admin/billing` changed under this branch once already (PR #644 landed the recon hub mid-design), so re-check before opening the PR.

```bash
git fetch origin
git log --oneline origin/main -3
git rebase origin/main
npm run type-check:memory 2>&1 | grep -cE "error TS"
git push --force-with-lease
```

If the rebase conflicts in `app/admin/billing/page.tsx` or any `recon/` file, resolve in favour of **their** data/logic changes plus **your** styling, then re-run Steps 1–5 before pushing.

- [ ] **Step 9: Open the PR**

```bash
gh pr create --base main \
  --title "style(admin): billing + AR analytics onto network console look" \
  --body "$(cat <<'EOF'
## What

Restyles `/admin/billing` and `/admin/finance/ar-analytics` to match
`/admin/network/analytics` and `/admin/network/devices`.

Promotes `MetricCard` into `components/backend/` as the canonical metric card and
makes the network console the documented reference look in `BACKEND_UI_KIT.md`,
resolving a conflict where the doc named `/admin/billing` (gray `StatCard`) as the
reference while the network pages had moved to slate and bypassed the kit's card.

## Verification

- No new `tsc` errors vs. the pre-change baseline (repo carries ~295 pre-existing)
- `npm run build:memory` compiles
- `__tests__/lib/billing` + `__tests__/lib/network` green
- `MetricCard` render body byte-identical to the original — the three network
  pages (analytics, devices, health) cannot change; visually confirmed
- Both restyled pages checked at 1280px and 1440px, all four AR tabs

## Deliberately preserved

Colour that encodes data rather than decoration: AR aging buckets
(green→dark-red), SMS blue / Email purple, cash-match day-done green/red,
exception severity red/amber, all `StatusBadge` variants.

## Not included

No data, API, or logic changes. No other admin or consumer page changes
appearance. No dark mode (neither reference page implements it).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Plan Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| Unit 1 — Promote MetricCard (4 files) | Task 1 |
| Unit 2 — `/admin/billing` (6 files) | Tasks 2, 3, 4, 5 |
| Unit 3 — `/admin/finance/ar-analytics` | Tasks 6, 7, 8, 9, 10, 11, 12 |
| Colour that carries meaning | Global Constraints; verified in Tasks 9 Step 3, 11 Step 3 |
| Success criteria 1 (type-check) | Task 0 Step 3 baseline → Task 13 Step 1 diff |
| Success criteria 2 (build) | Task 13 Step 4 |
| Success criteria 3 (network unchanged) | Task 1 Steps 3–4, 8 (deterministic) + Task 13 Step 6 (visual) |
| Success criteria 4 (target pages) | Task 13 Step 5 |
| Success criteria 5 (all four AR tabs) | Task 6 Step 7, Task 13 Step 5 |
| Success criteria 6 (semantic colour) | Tasks 9/11 verification steps + Task 13 Step 5 |
| Success criteria 7 (no h-scroll) | Task 13 Step 5 |
| Success criteria 8 (no console errors) | Task 13 Step 5 |
| Risk: billing diverges mid-work | Task 13 Step 8 |

**Deviations from the spec, and why**

1. **File count 15 → 17** (16 code + 1 doc). Additions: `shared.tsx` (types, colours, formatters needed by all four panels — duplicating across four files would violate DRY) and `index.ts` (barrel, matching the `performance/index.ts` convention). Both are new files in the already-approved `components/admin/finance/ar/` directory. Reconciliation table under File Structure.
2. **Success criterion 3 verification method strengthened.** The spec called for screenshot-diffing the three network pages. Task 1 instead proves the `MetricCard` render body is byte-identical via `diff`, which is deterministic and cheaper; the visual check in Task 13 Step 6 is retained as confirmation. Screenshot diffing would also have needed image tooling the repo does not have.
3. **No component tests, and none written.** The spec assumed nothing here, but the plan states it explicitly: there is no working component-test infrastructure and a restyle adds no logic, so tests would be fake (Rule 11) and would need 4 new dev deps (Rule 12).
4. **`ComposedChart` in Task 12.** The current code nests `<Line>` inside `<AreaChart>`/`<BarChart>`; Recharts needs `ComposedChart` for mixed marks. This is a correctness fix inside a file already being rewritten, not scope creep — and without it the restyled history charts would silently drop a series.
5. **`CashMatchStrip` Zoho card wrapped in `Link` (Task 3 Step 4).** `StatCard` had an `href` prop; `MetricCard` does not. Wrapping preserves navigation that would otherwise be silently lost.

**Placeholder scan:** No `TBD`/`TODO`/"similar to Task N". Two steps intentionally reference exact source line ranges rather than restating ~200 lines of markup (Task 6 Step 2, Step 4's KPI-grid comment) — those are *pure moves* of existing code, immediately restyled with full code given in Tasks 8–12, and Task 6 Step 6 asserts the move introduced no class changes.

**Type consistency:** `MetricCardProps` fields match Task 1's declaration everywhere. `value` is `string` at every call site (`` `${n}` `` for numerics, `.toFixed(1)` for floats, `formatCurrency(...)` for money). `formatShortDate` is used consistently — the old name `formatDate` appears nowhere after Task 6. `TrendIcon` is a component (`<TrendIcon trend={…} />`), never the old `getTrendIcon(…)` call form. `buildAgingBuckets` returns `AgingBucket[]` with `fill`, consumed as `bucket.fill` in Task 9. `CHANNEL_COLORS`/`AGING_COLORS` replace the old flat `COLORS` object everywhere.
