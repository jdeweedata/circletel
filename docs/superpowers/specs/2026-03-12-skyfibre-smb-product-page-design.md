# SkyFibre SMB Product Page Design

## Overview

Create the `/products/skyfibre-smb` product page using existing Sanity CMS infrastructure with the `pricingBlock` for displaying pricing tiers.

| Field | Value |
|-------|-------|
| **Date** | 2026-03-12 |
| **Status** | Approved |
| **Approach** | Use existing `pricingBlock` schema and component |

---

## Architecture

### Existing Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| `productPage` schema | `lib/sanity/schemas/documents/productPage.ts` | Sanity document type |
| `PricingBlock` component | `components/sanity/blocks/PricingBlock.tsx` | Renders pricing tier cards |
| `BlockRenderer` | `components/sanity/BlockRenderer.tsx` | Renders blocks from Sanity |
| `blockRegistry` | `components/sanity/blocks/index.ts` | Maps block types to components |
| Product page template | `app/products/[slug]/page.tsx` | Dynamic product page |

### Gap Identified

The product page template does not render the `blocks` array from Sanity. It only renders fixed sections (hero, features, specs).

### Solution

1. Add `<BlockRenderer sections={product.blocks} />` to product page
2. Align `PricingBlock` component props with Sanity schema field names
3. Create SkyFibre SMB content in Sanity with `pricingBlock`

---

## Component Updates

### PricingBlock Prop Alignment

The Sanity `pricingBlock` schema uses different field names than the React component:

| Sanity Schema Field | Current Component | Required Change |
|---------------------|-------------------|-----------------|
| `plans[]` | `tiers[]` | Support both (alias) |
| `plan.isPopular` | `tier.featured` | Support both |
| `plan.speed` | (missing) | Add speed display under name |
| `plan.ctaLabel` + `plan.ctaUrl` | `tier.cta: {label, href}` | Transform in component |
| `plan.originalPrice` | (missing) | Add strikethrough price |
| `headline` | `title` | Support both |
| `description` | `subtitle` | Support both |
| `footnote` | (missing) | Add footnote display |

### Product Page Change

```tsx
// app/products/[slug]/page.tsx
// After Specifications section, before WhyCircleTel

{product.blocks && product.blocks.length > 0 && (
  <BlockRenderer sections={product.blocks} />
)}
```

---

## Sanity Content Structure

### Product Document: SkyFibre SMB

| Field | Value |
|-------|-------|
| **name** | SkyFibre SMB |
| **slug** | `skyfibre-smb` |
| **category** | `business` |
| **tagline** | Business-grade wireless broadband that works as hard as you do |
| **pricing.startingPrice** | 1299 |
| **pricing.priceNote** | /mo |
| **heroImage** | (TBD - business office with connectivity theme) |

### Pricing Block Content

**Headline:** Choose Your Speed

**Plans:**

| Name | Speed | Price | isPopular | Features |
|------|-------|-------|-----------|----------|
| Business 50 | 50/12.5 Mbps | R1,299 | false | Static IP included, Truly uncapped (no FUP), Basic business support, Month-to-month |
| Business 100 | 100/25 Mbps | R1,499 | true | Static IP included, Truly uncapped (no FUP), Basic business support, Month-to-month |
| Business 200 | 200/50 Mbps | R1,899 | false | Static IP included, Truly uncapped (no FUP), Basic business support, Month-to-month |

**Footnote:** All prices exclude VAT. Installation included on 12+ month terms.

**CTA URLs:** `/order/coverage?product=skyfibre-smb&tier={tier}`

### Key Features (4 cards)

| Icon | Title | Description |
|------|-------|-------------|
| wifi | Truly Uncapped | No fair usage throttling. Use as much as you need without speed reductions. |
| globe | Static IP Included | Public static IP for remote access, VPNs, and hosted services. |
| receipt | No Lock-in | Month-to-month flexibility. No 24-month contracts required. |
| shield | Business SLA | Named account manager and guaranteed response times. |

### Specifications

| Label | Value |
|-------|-------|
| Technology | MTN Tarana G1 Fixed Wireless |
| Spectrum | Licensed (MTN managed) |
| Latency | < 5 ms typical |
| Speed Ratio | 4:1 download to upload |
| Coverage | 6 million+ homes nationally |
| Contention | 8:1 (business grade) |

### SEO

| Field | Value |
|-------|-------|
| title | SkyFibre SMB - Business Wireless Broadband | CircleTel |
| description | Business-grade fixed wireless broadband from R1,299/mo. Truly uncapped, static IP included, no lock-in contracts. Powered by MTN Tarana G1. |

### Related Products

- WorkConnect SOHO
- BizFibreConnect
- CloudWiFi WaaS

---

## Implementation Tasks

1. **Update PricingBlock component** — Align props with Sanity schema
2. **Update product page template** — Add BlockRenderer for blocks array
3. **Create Sanity content** — Add SkyFibre SMB product with all fields
4. **Test and verify** — Confirm page renders at `/products/skyfibre-smb`

---

## Success Criteria

- [ ] `/products/skyfibre-smb` loads without 404
- [ ] 3 pricing tiers displayed with correct prices
- [ ] "Most Popular" badge on Business 100
- [ ] CTAs link to `/order/coverage?product=skyfibre-smb`
- [ ] Key features section renders 4 cards
- [ ] Specifications table displays
- [ ] SEO metadata correct
- [ ] Mobile responsive

---

**Approved:** 2026-03-12
