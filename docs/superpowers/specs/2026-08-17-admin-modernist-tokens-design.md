# Admin Modernist Tokens — Shared Kit Pass

**Date:** 2026-08-17
**Status:** Design approved, awaiting implementation plan
**Reference look:** `/admin/unjani/onboarding` (`PageHeader`, `KpiStrip`, `--pm-*`, Archivo)

## Goal

Any `/admin` page that already uses `@/components/backend` (and the usual shadcn `Button` / `Input` / `Select` / `Table`) should read as the same product as `/admin/unjani/onboarding`: Archivo, navy `#13274A`, orange `#F5841E`, 40px extrabold titles, 10px uppercase metric labels, `--pm-ground` page, `--pm-divider` rules.

Presentation only. No data, API, query, routing, or business-logic changes.

## Problem

Admin chrome already mounts Unjani / portal tokens:

- `AdminLayoutClient` wraps authenticated `/admin` in `AdminModernistProvider` (`.portal-root` + Archivo + `PORTAL_MODERNIST_STYLE`).
- `<main>` uses `background: var(--pm-ground)`.
- Sidebar and `AdminHeader` already use `--pm-navy` / `--pm-divider` / `--pm-body`.
- `admin-kit.css` restyles a subset of `[data-pm]` primitives.

Most pages still look like the older backend kit because:

1. Backend primitives keep hardcoded slate / gray / `circleTel-orange` Tailwind classes.
2. `admin-kit.css` only covers headers, some cards, and `main table thead`.
3. Common shadcn pieces (`Button`, `Input`, `Select`, `Table`, tabs) are unscoped.
4. A few primitives (`InfoRow`, `ConsoleTabs`, states) have no `data-pm` hook.

Customer `/dashboard` shares `@/components/backend` and is **not** inside `.portal-root`. That surface must stay slate.

## Decisions (approved)

| Decision | Choice |
|---|---|
| Scope | Shared kit only — not a page-by-page layout rewrite |
| Surfaces | Admin only. Customer `/dashboard` stays slate |
| Method | Deepen existing `.portal-root` CSS. Do not put `var(--pm-*)` in backend JSX colours |
| Palette | Reuse `portalModernist` / `PORTAL_MODERNIST_STYLE`. Do not invent hex |
| Status colour | `StatusBadge` hues unchanged. Restyle chrome, not meaning |
| Billing `--bm-*` | Leave alone this pass |

Rejected alternatives:

- **CSS-var fallbacks in backend JSX.** Cleaner long-term, but one missed fallback restyles `/dashboard`.
- **Theme context / dual class maps.** More JS and tests than this job needs.
- **Force the onboarding page recipe** (eyebrow + KPI strip) onto every list page. That is a rewrite, not a token pass.

## Token set

No new palette. Add only the vars onboarding / billing already use as hex, so `admin-kit.css` never invents colours.

Mounted on `.portal-root` via `PORTAL_MODERNIST_STYLE` (and already-loaded `tokens.css` / `admin-kit.css`):

| Token | Value | Use |
|---|---|---|
| `--pm-navy` | `#13274A` | Titles, labels, sidebar, active chrome |
| `--pm-body` | `#1F2937` | Body / subtitle |
| `--pm-accent` | `#F5841E` | Primary button, focus, active tab |
| `--pm-accent-hover` | `#E97B26` | Primary hover |
| `--pm-accent-active` | `#D76026` | Primary press / ghost text |
| `--pm-divider` | `color-mix(in srgb, #13274A 28%, transparent)` | Rules, card borders, table heads |
| `--pm-ground` | `color-mix(in srgb, #13274A 7%, #FFFFFF)` | Page background (already on `<main>`) |
| `--pm-surface` | `color-mix(in srgb, #13274A 6%, #FFFFFF)` | Hover / inset |
| `--pm-muted` | `#6B7280` | Notes, empty copy, placeholders |
| `--pm-danger` | `#DC2626` | Error-state icon only |

Already defined today: navy, body, accent, divider, ground, surface. **Add:** `--pm-accent-hover`, `--pm-accent-active`, `--pm-muted`, `--pm-danger`.

Source of truth for the hex values: `components/portal/modernist/tokens.ts` (`portalModernist`). Keep the TS object and the inline style map in sync.

### Type (measured from onboarding)

| Element | Size / weight | Colour |
|---|---|---|
| Page title | 1.75rem / **40px** from `sm`, weight **800**, tight leading | `--pm-navy` |
| Eyebrow / metric label | 10px, weight 800, `letter-spacing: 0.08em`, uppercase | `--pm-navy` |
| Subtitle / body | 0.875rem, regular | `--pm-body` |
| Table head | 11px, weight 800, uppercase | `--pm-navy` |
| Primary button | 0.875rem, weight 800, `min-h-11`, `rounded-lg` | accent fill, navy text |

Font family is already Archivo on `.portal-root`. Do not reset heading size on bare `h1` — `AdminHeader` uses a compact title. Page titles opt in with `[data-pm="page-header"]` / `[data-pm="detail-header"]`.

## CSS strategy

`components/admin/modernist/admin-kit.css` stays the single admin restyle sheet.

Rules:

1. Every new rule is scoped under `.portal-root`. No `:root` or unscoped selectors.
2. Keep the sheet **unlayered** so it outranks Tailwind `@layer utilities` on admin. Use `!important` only where an existing unlayered utility still wins (same as current label/value rules).
3. Prefer `[data-pm="…"]` hooks on backend primitives. For shadcn that we do not own, never use a bare `button` / `input` selector — that would restyle tabs, icon buttons, and Select. Use the class / role list in **Shadcn selectors** below.
4. Do not change backend JSX colour classes. Those classes remain the `/dashboard` look.
5. `admin-kit.css` may only use `var(--pm-*)` plus `#FFFFFF` / `transparent` / `rgb(0 0 0 / 0.06)` for the existing card ring. No new hex.

`AdminModernistShell` stays a no-op wrapper. Do not re-introduce negative layout offsets.

## Primitive mapping

All visual changes are CSS under `.portal-root` unless noted as a structural hook.

| Primitive | Hook | Admin look |
|---|---|---|
| `PageHeader` | `data-pm="page-header"` (exists) | CSS already sets `items-end` + 2px divider + 40px 800 title. Optional `eyebrow?: string` renders a `data-pm="page-eyebrow"` line with dashboard-safe slate classes (`text-xs font-semibold uppercase text-gray-500`). Admin CSS restyles it to 10px 800 navy. Unused on `/dashboard` today, so no visual change there. |
| `DetailPageHeader` | `data-pm="detail-header"` (exists) | Same title scale. Breadcrumb current item navy; links `--pm-accent-active`. |
| `StatCard` | `data-pm="stat-card"` + label/value (exist) | White card, 1px ring, `rounded-xl`. Labels 10px 800 uppercase navy. Values 800 navy. Active ring `--pm-accent`, not `circleTel-orange`. Subtitle `--pm-muted`. |
| `MetricCard` | `data-pm="metric-card"` + label/value (exist) | Same card + type treatment as `StatCard`. |
| `SectionCard` | `data-pm="section-card"` (exists) | Divider + navy 800 heading. Icon navy. |
| `InfoRow` | add `data-pm="info-row"` | Label `--pm-muted`, value `--pm-navy`, row rule `--pm-divider`. |
| Tables | `.portal-root main table` (exists, expand) + shadcn `Table` in `main` | 11px 800 uppercase navy heads, 2px head rule, 1px row rules. Hover `--pm-surface`. |
| `Button` default / `cta` / `cta-gradient` | see Shadcn selectors | Accent fill, navy text, weight 800, `rounded-lg`. Hover `--pm-accent-hover`. Active `--pm-accent-active`. |
| `Button` outline / secondary | see Shadcn selectors | White + divider + navy. Hover `--pm-surface`. |
| `Button` ghost / link | see Shadcn selectors | Text `--pm-accent-active`. Hover accent 10% wash. |
| `Button` destructive | none | **Unchanged** red. Do not match `.bg-destructive`. |
| `Input` | `.portal-root main input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), .portal-root main textarea` | Surface fill, divider border, accent caret + focus ring. |
| `Select` trigger | `.portal-root main [role="combobox"]` | Same as Input. Radix `SelectTrigger` is `role="combobox"` and has no `data-slot`. |
| `ConsoleTabsList` | add `data-pm="console-tabs"` | Inactive navy/muted. Active = navy fill + white text (onboarding filter-chip idea), not orange-on-white. |
| `UnderlineTabs` | add `data-pm="underline-tabs"` | Active underline + text navy. Inactive `--pm-muted`. |
| `LoadingState` / `EmptyState` / `ErrorState` | add `data-pm="loading-state"` / `empty-state` / `error-state` | Spinner `--pm-accent`. Empty title navy, copy muted. Error icon `--pm-danger`, title navy. |
| `StatusBadge` | none | **Unchanged hues.** Do not restyle fill/text. |

`AdminPage` is already a `space-y-6` shell. No change.

### Shadcn selectors

`buttonVariants` does not emit a variant data attribute. Match the classes it does emit, under `.portal-root main` only (header / sidebar stay as they are).

| Kind | Selector |
|---|---|
| Primary | `:is(button, a).bg-primary`, `:is(button, a).bg-circleTel-orange`, `:is(button, a).bg-gradient-cta` |
| Outline | `:is(button, a).border-input:not([role="combobox"])` — Select trigger also uses `border-input` |
| Secondary | `:is(button, a).bg-secondary` |
| Ghost | `:is(button, a).hover\:bg-accent:not(.border-input):not(.bg-primary)` |
| Link | `:is(button, a).underline-offset-4` |
| `cta-outline` | `:is(button, a).border-circleTel-orange` → treat as outline (white + divider + navy), not orange border |
| `cta-navy` | leave alone (already navy) |

**Known gap (accepted):** Radix portals (`SelectContent`, `Dialog`, `DropdownMenu`) render on `document.body`, outside `.portal-root`. Their interiors stay default shadcn this pass. Triggers that live in `main` (Select trigger, Dialog open buttons) are restyled.

## Colour that carries meaning

Preserve these. Do not flatten into navy/orange:

- `StatusBadge` success / warning / error / info / neutral
- AR aging buckets, cash-match green/red, exception severity
- SMS blue / Email purple channel identity
- WhatsApp `#25D366` (never reuse)
- Trend up/down greens and reds on `StatCard`

Orange is an accent: primary CTA, focus, links. Never body text on white. Accessible orange text, when needed, is `--pm-accent-active` (`#D76026`), not `#F5841E`.

## Files

| File | Change |
|---|---|
| `components/portal/modernist/PortalModernistShell.tsx` | Add the four missing vars to `PORTAL_MODERNIST_STYLE` |
| `components/portal/modernist/tokens.ts` | Add the same four keys to `portalModernist` so TS and CSS stay aligned |
| `components/admin/modernist/admin-kit.css` | Expand rules per the mapping above |
| `components/backend/PageHeader.tsx` | Optional `eyebrow` prop + keep `data-pm="page-header"` |
| `components/backend/InfoRow.tsx` | `data-pm="info-row"` only |
| `components/backend/states.tsx` | `data-pm` on the three states |
| `components/backend/ConsoleTabs.tsx` | `data-pm="console-tabs"` on `TabsList` |
| `components/admin/shared/UnderlineTabs.tsx` | `data-pm="underline-tabs"` |
| `docs/design/BACKEND_UI_KIT.md` | Admin reference look = Unjani / `--pm-*`. Note `/dashboard` remains slate via the same JSX classes |

Do **not** edit individual `app/admin/**/page.tsx` files in this pass.

`PageHeader` is the only API change (`eyebrow?`). It is additive. Existing call sites keep their current markup.

## Out of scope

- Page-by-page composition (forced eyebrow + `KpiStrip` on every list)
- Customer `/dashboard` visual change
- Billing `--bm-*` consolidation
- Replacing `StatCard` with `KpiStrip` or `Button` with `PmButton`
- Login / signup / forgot-password (full-screen routes skip `AdminModernistProvider`)
- New packages, new fonts, new Tailwind theme keys

## Verification

Prove admin picked up the tokens and dashboard did not.

1. **CSS scope grep.** `admin-kit.css` has no selector that is not under `.portal-root`.
2. **Token grep.** `admin-kit.css` contains no raw `#` except the documented white / ring, and no `circleTel-` classes.
3. **Type-check.** `npm run type-check:memory` — only `PageHeader` / `InfoRow` / states / tabs type surface may change, and only additively.
4. **Admin visual (login harness).** `scripts/verify-admin-page.ts` against:
   - `/admin/unjani/onboarding` — must still match today's look (regression)
   - `/admin/dashboard` — title 40px 800 navy, stat labels 10px uppercase navy, primary buttons accent/navy
   - `/admin/leads` — `PageHeader` + table heads match the type table
   - `/admin/orders` — same
   Confirm no `/api/admin/*` 401/403 (page shell alone is not evidence).
5. **Dashboard visual.** Open `/dashboard` (or the billing dashboard reference). Titles stay `text-2xl font-semibold text-gray-900`. No Archivo / navy / 40px title unless that page already opted into portal modernist.
6. **Desktop + mobile.** 1440px and 375px on the four admin URLs above. Sidebar still closes on 375px (existing verify-script backdrop click).

## Success

- A backend-kit admin page looks like the same system as Unjani onboarding (type, colour, buttons, tables, cards).
- `/admin/unjani/onboarding` does not regress.
- `/dashboard` does not change.
- No page file rewrites.
- Tokens come only from `--pm-*`.
