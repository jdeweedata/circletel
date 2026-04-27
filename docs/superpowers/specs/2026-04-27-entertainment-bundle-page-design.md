# Design Spec: /entertainment Bundle Promo Page

**Date**: 2026-04-27
**Status**: Approved
**Route**: `/entertainment`
**Theme**: "Stream Everything. Pay Less."

---

## Overview

A dedicated one-off campaign landing page that bundles Mecool Android TV devices with CircleTel internet plans. Modelled on Teljoy's promo page structure (hero banner + product grid + conversion CTA). The primary conversion action is an inline coverage check that routes into the existing CircleTel order flow.

---

## Architecture

### New Files

```
app/entertainment/
  page.tsx                        # Server component — metadata, layout shell

components/entertainment/
  EntertainmentHero.tsx           # Full-width hero banner (navy, 2-col split)
  BundleCard.tsx                  # Single device + internet plan card
  BundleGrid.tsx                  # 3-col responsive grid of BundleCards
  CoverageCheckModal.tsx          # Lightweight dialog — reuses /api/coverage

lib/data/
  entertainment-bundles.ts        # Static bundle definitions
```

### Modified Files

```
app/packages/[leadId]/page.tsx    # Small addition: read ?bundle= param,
                                  # pre-highlight matched plan, show device callout
```

### Reused Infrastructure

- `Navbar` + `Footer` — existing layout components
- `/api/coverage` — existing coverage check API (address → lead creation)
- shadcn/ui: `Card`, `Button`, `Badge`, `Dialog`, `Input`
- Tailwind brand tokens: `circleTel-orange` (#F5831F), navy (`#1B2A4A`)

---

## Data Model

Bundle definitions are static TypeScript constants — no database required for this one-off page.

```typescript
// lib/data/entertainment-bundles.ts

export interface EntertainmentBundle {
  id: string
  badge?: string                  // e.g. "Most Popular"
  device: {
    name: string
    sku: string
    tagline: string
    price_incl_vat: number
    image_path: string
  }
  internet: {
    name: string
    speed_mbps: number
    technology: 'LTE' | '5G' | 'Fibre'
    monthly_incl_vat: number
  }
  bundle_monthly_incl_vat: number  // combined discounted monthly price
  features: string[]               // 3 bullet points shown on card
}
```

### Bundle Catalogue (5 bundles)

| ID | Device | Internet | Monthly (approx) | Badge |
|----|--------|----------|-----------------|-------|
| `kd3-lte-10` | Mecool KD3 Android TV Stick | 10Mbps LTE | R499/mo | — |
| `km7plus-lte-25` | Mecool KM7 Plus Google TV Box | 25Mbps LTE | R699/mo | Most Popular |
| `km7plus-lte-50` | Mecool KM7 Plus Google TV Box | 50Mbps LTE | R899/mo | — |
| `ks3-lte-50` | Mecool KS3 Soundbar + Subwoofer | 50Mbps LTE | R1,399/mo | — |
| `ks3-km7plus-lte-100` | KS3 Soundbar + KM7 Plus | 100Mbps LTE | R1,799/mo | Ultimate |

> **Note**: Prices are approximate. Confirm against live CircleTel plan pricing before launch. KD3 = R799 excl. VAT (R919 incl.), KM7 Plus = R899 excl. VAT (R1,034 incl.), KS3 = R5,999 excl. VAT (R6,899 incl.) per April 2026 Nology pricebook.

---

## Page Layout

### Zone 1 — Hero Banner (`EntertainmentHero`)

Full-width, navy (`#1B2A4A`) background. Two-column split on desktop, stacked on mobile.

**Left column:**
- Orange badge: "New — Entertainment Bundles"
- H1: "Stream Everything. Pay Less."
- Subheading: "Bundle a Mecool Android TV device with CircleTel internet from R499/mo"
- Primary CTA button (orange): "Check Coverage"
- Secondary link: "WhatsApp us" → `https://wa.me/27824873900`

**Right column:**
- Campaign hero image — Mecool KM7 Plus on navy background with orange volumetric lighting (generated via `nb-product-hero` skill, 16:9, 4K, saved to `public/images/entertainment/entertainment-hero.jpg`)

### Zone 2 — Promo Strip

Thin full-width orange bar:
> "Free delivery on all entertainment bundles · No lock-in contracts · Setup in 24 hours"

### Zone 3 — Bundle Grid (`BundleGrid` + `BundleCard`)

3-column desktop / 2-column tablet / 1-column mobile responsive grid.

**`BundleCard` anatomy (per card):**
- Device image (top, centred, white bg)
- "Most Popular" badge (orange, conditional)
- Device name + tagline (e.g. "Mecool KM7 Plus · Google TV Box")
- Internet plan pill (e.g. "25Mbps LTE")
- Monthly price (large, bold): "R699/mo"
- 3 feature bullets (speed · no lock-in · free delivery)
- "Get This Bundle" button (primary, full-width) → opens `CoverageCheckModal` with bundle context

### Zone 4 — Bottom CTA Strip

Orange background, centred:
- Headline: "Not sure which bundle suits you?"
- WhatsApp button (white): pre-filled message "Hi, I'm interested in the CircleTel Entertainment Bundle"
- Ghost link: "View all internet plans" → `/products`

---

## Conversion Flow

```
/entertainment
  → "Get This Bundle" clicked (BundleCard)
  → CoverageCheckModal opens
      shows: "You're getting: [Device] + [Plan]"
      address input + "Check Coverage" button
  → POST /api/coverage
      ├── NOT COVERED
      │     → "We're not in your area yet"
      │     → "Join the waitlist" (existing waitlist flow)
      │     → WhatsApp fallback button
      └── COVERED → lead created
            → redirect: /packages/[leadId]?bundle=<bundleId>
                packages page reads ?bundle= param
                → pre-highlights matched internet plan
                → shows "Includes: [Device name]" callout banner
            → /order/checkout (existing flow)
```

### packages/[leadId] change

Read the `bundle` URL param. If present:
1. Pre-highlight the matching service package (match on speed)
2. Render a small "Bundle includes" callout card above the package grid showing the device name and image

This is a read-only, additive change — no existing behaviour modified.

---

## Hero Image Generation

Run before implementation:

```bash
# Generate entertainment campaign hero image
set -a && source .env.local && set +a && python3 scripts/generate-entertainment-hero.py
```

Script to create: `scripts/generate-entertainment-hero.py`
- Template: `nb-product-hero` Template B (Luxury Multi-Phase Product) or Template C (Bundle Spotlight)
- Subject: Mecool KM7 Plus + KS3 Soundbar on navy background, orange volumetric lighting
- Output: `public/images/entertainment/entertainment-hero.jpg`
- Aspect ratio: 16:9, 4K

---

## SEO Metadata

```typescript
export const metadata: Metadata = {
  title: 'Entertainment Bundles | Stream Everything. Pay Less. | CircleTel',
  description: 'Bundle a Mecool Android TV device with CircleTel internet from R499/mo. No lock-in contracts. Free delivery. Check coverage today.',
  openGraph: {
    title: 'Stream Everything. Pay Less.',
    description: 'Mecool Android TV + CircleTel internet from R499/mo',
    images: ['/images/entertainment/entertainment-hero.jpg'],
  },
}
```

---

## Out of Scope

- Admin CMS control of bundle content (this is a static one-off page)
- Cart/basket functionality (conversion goes through existing order flow)
- Bundle-specific pricing API (prices are static, confirmed at launch)
- Reusable `/promotions/[slug]` template (separate future project)

---

## Success Criteria

1. Page renders at `/entertainment` with all 5 bundle cards
2. Coverage check modal opens per card with correct bundle context
3. Covered address routes to `/packages/[leadId]?bundle=<id>` with plan pre-highlighted and device callout visible
4. Uncovered address shows waitlist + WhatsApp fallback
5. Page passes `npm run type-check:memory`
6. Mobile-responsive (1-col stacked layout)
