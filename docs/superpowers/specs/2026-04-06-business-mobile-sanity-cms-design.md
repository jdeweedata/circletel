# Design: /business/mobile — Full Sanity CMS

**Date:** 2026-04-06  
**Page:** https://circletel.co.za/business/mobile  
**Approach:** Hybrid — structural hero from top-level `productPage` fields, all sections below the hero driven by `blocks[]`

---

## Goal

Replace all hardcoded content on `/business/mobile` with Sanity CMS-managed data. Content editors must be able to update every section — bundles, trust badges, comparison copy, testimonials, promo banner, CTA — without a code deploy.

---

## Current State

The page is partially Sanity-driven:
- **Already CMS-driven:** hero section (heroImage, name, tagline, pricing), any blocks in `blocks[]`
- **Hardcoded:** bundle grid, trust strip, comparison table, testimonials, quote form bundle options, CTA banner copy, promo banner

Hardcoded data lives in `lib/data/business-mobile.ts` and is imported directly by the component files in `components/business-mobile/`.

---

## Architecture

**Approach B (Hybrid):**
- Hero stays as top-level `productPage` fields (`heroImage`, `tagline`, `pricing`) — validated, always present
- `promoBanner` added as a new top-level `productPage` field
- Everything below the hero is delivered via `blocks[]` and rendered by `BlockRenderer`
- 4 new reusable block types added to the block registry

**Page render order:**
1. `BizMobilePromoBanner` — from `productPage.promoBanner`
2. Hero section — from `productPage.heroImage / tagline / pricing`
3. `<BlockRenderer sections={page.blocks} />` — all remaining sections

---

## Sanity Schema Changes

### 1. New field on `productPage`: `promoBanner`

```ts
defineField({
  name: 'promoBanner',
  title: 'Promo Banner',
  type: 'object',
  fields: [
    { name: 'enabled', type: 'boolean', title: 'Show Banner', initialValue: false },
    { name: 'message', type: 'string', title: 'Banner Message' },
    { name: 'endsAt', type: 'datetime', title: 'Promo End Date/Time' },
  ],
})
```

### 2. New block: `bundleGridBlock`

Replaces `BizMobileBundleGrid`. Fields:

| Field | Type | Notes |
|-------|------|-------|
| `eyebrow` | string | Optional label above headline |
| `headline` | string | Section heading |
| `description` | text | Subtitle |
| `bundles[]` | array | See bundle object below |
| `columns` | 2\|3\|4 | Grid columns, default 4 |

Bundle object fields:

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Required |
| `tagline` | string | Short descriptor |
| `badge` | string | e.g. "MOST POPULAR" |
| `badgeColor` | primary\|secondary\|navy\|purple | Controls colour scheme |
| `icon` | string | Material Symbols icon name |
| `priceFrom` | string | e.g. "From R455" |
| `priceSuffix` | string | e.g. "/mo" |
| `features[]` | string[] | Bullet point list |
| `ctaLabel` | string | Button text |
| `ctaUrl` | string | Button href |
| `featured` | boolean | Featured card treatment (orange border, top badge) |

### 3. New block: `trustStripBlock`

Replaces `BizMobileTrustStrip`. Fields:

| Field | Type | Notes |
|-------|------|-------|
| `badges[]` | array | icon + text pairs |
| `badges[].icon` | string | Material Symbols icon name |
| `badges[].text` | string | Badge label |

### 4. New block: `dualListBlock`

Replaces `BizMobileComparisonTable`. Fields:

| Field | Type | Notes |
|-------|------|-------|
| `headline` | string | Section heading |
| `description` | text | Section subtitle |
| `leftColumn.label` | string | Column heading (e.g. "CircleTel-Managed") |
| `leftColumn.badgeLabel` | string | Badge text (e.g. "CircleTel Advantage") |
| `leftColumn.items[]` | string[] | Check-icon list items |
| `rightColumn.label` | string | Column heading (e.g. "DIY / Self-Managed") |
| `rightColumn.badgeLabel` | string | Badge text (optional) |
| `rightColumn.items[]` | string[] | Cross-icon list items |

Left column always renders green `check_circle` icons (CircleTel side).  
Right column always renders grey `cancel` icons (DIY side).

### 5. New block: `whatsappQuoteBlock`

Replaces `BizMobileQuoteForm`. Fields:

| Field | Type | Notes |
|-------|------|-------|
| `eyebrow` | string | e.g. "Get a Quote in 2 Minutes" |
| `headline` | string | Form heading |
| `description` | string | Subheading |
| `bundleOptions[]` | string[] | Dropdown options, e.g. ["BusinessMobile", "OfficeConnect"] |
| `phoneNumber` | string | WhatsApp number (falls back to `CONTACT.WHATSAPP_NUMBER`) |

### 6. `productPage.blocks[]` additions

All 4 new block types added as `defineArrayMember` entries in `productPage.ts`.

### 7. `lib/sanity/types.ts` additions

```ts
type BlockType =
  | ... (existing)
  | 'bundleGridBlock'
  | 'trustStripBlock'
  | 'dualListBlock'
  | 'whatsappQuoteBlock'
```

---

## New React Components

All in `components/sanity/blocks/`:

### `BundleGridBlock.tsx`
- Accepts typed `bundleGridBlock` props
- Renders the same card grid visual as the current `BizMobileBundleCard`
- Reuses `BADGE_STYLES` / `ICON_BG_STYLES` colour maps keyed on `badgeColor`
- Featured card: orange border + floating top badge
- Non-featured: orange top border + hover treatment
- Grid columns from `columns` prop (default 4)

### `TrustStripBlock.tsx`
- Renders `badges[]` as horizontal flex row
- Each badge: Material Symbols icon (orange) + bold text
- Identical visual to current `BizMobileTrustStrip`

### `DualListBlock.tsx`
- 2-column dark card layout: navy bg left, slate-800 right
- Left: "CircleTel Advantage" badge, green check_circle icons, white text
- Right: muted badge, grey cancel icons, slate text
- Rounded-2xl card with overflow-hidden shadow

### `WhatsAppQuoteBlock.tsx` *(client component)*
- Name, phone, bundle dropdown, WhatsApp submit button
- `bundleOptions` from Sanity populates `<select>` (replaces `BIZ_MOBILE_BUNDLES` import)
- `phoneNumber` from Sanity or `CONTACT.WHATSAPP_NUMBER` fallback
- Pre-fills WhatsApp message with name, phone, selected bundle

---

## Modified Files

| File | Change |
|------|--------|
| `lib/sanity/schemas/documents/productPage.ts` | Add `promoBanner` field + 4 new `defineArrayMember` entries in `blocks[]` |
| `lib/sanity/schemas/index.ts` | Register 4 new block schemas |
| `lib/sanity/types.ts` | Add 4 new `BlockType` values |
| `components/sanity/blocks/index.ts` | Import + register 4 new components in `blockRegistry` |
| `components/business-mobile/BizMobilePromoBanner.tsx` | Accept `enabled`, `message`, `endsAt` from Sanity props instead of hardcoded constant |
| `app/business/mobile/page.tsx` | Extend GROQ query, remove static component imports, pass Sanity promoBanner to component |

---

## Created Files (8)

```
lib/sanity/schemas/blocks/bundleGridBlock.ts
lib/sanity/schemas/blocks/trustStripBlock.ts
lib/sanity/schemas/blocks/dualListBlock.ts
lib/sanity/schemas/blocks/whatsappQuoteBlock.ts
components/sanity/blocks/BundleGridBlock.tsx
components/sanity/blocks/TrustStripBlock.tsx
components/sanity/blocks/DualListBlock.tsx
components/sanity/blocks/WhatsAppQuoteBlock.tsx
```

---

## Deleted Files (7)

```
lib/data/business-mobile.ts
components/business-mobile/BizMobileBundleGrid.tsx
components/business-mobile/BizMobileTrustStrip.tsx
components/business-mobile/BizMobileComparisonTable.tsx
components/business-mobile/BizMobileQuoteForm.tsx
components/business-mobile/BizMobileTestimonials.tsx
components/business-mobile/BizMobileCTABanner.tsx
```

`components/business-mobile/BizMobileBundleCard.tsx` and `components/business-mobile/index.ts` are retained — the card component is repurposed as the per-card renderer inside `BundleGridBlock`.

---

## Data Flow

```
Sanity Studio
  └── productPage (slug: "business-mobile")
        ├── name, tagline, heroImage, pricing  →  Hero section
        ├── seo                                →  generateMetadata()
        ├── promoBanner                        →  BizMobilePromoBanner
        └── blocks[]
              ├── bundleGridBlock              →  BundleGridBlock
              ├── trustStripBlock              →  TrustStripBlock
              ├── dualListBlock                →  DualListBlock
              ├── testimonialBlock             →  TestimonialBlock (existing)
              ├── whatsappQuoteBlock           →  WhatsAppQuoteBlock
              └── ctaBlock                     →  CtaBlock (existing)
```

---

## Constraints

- Visual output must be identical to current page — no design changes
- `BizMobileBundleCard.tsx` is reused as the card renderer, not rewritten
- `CONTACT.WHATSAPP_NUMBER` / `CONTACT.EMAIL_PRIMARY` remain the source of truth for contact details; `whatsappQuoteBlock.phoneNumber` overrides only when explicitly set
- All new block types must pass TypeScript strict mode
- `npm run type-check:memory` must pass before marking implementation complete
- `BizMobilePromoBanner` returns `null` when `promoBanner` is absent from Sanity, when `enabled` is false, or when `endsAt` is in the past — all three cases must be handled
- New block schemas must spread `...blockFields` (anchorId, theme, paddingTop, paddingBottom, hideOn) for consistency with existing blocks
