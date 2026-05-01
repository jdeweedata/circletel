# Design Spec: /skyfibre Editorial Landing Page

**Date**: 2026-04-30
**Status**: Approved
**Route**: `/skyfibre`

---

## Context

A brutalist-aesthetic mockup (`/tmp/circletel_product.html`) was reviewed against existing CircleTel product pages. The mockup's art direction is strong but incompatible with the global design system (rounded SaaS aesthetic, Manrope/Inter fonts, shadcn/ui tokens). Adopting it site-wide would require a multi-week refactor touching 100+ pages.

**Decision**: Hybrid approach — build the mockup as a standalone `/skyfibre` consumer landing that adopts the editorial aesthetic while keeping the global design system unchanged.

---

## Goals

- Deliver the mockup's editorial visual statement as a working Next.js page
- Use real SkyFibre pricing (not the mockup's placeholder R399/R599/R999)
- Use the real coverage-check flow (Google Places → feasibility modal)
- Scope all brutalist tokens (Syne font, zero border radius) to this route only
- Leave `tailwind.config.ts`, `globals.css`, and all other pages untouched

---

## Architecture

### Route

`app/skyfibre/page.tsx` — React Server Component, `revalidate = 3600`.

No new API routes needed; pricing is sourced from the existing `HOME_PLANS` constant.

### Section Order (mirroring the mockup)

1. **Nav** — simple fixed header with logo + CTA link (not the full site nav — the mockup uses a minimal sticky bar)
2. **Hero** — full-bleed, Ink Black background. Syne display heading at 5xl–7xl. Subhead in DM Sans. Two CTAs: "Check Coverage" (scrolls to coverage section) + "View Plans" (scrolls to pricing).
3. **Plan Cards** — 3-column grid. Cards use `border` not shadow, 0px radius. "Most Popular" card gets orange border + inverted background. Prices from `HOME_PLANS` constants: Home Plus / Max / Ultra.
4. **Feature Strip** — 4 items: NO THROTTLING / 24-HOUR SUPPORT / MONTH-TO-MONTH / 99.9% UPTIME. Horizontal on desktop, 2×2 grid on mobile. Phosphor icons (not Material Symbols).
5. **Coverage Check** — full-width section embedding `<CoverageCheck />`. Warm White (`#F8F8F4`) background to contrast with the dark hero.
6. **Why CircleTel** — reuse `<WhyCircleTel />` component (already on `/connectivity/fibre`).
7. **Footer** — minimal: copyright, WhatsApp link, email. No full site nav footer on this page.

### Typography Scoping

Syne loaded via `next/font/google` and injected as a CSS variable (`--font-syne`) on the root element of this page only. No `font-syne` Tailwind token added globally.

```tsx
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
// Applied as className on the page wrapper div
```

### Radius Scoping

Cards and buttons on this page use `rounded-none` (Tailwind utility). No global token mutation. The `[data-skyfibre]` attribute pattern is available if needed for component overrides.

### Pricing

```typescript
// From components/home/PlanCards.tsx — HOME_PLANS constant
// Speeds and prices are factual; do NOT use mockup prices
const plans = [
  { name: 'Home Plus', speed: '50 Mbps', price: 'R899/mo' },
  { name: 'Max', speed: '100 Mbps', price: 'R999/mo', popular: true },
  { name: 'Ultra', speed: '1 Gbps', price: 'R1,299/mo' },
];
```

### Coverage Check

Embed `<CoverageCheck />` from `components/coverage/CoverageCheck.tsx`. This component is already a client component; the server page imports it normally. No variant prop changes needed — default renders inline form.

---

## What Is NOT Changed

| File | Status |
|------|--------|
| `tailwind.config.ts` | No changes — Syne not added globally |
| `app/globals.css` | No changes — shadcn tokens untouched |
| `components/home/PlanCards.tsx` | Read-only — constants reused, file not modified |
| `components/coverage/CoverageCheck.tsx` | Used as-is, no modifications |
| `components/products/WhyCircleTel.tsx` | Used as-is, no modifications |
| All other routes | Zero impact — this is an additive new route |

---

## Verification Criteria

1. `http://localhost:3000/skyfibre` renders the brutalist aesthetic (sharp corners, Syne heading, dark hero)
2. Plan cards show R899 / R999 / R1,299 (not the mockup's R399 / R599 / R999)
3. Coverage check input triggers Google Places autocomplete and opens the feasibility modal
4. `/` (homepage), `/workconnect`, `/connectivity/fibre` are visually unchanged
5. `npm run type-check:memory` passes with zero errors
6. No Syne font loads on any page except `/skyfibre` (check network tab)
