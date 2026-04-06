# BizFibreConnect Product Page — Design Spec

**Date**: 2026-04-06
**Route**: `/products/bizfibreconnect`
**Approach**: CMS-driven via Sanity `productPage` document + seed script

---

## Overview

Create the BizFibreConnect product page using the existing dynamic `app/products/[slug]/page.tsx` template. Content is seeded programmatically into Sanity via a one-time TypeScript seed script. Two schema changes are required to unlock additional block types for this product.

BizFibreConnect is an enterprise DFA Dark Fibre product targeting business customers (R1,899–R7,999+/mo). The layout is enterprise-focused (Option B): standard product template sections plus a Trust Strip, Pricing Grid, and WhatsApp Quote block for B2B conversion.

---

## Page Structure

| Order | Section | Source | Content |
|-------|---------|--------|---------|
| 1 | Hero | `productPage` template | Dark fibre imagery, tagline, 2 CTAs (Get Started + WhatsApp) |
| 2 | Pricing bar | `productPage` template | "Starting from R1,899/mo" |
| 3 | Key Features | `productPage` template | 4 feature cards with icons |
| 4 | How It Works | `ProductHowItWorks` component | Coverage check → Choose plan → Get connected |
| 5 | Specifications | `productPage` template | Speed tiers, SLA, tech specs table |
| 6 | Trust Strip | `TrustStripBlock` via blocks | SLA %, latency, NOC monitoring badges |
| 7 | Pricing Grid | `PricingBlock` via blocks | 4 standard tiers + Enterprise full-width banner |
| 8 | WhatsApp Quote | `WhatsAppQuoteBlock` via blocks | B2B inquiry CTA |
| 9 | Why CircleTel | `WhyCircleTel` component | Existing shared component |
| 10 | Final CTA | `productPage` template | Orange strip — "Check Coverage" + "Talk to Sales" |
| 11 | Related Products | `productPage` template | skyfibre-smb, workconnect-soho, cloudwifi |

---

## Schema Changes

### 1. New schema: `sanity-studio/schemas/blocks/trustStripBlock.ts`

`TrustStripBlock` component takes `badges: [{ _key, icon, text }]` (Material Symbols icon name + badge text). No existing Sanity schema — must be created.

Fields:
- `badges` (array of objects): `icon` (string — Material Symbols name), `text` (string — badge label)

### 2. New schema: `sanity-studio/schemas/blocks/whatsappQuoteBlock.ts`

`WhatsAppQuoteBlock` takes `eyebrow`, `headline`, `description`, `bundleOptions` (string[]), `phoneNumber` (optional override). No existing Sanity schema — must be created.

Fields:
- `eyebrow` (string)
- `headline` (string)
- `description` (text)
- `bundleOptions` (array of strings — shown as dropdown in the form)
- `phoneNumber` (string, optional — overrides `CONTACT.WHATSAPP_LINK`)

### 3. Register both in `sanity-studio/schemas/index.ts`

Import and add both new schemas to `schemaTypes`.

### 4. Update `sanity-studio/schemas/productPage.ts`

Add three block types to the `blocks` field's `of` array:

```ts
defineArrayMember({ type: 'pricingBlock' }),
defineArrayMember({ type: 'trustStripBlock' }),
defineArrayMember({ type: 'whatsappQuoteBlock' }),
```

---

## Seed Script

File: `scripts/seed-bizfibreconnect.ts`

Uses `@sanity/client` with the write token from `SANITY_API_TOKEN`. Performs:
1. Looks up related product document IDs by slug (`skyfibre-smb`, `workconnect-soho`, `cloudwifi`)
2. Upserts the `productPage` document with `_id: 'bizfibreconnect'`
3. Logs success/failure

### Product Document Fields

| Field | Value |
|-------|-------|
| `_type` | `productPage` |
| `_id` | `bizfibreconnect` |
| `name` | BizFibreConnect |
| `slug.current` | `bizfibreconnect` |
| `category` | `business` |
| `tagline` | Dedicated dark fibre for businesses that demand reliability |
| `pricing.startingPrice` | 1899 |
| `pricing.priceNote` | per month |
| `pricing.showContactForPricing` | false |
| `heroImage` | *(not seeded — to be uploaded in Studio)* |

### Key Features (4)

| Title | Description | Icon |
|-------|-------------|------|
| Symmetric Speeds | Upload equals download on every tier — no throttling | `arrow-up` |
| 99.9% SLA Guarantee | Guaranteed uptime backed by DFA infrastructure | `shield` |
| Dedicated Fibre | Your own fibre connection, not shared with neighbours | `globe` |
| Business-Grade Support | Priority NOC monitoring and dedicated account management | `phone` |

### Specifications

| Label | Value |
|-------|-------|
| Technology | DFA Dark Fibre |
| Speed Tiers | 25/25 · 50/50 · 100/100 · 200/200 Mbps |
| Speed Type | Symmetric (equal upload & download) |
| Uptime SLA | 99.9% |
| IP Addressing | Static IP included |
| Contract Terms | 12 or 24 months |

### Blocks

**Block 1 — TrustStripBlock**
```
_type: trustStripBlock
badges: [
  { icon: "verified", text: "99.9% Uptime SLA" },
  { icon: "speed",    text: "<10ms Latency" },
  { icon: "support_agent", text: "24/7 NOC Monitoring" },
  { icon: "swap_vert", text: "Symmetric Speeds" },
]
```

**Block 2 — PricingBlock**
```
_type: pricingBlock
headline: "Choose Your BizFibreConnect Plan"
description: "Symmetric dark fibre at every speed tier. All prices exclude VAT."
plans: [
  { name: "BizFibre 25",  speed: "25/25 Mbps",   price: 1899, features: [...], ctaLabel: "Get Started", ctaUrl: "/" },
  { name: "BizFibre 50",  speed: "50/50 Mbps",   price: 2499, features: [...], ctaLabel: "Get Started", ctaUrl: "/" },
  { name: "BizFibre 100", speed: "100/100 Mbps", price: 2999, isPopular: true, features: [...], ctaLabel: "Get Started", ctaUrl: "/" },
  { name: "BizFibre 200", speed: "200/200 Mbps", price: 4499, features: [...], ctaLabel: "Get Started", ctaUrl: "/" },
  { name: "Enterprise",   speed: "1Gbps+",       price: 7999, isEnterprise: true, features: [...], ctaLabel: "Contact Sales", ctaUrl: "https://wa.me/27824873900" },
]
footnote: "All prices exclude VAT. Installation included on 24-month contracts."
```

**Block 3 — WhatsAppQuoteBlock**
```
_type: whatsappQuoteBlock
eyebrow: "Get a Quote in 2 Minutes"
headline: "Need a Custom Enterprise Solution?"
description: "Our business team will tailor a BizFibreConnect plan for your requirements."
bundleOptions: [
  "BizFibre 25 — 25/25 Mbps (R1,899/mo)",
  "BizFibre 50 — 50/50 Mbps (R2,499/mo)",
  "BizFibre 100 — 100/100 Mbps (R2,999/mo)",
  "BizFibre 200 — 200/200 Mbps (R4,499/mo)",
  "Enterprise — 1Gbps+ (custom pricing)",
]
```

### Related Products

Resolved by slug lookup at seed time:
- `skyfibre-smb`
- `workconnect-soho`
- `cloudwifi`

---

## SEO

| Field | Value |
|-------|-------|
| `seo.title` | BizFibreConnect — Dedicated Dark Fibre for Business \| CircleTel |
| `seo.description` | Symmetric dark fibre connectivity via DFA infrastructure. 99.9% SLA, static IP, 25–200 Mbps tiers from R1,899/mo. |

---

## Out of Scope

- Hero image (uploaded manually in Sanity Studio after seeding)
- Blog/resource content about dark fibre
- Admin dashboard integration
- Any change to `app/products/[slug]/page.tsx`

---

## Files Changed

| File | Change |
|------|--------|
| `sanity-studio/schemas/blocks/trustStripBlock.ts` | New — Sanity schema for TrustStripBlock |
| `sanity-studio/schemas/blocks/whatsappQuoteBlock.ts` | New — Sanity schema for WhatsAppQuoteBlock |
| `sanity-studio/schemas/index.ts` | Register both new schemas |
| `sanity-studio/schemas/productPage.ts` | Add `pricingBlock`, `trustStripBlock`, `whatsappQuoteBlock` to blocks |
| `scripts/seed-bizfibreconnect.ts` | New — one-time seed script |
