# Admin Modernist Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every `/admin` page that already uses `@/components/backend` and common shadcn `Button` / `Input` / `Select` / `Table` pick up the Unjani onboarding tokens (Archivo, `--pm-*`, 40px 800 titles, 10px uppercase labels) without rewriting page files or changing customer `/dashboard`.

**Architecture:** Deepen the existing `.portal-root` overlay. `AdminModernistProvider` already mounts `--pm-*` + Archivo on authenticated admin. This plan adds the four missing CSS variables, expands `admin-kit.css`, and adds `data-pm` hooks on backend primitives. Backend JSX colour classes stay as the `/dashboard` look. No `app/admin/**/page.tsx` edits.

**Tech Stack:** Next.js 15, TypeScript, CSS custom properties, Jest 30 (`jest-environment-node`), Playwright `scripts/verify-admin-page.ts`.

**Spec:** `docs/superpowers/specs/2026-08-17-admin-modernist-tokens-design.md`

---

## Global Constraints

- **Working directory is the worktree:** `/home/circletel/.worktrees/admin-modernist-tokens` on branch `feat/admin-modernist-tokens`. Never edit `/home/circletel` except to create the worktree and copy the spec/plan in Task 0.
- **Presentation only.** No API, data, routing, or business-logic changes. If a restyle appears to need a data change, stop and report.
- **Admin only.** Every visual rule lives under `.portal-root`. Customer `/dashboard` shares `@/components/backend` and must keep slate classes.
- **Do not put `var(--pm-*)` in backend JSX colour classes.** Hooks are `data-pm` attributes and one additive `eyebrow?: string` prop.
- **Do not invent hex.** Tokens come from `portalModernist`. `admin-kit.css` may use `var(--pm-*)`, `#FFFFFF` / `#fff`, `transparent`, and `rgb(0 0 0 / 0.05)` / `rgb(0 0 0 / 0.06)` only.
- **Do not edit** `app/admin/**/page.tsx`, billing `--bm-*`, `PmButton`, `KpiStrip`, login/signup, or `components/ui/button.tsx`.
- **Preserve semantic colour:** `StatusBadge` hues, AR aging, cash-match green/red, WhatsApp `#25D366`, StatCard trend green/red.
- **No new packages.** This repo has no working React Testing Library / jsdom setup (`jest-environment-node`). Do not add one. Tests are Node file/token assertions.
- **Never `git commit --no-verify`.**
- **Jest in a worktree.** `jest.config.js` ignores `/.worktrees/`. Always run:

```bash
npx jest <paths> --modulePathIgnorePatterns=/node_modules/ --testPathIgnorePatterns=/node_modules/
```

### Verification model

1. **Jest token/CSS guard** (Tasks 1–4) — the only automated tests for this work.
2. **Type-check delta** — repo has pre-existing `tsc` errors. Capture a baseline in Task 0. Touched files must add **no new** errors.
3. **Visual** — `scripts/verify-admin-page.ts` on four admin URLs (Task 6). Page shell alone is not evidence; the script fails on `/api/admin/*` 401/403.
4. **Dashboard unchanged** — Task 6 opens `/dashboard` and checks titles are still `text-2xl font-semibold text-gray-900`.

---

## File map

| File | Responsibility |
|---|---|
| `components/portal/modernist/tokens.ts` | Hex source of truth. Add `muted`. |
| `components/portal/modernist/PortalModernistShell.tsx` | `PORTAL_MODERNIST_STYLE` — add `--pm-accent-hover`, `--pm-accent-active`, `--pm-muted`, `--pm-danger`; read values from `portalModernist`. |
| `components/admin/modernist/admin-kit.css` | Only admin restyle sheet. Expand under `.portal-root`. |
| `components/admin/modernist/__tests__/admin-kit-tokens.test.ts` | Token + CSS-scope + hook presence tests. |
| `components/backend/PageHeader.tsx` | Optional `eyebrow` + `data-pm="page-eyebrow"`. |
| `components/backend/DetailPageHeader.tsx` | `data-pm` on breadcrumb current/link. |
| `components/backend/InfoRow.tsx` | `data-pm="info-row"` / `info-label` / `info-value`. |
| `components/backend/StatCard.tsx` | `data-pm="stat-subtitle"` on subtitle nodes. |
| `components/backend/MetricCard.tsx` | `data-pm="metric-subtitle"` on subtitle. |
| `components/backend/states.tsx` | `data-pm` on the three states. |
| `components/backend/ConsoleTabs.tsx` | `data-pm="console-tabs"` on `TabsList`. |
| `components/admin/shared/UnderlineTabs.tsx` | `data-pm="underline-tabs"`. |
| `docs/design/BACKEND_UI_KIT.md` | Admin reference = Unjani `--pm-*`; dashboard stays slate. |

Do **not** create other files.

---

### Task 0: Worktree, copy spec, type-check baseline

**Files:**
- Create worktree: `/home/circletel/.worktrees/admin-modernist-tokens`
- Copy: `docs/superpowers/specs/2026-08-17-admin-modernist-tokens-design.md`
- Copy: `docs/superpowers/plans/2026-08-17-admin-modernist-tokens.md`

- [ ] **Step 1: Create the worktree from `origin/main`**

```bash
cd /home/circletel
git fetch origin
git worktree add -b feat/admin-modernist-tokens /home/circletel/.worktrees/admin-modernist-tokens origin/main
cp docs/superpowers/specs/2026-08-17-admin-modernist-tokens-design.md \
  /home/circletel/.worktrees/admin-modernist-tokens/docs/superpowers/specs/
cp docs/superpowers/plans/2026-08-17-admin-modernist-tokens.md \
  /home/circletel/.worktrees/admin-modernist-tokens/docs/superpowers/plans/
cd /home/circletel/.worktrees/admin-modernist-tokens
```

Expected: worktree exists, branch `feat/admin-modernist-tokens` tracks nothing yet, spec + plan are untracked.

- [ ] **Step 2: Commit the spec and plan so the branch has a starting point**

```bash
git add docs/superpowers/specs/2026-08-17-admin-modernist-tokens-design.md \
        docs/superpowers/plans/2026-08-17-admin-modernist-tokens.md
git commit -m "docs: admin modernist tokens spec and plan"
```

- [ ] **Step 3: Capture the type-check baseline**

```bash
npm run type-check:memory > /tmp/admin-tokens-tsc-baseline.txt 2>&1 || true
grep -c "error TS" /tmp/admin-tokens-tsc-baseline.txt || true
grep -E "components/(backend|portal/modernist|admin/modernist|admin/shared/UnderlineTabs)|docs/design/BACKEND_UI_KIT" /tmp/admin-tokens-tsc-baseline.txt || true
```

Expected: some pre-existing repo errors. The files this plan touches should contribute **none**. Save the count. Every later type-check compares against this file.

- [ ] **Step 4: Push the branch**

```bash
git push -u origin HEAD
```

---

### Task 1: Token source of truth

**Files:**
- Create: `components/admin/modernist/__tests__/admin-kit-tokens.test.ts`
- Modify: `components/portal/modernist/tokens.ts`
- Modify: `components/portal/modernist/PortalModernistShell.tsx` (the `PORTAL_MODERNIST_STYLE` object only)

- [ ] **Step 1: Write the failing token test**

Create `components/admin/modernist/__tests__/admin-kit-tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { portalModernist } from '@/components/portal/modernist/tokens';

const ROOT = resolve(__dirname, '../../../..');

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

describe('portalModernist tokens', () => {
  it('exposes muted and the existing hover/active/danger hexes', () => {
    expect(portalModernist.muted).toBe('#6B7280');
    expect(portalModernist.accentPressed).toBe('#E97B26');
    expect(portalModernist.accentDeep).toBe('#D76026');
    expect(portalModernist.danger).toBe('#DC2626');
  });
});

describe('PORTAL_MODERNIST_STYLE', () => {
  it('mounts the four admin-kit vars from portalModernist', () => {
    const src = read('components/portal/modernist/PortalModernistShell.tsx');
    expect(src).toMatch(/--pm-accent-hover/);
    expect(src).toMatch(/--pm-accent-active/);
    expect(src).toMatch(/--pm-muted/);
    expect(src).toMatch(/--pm-danger/);
    expect(src).toMatch(/from ['\"]\.\/tokens['\"]/);
    expect(src).toMatch(/portalModernist\.accentPressed/);
    expect(src).toMatch(/portalModernist\.accentDeep/);
    expect(src).toMatch(/portalModernist\.muted/);
    expect(src).toMatch(/portalModernist\.danger/);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: FAIL — `portalModernist.muted` is undefined; `PortalModernistShell.tsx` has no `--pm-accent-hover`.

- [ ] **Step 3: Add `muted` to `tokens.ts`**

Replace the object in `components/portal/modernist/tokens.ts` with:

```ts
/** Portal modernist ruled-ledger tokens (CircleTel navy/orange). */
export const portalModernist = {
  navy: '#13274A',
  body: '#1F2937',
  accent: '#F5841E',
  accentPressed: '#E97B26',
  accentDeep: '#D76026',
  divider: 'color-mix(in srgb, #13274A 28%, transparent)',
  pageGround: 'color-mix(in srgb, #13274A 7%, #FFFFFF)',
  surface: 'color-mix(in srgb, #13274A 6%, #FFFFFF)',
  muted: '#6B7280',
  danger: '#DC2626',
} as const;
```

- [ ] **Step 4: Wire `PORTAL_MODERNIST_STYLE` to `portalModernist`**

In `components/portal/modernist/PortalModernistShell.tsx`, add the import next to the other imports:

```ts
import { portalModernist } from './tokens';
```

Replace the `PORTAL_MODERNIST_STYLE` object (lines 9–17) with:

```ts
export const PORTAL_MODERNIST_STYLE: CSSProperties = {
  ['--pm-navy' as string]: portalModernist.navy,
  ['--pm-body' as string]: portalModernist.body,
  ['--pm-accent' as string]: portalModernist.accent,
  ['--pm-accent-hover' as string]: portalModernist.accentPressed,
  ['--pm-accent-active' as string]: portalModernist.accentDeep,
  ['--pm-divider' as string]: portalModernist.divider,
  ['--pm-ground' as string]: portalModernist.pageGround,
  ['--pm-surface' as string]: portalModernist.surface,
  ['--pm-muted' as string]: portalModernist.muted,
  ['--pm-danger' as string]: portalModernist.danger,
  fontFamily: 'var(--font-archivo, ui-sans-serif, system-ui, sans-serif)',
};
```

Do not change any other export in that file.

- [ ] **Step 5: Re-run the test**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/portal/modernist/tokens.ts \
        components/portal/modernist/PortalModernistShell.tsx \
        components/admin/modernist/__tests__/admin-kit-tokens.test.ts
git commit -m "feat(admin): mount remaining --pm token vars"
```

---

### Task 2: CSS guard + expand `admin-kit.css`

**Files:**
- Modify: `components/admin/modernist/__tests__/admin-kit-tokens.test.ts`
- Modify: `components/admin/modernist/admin-kit.css`

- [ ] **Step 1: Add the failing CSS-guard assertions to the existing test file**

Append:

```ts
const ALLOWED_HEX = new Set(['#fff', '#FFF', '#ffffff', '#FFFFFF']);

function cssSelectors(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutAt = withoutComments.replace(/@[^{]+\{/g, '');
  return withoutAt
    .split('}')
    .map((chunk) => chunk.split('{')[0].trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'));
}

describe('admin-kit.css', () => {
  const css = read('components/admin/modernist/admin-kit.css');

  it('scopes every selector under .portal-root', () => {
    for (const selector of cssSelectors(css)) {
      for (const part of selector.split(',')) {
        expect(part).toMatch(/\.portal-root/);
      }
    }
  });

  it('does not invent hex or circleTel values', () => {
    const hexes = css.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    for (const hex of hexes) {
      expect(ALLOWED_HEX.has(hex)).toBe(true);
    }
    const decls = css.match(/:[^;{}]+/g) ?? [];
    for (const decl of decls) {
      expect(decl).not.toMatch(/circleTel/);
    }
  });

  it('covers the spec hooks and shadcn class targets', () => {
    const required = [
      "[data-pm='page-eyebrow']",
      "[data-pm='info-row']",
      "[data-pm='info-label']",
      "[data-pm='info-value']",
      "[data-pm='stat-subtitle']",
      "[data-pm='metric-subtitle']",
      "[data-pm='breadcrumb-current']",
      "[data-pm='breadcrumb-link']",
      "[data-pm='console-tabs']",
      "[data-pm='underline-tabs']",
      "[data-pm='loading-state']",
      "[data-pm='empty-state']",
      "[data-pm='error-state']",
      "[role='combobox']",
      '.bg-primary',
      '.bg-circleTel-orange',
      '.bg-gradient-cta',
      '.border-input',
      '.bg-secondary',
      '.underline-offset-4',
      '.border-circleTel-orange',
      "input:not([type='checkbox'])",
    ];
    for (const needle of required) {
      expect(css).toContain(needle);
    }
  });
});
```

- [ ] **Step 2: Run the test and confirm the hook assertion fails**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: first two `admin-kit.css` cases PASS (current sheet is already scoped). Third case FAIL — `page-eyebrow` is missing.

- [ ] **Step 3: Replace `admin-kit.css` with the full sheet**

Overwrite `components/admin/modernist/admin-kit.css` with exactly this file:

```css
/**
 * Admin kit restyle under `.portal-root`.
 *
 * AdminLayoutClient mounts Unjani/portal tokens (`--pm-*`, Archivo) on the
 * authenticated /admin chrome. These rules only fire inside `.portal-root`, so
 * consumer `/dashboard` pages that share `@/components/backend` stay on slate.
 *
 * Do not set heading size on bare `h1` — AdminHeader uses a compact h1.
 * Page titles opt in with [data-pm="page-header"] / [data-pm="detail-header"].
 */

.portal-root [data-pm='page-header'] {
  border-bottom: 2px solid var(--pm-divider);
  padding-bottom: 1.5rem;
  margin-bottom: 0;
  align-items: flex-end;
}

.portal-root [data-pm='page-header'] h1,
.portal-root [data-pm='detail-header'] h1 {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.15;
  color: var(--pm-navy);
}

@media (min-width: 640px) {
  .portal-root [data-pm='page-header'] h1,
  .portal-root [data-pm='detail-header'] h1 {
    font-size: 40px;
  }
}

.portal-root [data-pm='page-header'] p,
.portal-root [data-pm='detail-header'] p {
  color: var(--pm-body);
}

.portal-root [data-pm='page-eyebrow'] {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--pm-navy);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portal-root [data-pm='breadcrumb-current'] {
  color: var(--pm-navy);
}

.portal-root [data-pm='breadcrumb-link'] {
  color: var(--pm-accent-active);
}

.portal-root [data-pm='section-card'] {
  border-color: var(--pm-divider);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
}

.portal-root [data-pm='section-card'] > div:first-child {
  border-bottom-color: var(--pm-divider);
}

.portal-root [data-pm='section-card'] h3 {
  color: var(--pm-navy);
  font-weight: 800;
}

.portal-root [data-pm='section-card'] svg {
  color: var(--pm-navy);
}

.portal-root [data-pm='stat-card'],
.portal-root [data-pm='metric-card'] {
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
}

.portal-root [data-pm='stat-card'] {
  border-color: transparent;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  outline: 1px solid rgb(0 0 0 / 0.06);
}

.portal-root [data-pm='stat-card'].ring-2 {
  outline: 2px solid var(--pm-accent);
  border-color: var(--pm-accent);
}

.portal-root [data-pm='metric-card'] [data-pm='metric-label'],
.portal-root [data-pm='stat-label'] {
  color: var(--pm-navy) !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portal-root [data-pm='stat-value'],
.portal-root [data-pm='metric-value'] {
  color: var(--pm-navy) !important;
  font-weight: 800 !important;
}

.portal-root [data-pm='stat-subtitle'],
.portal-root [data-pm='metric-subtitle'] {
  color: var(--pm-muted);
}

.portal-root [data-pm='info-row'] {
  border-bottom-color: var(--pm-divider);
}

.portal-root [data-pm='info-label'] {
  color: var(--pm-muted);
}

.portal-root [data-pm='info-value'] {
  color: var(--pm-navy);
}

.portal-root main table thead th {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--pm-navy);
}

.portal-root main table thead tr {
  border-bottom: 2px solid var(--pm-divider);
}

.portal-root main table tbody td {
  border-bottom: 1px solid var(--pm-divider);
}

.portal-root main table tbody tr:hover {
  background: var(--pm-surface);
}

.portal-root main :is(button, a).bg-primary,
.portal-root main :is(button, a).bg-circleTel-orange,
.portal-root main :is(button, a).bg-gradient-cta {
  background: var(--pm-accent);
  color: var(--pm-navy);
  font-weight: 800;
  border-radius: 0.5rem;
  min-height: 2.75rem;
}

.portal-root main :is(button, a).bg-primary:hover,
.portal-root main :is(button, a).bg-circleTel-orange:hover,
.portal-root main :is(button, a).bg-gradient-cta:hover {
  background: var(--pm-accent-hover);
}

.portal-root main :is(button, a).bg-primary:active,
.portal-root main :is(button, a).bg-circleTel-orange:active,
.portal-root main :is(button, a).bg-gradient-cta:active {
  background: var(--pm-accent-active);
}

.portal-root main :is(button, a).border-input:not([role='combobox']),
.portal-root main :is(button, a).border-circleTel-orange {
  background: #FFFFFF;
  color: var(--pm-navy);
  border-color: var(--pm-divider);
  font-weight: 800;
  border-radius: 0.5rem;
}

.portal-root main :is(button, a).border-input:not([role='combobox']):hover,
.portal-root main :is(button, a).border-circleTel-orange:hover,
.portal-root main :is(button, a).bg-secondary:hover {
  background: var(--pm-surface);
}

.portal-root main :is(button, a).bg-secondary {
  background: #FFFFFF;
  color: var(--pm-navy);
  border: 1px solid var(--pm-divider);
  font-weight: 800;
  border-radius: 0.5rem;
}

.portal-root main :is(button, a).hover\:bg-accent:not(.border-input):not(.bg-primary) {
  color: var(--pm-accent-active);
}

.portal-root main :is(button, a).hover\:bg-accent:not(.border-input):not(.bg-primary):hover {
  background: color-mix(in srgb, var(--pm-accent) 10%, transparent);
}

.portal-root main :is(button, a).underline-offset-4 {
  color: var(--pm-accent-active);
}

.portal-root main input:not([type='checkbox']):not([type='radio']):not([type='hidden']),
.portal-root main textarea,
.portal-root main [role='combobox'] {
  background: var(--pm-surface);
  border-color: var(--pm-divider);
  color: var(--pm-body);
  caret-color: var(--pm-accent);
}

.portal-root main input:not([type='checkbox']):not([type='radio']):not([type='hidden']):focus-visible,
.portal-root main textarea:focus-visible,
.portal-root main [role='combobox']:focus-visible {
  outline: 2px solid var(--pm-accent);
  outline-offset: 2px;
  border-color: var(--pm-accent);
}

.portal-root [data-pm='console-tabs'] {
  background: var(--pm-surface);
  border-color: var(--pm-divider);
}

.portal-root [data-pm='console-tabs'] [data-state='inactive'] {
  color: var(--pm-navy);
}

.portal-root [data-pm='console-tabs'] [data-state='active'] {
  background: var(--pm-navy) !important;
  color: #FFFFFF !important;
  border-color: var(--pm-navy) !important;
  box-shadow: none;
}

.portal-root [data-pm='underline-tabs'] {
  border-bottom-color: var(--pm-divider);
}

.portal-root [data-pm='underline-tabs'] [role='tab'][aria-selected='true'] {
  color: var(--pm-navy);
  border-bottom-color: var(--pm-navy);
  font-weight: 800;
}

.portal-root [data-pm='underline-tabs'] [role='tab'][aria-selected='false'] {
  color: var(--pm-muted);
}

.portal-root [data-pm='loading-state'] svg {
  color: var(--pm-accent);
}

.portal-root [data-pm='empty-title'] {
  color: var(--pm-navy);
}

.portal-root [data-pm='empty-copy'] {
  color: var(--pm-muted);
}

.portal-root [data-pm='error-icon'] {
  color: var(--pm-danger);
}

.portal-root [data-pm='error-title'] {
  color: var(--pm-navy);
}

.portal-root [data-pm='admin-header'] {
  border-bottom: 2px solid var(--pm-divider);
}

.portal-root [data-pm='admin-header'] h1 {
  color: var(--pm-navy);
  font-weight: 800;
}

.portal-root [data-testid='sidebar'] {
  border-right: 2px solid var(--pm-divider);
}

.portal-root .pm-nav-item:hover {
  background: var(--pm-surface);
}

.portal-root .pm-nav-item[data-active='true']:hover {
  background: var(--pm-navy);
  color: #fff;
}
```

Note: the required-hook test looks for `[data-pm='empty-state']` and `[data-pm='error-state']` as attribute hooks on the markup (Task 3), and for those strings **in the CSS**. The CSS above styles `empty-title` / `error-icon` instead. **Also add these two no-op grouping selectors** so the test and the spec hook names stay aligned, immediately after the loading-state rule:

```css
.portal-root [data-pm='empty-state'],
.portal-root [data-pm='error-state'] {
  color: inherit;
}
```

- [ ] **Step 4: Re-run the test**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: PASS. If a selector-parser false-positive fails (for example an `@media` leftover), fix the parser in the test — do not unscope CSS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/modernist/admin-kit.css \
        components/admin/modernist/__tests__/admin-kit-tokens.test.ts
git commit -m "feat(admin): restyle backend kit under --pm tokens"
```

---

### Task 3: `data-pm` hooks on backend primitives

**Files:**
- Modify: `components/admin/modernist/__tests__/admin-kit-tokens.test.ts`
- Modify: `components/backend/InfoRow.tsx`
- Modify: `components/backend/DetailPageHeader.tsx`
- Modify: `components/backend/StatCard.tsx`
- Modify: `components/backend/MetricCard.tsx`
- Modify: `components/backend/states.tsx`
- Modify: `components/backend/ConsoleTabs.tsx`
- Modify: `components/admin/shared/UnderlineTabs.tsx`

Do not change any colour class. Only add `data-pm` attributes.

- [ ] **Step 1: Add the failing hook-presence assertions**

Append to the test file:

```ts
describe('data-pm hooks in source', () => {
  const files: Array<[string, string[]]> = [
    ['components/backend/InfoRow.tsx', ["data-pm=\"info-row\"", "data-pm=\"info-label\"", "data-pm=\"info-value\""]],
    ['components/backend/DetailPageHeader.tsx', ['data-pm="breadcrumb-current"', 'data-pm="breadcrumb-link"']],
    ['components/backend/StatCard.tsx', ['data-pm="stat-subtitle"']],
    ['components/backend/MetricCard.tsx', ['data-pm="metric-subtitle"']],
    ['components/backend/states.tsx', [
      'data-pm="loading-state"',
      'data-pm="empty-state"',
      'data-pm="empty-title"',
      'data-pm="empty-copy"',
      'data-pm="error-state"',
      'data-pm="error-icon"',
      'data-pm="error-title"',
    ]],
    ['components/backend/ConsoleTabs.tsx', ['data-pm="console-tabs"']],
    ['components/admin/shared/UnderlineTabs.tsx', ['data-pm="underline-tabs"']],
  ];

  it.each(files)('%s contains %j', (rel, needles) => {
    const src = read(rel);
    for (const needle of needles) {
      expect(src).toContain(needle);
    }
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: FAIL on `InfoRow.tsx` missing `data-pm="info-row"`.

- [ ] **Step 3: Add the hooks**

`components/backend/InfoRow.tsx` — replace the returned JSX with:

```tsx
    <div
      data-pm="info-row"
      className={cn('flex justify-between items-center py-3 border-b border-gray-50 last:border-0', className)}
    >
      <span data-pm="info-label" className="text-sm text-gray-500 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span data-pm="info-value" className="text-sm font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
```

`components/backend/DetailPageHeader.tsx` — on the breadcrumb `Link` add `data-pm="breadcrumb-link"`. On the current-item `span` add `data-pm="breadcrumb-current"`. Resulting breadcrumb items:

```tsx
                {item.href ? (
                  <Link href={item.href} data-pm="breadcrumb-link" className="hover:text-circleTel-orange">
                    {item.label}
                  </Link>
                ) : (
                  <span data-pm="breadcrumb-current" className="text-gray-900">{item.label}</span>
                )}
```

`components/backend/StatCard.tsx` — add `data-pm="stat-subtitle"` to every subtitle wrapper. There are three. Variant 1 (no icon):

```tsx
          <div data-pm="stat-subtitle" className="mt-2 text-xs text-gray-500 font-medium flex items-center gap-1">
```

Variant 2 (boxed icon):

```tsx
          {subtitle && <p data-pm="stat-subtitle" className="text-xs text-gray-500 mt-2">{subtitle}</p>}
```

Variant 3 (inline icon):

```tsx
          <p data-pm="stat-subtitle" className="text-sm font-medium text-gray-700 mt-1 flex items-center gap-1.5">
```

`components/backend/MetricCard.tsx` — subtitle paragraph:

```tsx
          {subtitle ? <p data-pm="metric-subtitle" className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
```

`components/backend/states.tsx`:

- `LoadingState` root div: add `data-pm="loading-state"`
- `EmptyState` root div: add `data-pm="empty-state"`
- `EmptyState` title `<p>`: add `data-pm="empty-title"`
- `EmptyState` description `<p>`: add `data-pm="empty-copy"`
- `ErrorState` root div: add `data-pm="error-state"`
- `ErrorState` icon: add `data-pm="error-icon"`
- `ErrorState` title `<p>`: add `data-pm="error-title"`

`components/backend/ConsoleTabs.tsx` — on `TabsList`:

```tsx
    <TabsList
      data-pm="console-tabs"
      className={cn(
```

`components/admin/shared/UnderlineTabs.tsx` — on the outer wrapper:

```tsx
    <div data-pm="underline-tabs" className={cn('border-b border-slate-200', className)}>
```

- [ ] **Step 4: Re-run the test**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/backend/InfoRow.tsx \
        components/backend/DetailPageHeader.tsx \
        components/backend/StatCard.tsx \
        components/backend/MetricCard.tsx \
        components/backend/states.tsx \
        components/backend/ConsoleTabs.tsx \
        components/admin/shared/UnderlineTabs.tsx \
        components/admin/modernist/__tests__/admin-kit-tokens.test.ts
git commit -m "feat(admin): add data-pm hooks for modernist kit"
```

---

### Task 4: Optional `PageHeader` eyebrow

**Files:**
- Modify: `components/backend/PageHeader.tsx`
- Modify: `components/admin/modernist/__tests__/admin-kit-tokens.test.ts`

- [ ] **Step 1: Add the failing PageHeader assertions**

Append:

```ts
describe('PageHeader eyebrow', () => {
  const src = read('components/backend/PageHeader.tsx');

  it('accepts an optional eyebrow and marks it data-pm="page-eyebrow"', () => {
    expect(src).toMatch(/eyebrow\?: string/);
    expect(src).toContain('data-pm="page-eyebrow"');
    expect(src).toContain('text-xs font-semibold uppercase text-gray-500');
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: FAIL — `eyebrow?: string` not found.

- [ ] **Step 3: Replace `components/backend/PageHeader.tsx` with**

```tsx
'use client';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional uppercase kicker above the title. Unused on /dashboard today. */
  eyebrow?: string;
  /** Right-aligned actions (buttons, filters). Stacks below title on mobile. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Canonical list/index page header for backend UIs. One type size and spacing so
 * every admin and consumer page opens the same way. For detail pages with
 * breadcrumbs + status, use DetailPageHeader instead.
 */
export function PageHeader({ title, subtitle, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div
      data-pm="page-header"
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        {eyebrow && (
          <p data-pm="page-eyebrow" className="text-xs font-semibold uppercase text-gray-500 mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

Colour classes stay gray so `/dashboard` is unchanged if someone later passes `eyebrow`. Admin CSS restyles `[data-pm='page-eyebrow']`.

- [ ] **Step 4: Re-run the test**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/backend/PageHeader.tsx \
        components/admin/modernist/__tests__/admin-kit-tokens.test.ts
git commit -m "feat(admin): add optional PageHeader eyebrow"
```

---

### Task 5: Update `BACKEND_UI_KIT.md`

**Files:**
- Modify: `docs/design/BACKEND_UI_KIT.md`

- [ ] **Step 1: Replace the opening “Home / Reference / Tokens” block and the first two principles**

Change lines 1–14 to:

```markdown
# Backend UI Kit

Shared component primitives for the **admin** (`/admin/*`) and **consumer** (`/dashboard/*`) dashboards.

- **Home:** `components/backend/` — import from `@/components/backend`.
- **Admin reference look:** `/admin/unjani/onboarding` — Archivo, `--pm-*` tokens (`#13274A` navy, `#F5841E` accent), 40px extrabold titles, 10px uppercase metric labels, `--pm-ground` page, `--pm-divider` rules. Applied automatically via `AdminModernistProvider` (`.portal-root`) + `components/admin/modernist/admin-kit.css`. Do not copy `--pm-*` into page files.
- **Customer `/dashboard` look:** unchanged slate / gray Tailwind on the same JSX. Dashboard is not inside `.portal-root`, so `admin-kit.css` does not apply.
- **Tokens:** admin chrome uses `components/portal/modernist/tokens.ts` (`portalModernist` → `--pm-*`). Dashboard keeps `tailwind.config.ts` (`circleTel.*`), `app/globals.css`, `DESIGN.md`. Do not invent new hex in either surface.

## Principles

- **Function first** — clarity over decoration. Admin cards are white on `--pm-ground` with `--pm-divider` rules. Dashboard cards stay `border-gray-200`, `shadow-sm`, `p-6`.
- **Orange is an accent** — admin primary CTA is `--pm-accent` fill with navy text. Accessible orange text is `--pm-accent-active` (`#D76026`), never `#F5841E` on white. Dashboard still uses `circleTel-orange` for CTA/active only. Never body text on white.
```

Leave the Components table, Usage example, Status variants, Migrating a page, Colour that carries meaning, and Back-compat sections in place.

In **Migrating a page** step 7, replace:

```
7. `npm run type-check:memory`; visual-diff against the billing hub / consumer billing reference.
```

with:

```
7. `npm run type-check:memory`; on admin, visual-diff against `/admin/unjani/onboarding`. On `/dashboard`, visual-diff against the consumer billing reference (slate).
```

In the `PageHeader` row of the Components table, append: `Optional \`eyebrow\` (uppercase kicker).`

- [ ] **Step 2: Confirm the doc still names StatusBadge as the only status colour source**

```bash
grep -n "StatusBadge\|--pm-\|Unjani\|dashboard stays\|slate" docs/design/BACKEND_UI_KIT.md
```

Expected: `--pm-*` and Unjani appear in the intro; StatusBadge still owns status hues; dashboard slate is stated.

- [ ] **Step 3: Commit**

```bash
git add docs/design/BACKEND_UI_KIT.md
git commit -m "docs: point admin UI kit at Unjani --pm tokens"
```

---

### Task 6: Verify

**Files:** none, unless verification finds a bug — then fix in the file that caused it and add a regression assertion to `admin-kit-tokens.test.ts`.

- [ ] **Step 1: Type-check delta**

```bash
npm run type-check:memory > /tmp/admin-tokens-tsc-after.txt 2>&1 || true
echo "BASELINE $(grep -c 'error TS' /tmp/admin-tokens-tsc-baseline.txt)  AFTER $(grep -c 'error TS' /tmp/admin-tokens-tsc-after.txt)"
grep -E "components/(backend|portal/modernist|admin/modernist|admin/shared/UnderlineTabs)" /tmp/admin-tokens-tsc-after.txt || true
```

Expected: no new errors in touched files. After-count must not exceed baseline.

- [ ] **Step 2: Jest**

```bash
npx jest components/admin/modernist/__tests__/admin-kit-tokens.test.ts \
  --modulePathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/node_modules/
```

Expected: PASS.

- [ ] **Step 3: Confirm no page files were edited**

```bash
git diff origin/main --name-only | grep '^app/admin/' || true
```

Expected: empty.

- [ ] **Step 4: Start (or reuse) the admin preview server on port 3002**

Check first:

```bash
ss -tulpn | grep -E ':3002' || true
free -h
```

If nothing is on 3002 and RAM available is ≥ 10 GB:

```bash
cd /home/circletel/.worktrees/admin-modernist-tokens
ALLOW_DEV_ADMIN_BYPASS=true node --max-old-space-size=8192 \
  ./node_modules/next/dist/bin/next dev -p 3002
```

If RAM is < 10 GB or another heavy build is running, stop and report. Do not start a second full Next process.

- [ ] **Step 5: Screenshot the four admin URLs**

```bash
set -a && source /home/circletel/.env.local && set +a
for path in /admin/unjani/onboarding /admin/dashboard /admin/leads /admin/orders; do
  npx tsx scripts/verify-admin-page.ts "$path" \
    --base=http://localhost:3002 \
    --out=.claude/scratch/verify-admin-tokens \
    --widths=1440,375
done
```

Expected: exit 0 on each. Fail if any `/api/admin/*` returned 401/403.

Inspect `.claude/scratch/verify-admin-tokens`:

| URL | Must see |
|---|---|
| `/admin/unjani/onboarding` | Same as today: Archivo, navy 40px title, KPI cards, accent buttons. No regression. |
| `/admin/dashboard` | 40px 800 navy title, 10px uppercase stat labels, primary buttons accent fill + navy text |
| `/admin/leads` | `PageHeader` + table heads 11px 800 uppercase navy |
| `/admin/orders` | Same header/table treatment |

375px: sidebar must not cover the page (script clicks the backdrop).

- [ ] **Step 6: Confirm `/dashboard` did not pick up the tokens**

If a customer dashboard route is reachable on the same server, open `/dashboard` (or `/dashboard/billing`). Titles must still be `text-2xl font-semibold text-gray-900` in the DOM (not 40px / font-weight 800 from `admin-kit.css`). If `/dashboard` is not running in this worktree, grep is sufficient proof of the scope invariant:

```bash
# dashboard pages are not wrapped in AdminModernistProvider
grep -n "AdminModernistProvider" app/dashboard -r || true
grep -n "portal-root" app/dashboard -r || true
```

Expected: no matches. The provider lives only in `app/admin/AdminLayoutClient.tsx`.

- [ ] **Step 7: Push**

```bash
git push origin HEAD
```

Do not open a PR unless asked.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Shared kit only, no page rewrites | Task 6 step 3 + Global Constraints |
| Admin only / `.portal-root` | Task 2 CSS guard |
| Four new CSS vars | Task 1 |
| Hex from `portalModernist` only | Task 1 + Task 2 hex guard |
| PageHeader eyebrow, dashboard-safe classes | Task 4 |
| Detail breadcrumbs navy / accent-active | Task 2 CSS + Task 3 hooks |
| StatCard / MetricCard labels + values + subtitle | Task 2 + Task 3 |
| SectionCard / InfoRow | Task 2 + Task 3 |
| Tables | Task 2 |
| Button / Input / Select selectors | Task 2 (exact class list from spec) |
| ConsoleTabs + UnderlineTabs | Task 2 + Task 3 |
| Loading / Empty / Error | Task 2 + Task 3 |
| StatusBadge unchanged | no task touches `StatusBadge.tsx` |
| Billing `--bm-*` untouched | not in file map |
| `BACKEND_UI_KIT.md` admin reference | Task 5 |
| Visual verify four URLs + dashboard | Task 6 |
| Radix portals out of scope | no CSS for `SelectContent` / Dialog |

No TBD / “similar to Task N” leftovers. `portalModernist.muted` is the only new hex; hover/active/danger reuse `accentPressed` / `accentDeep` / `danger`.
