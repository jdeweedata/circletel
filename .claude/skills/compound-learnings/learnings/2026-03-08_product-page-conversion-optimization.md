# Product Page Conversion Optimization

**Date**: 2026-03-08
**Source**: Vodacom vs CircleTel design comparison
**Time Saved**: ~30 min per new product page

---

## Context

Analyzed Vodacom's product page structure against CircleTel's to identify conversion optimization opportunities. Implemented improvements based on proven patterns.

## Optimal Product Page Section Order

```
1. Hero (full-width image, left-aligned text, dual CTAs)
2. Pricing Bar (starting price + CTA)
3. Pricing Tiers Comparison* (if product has multiple tiers)
4. Key Features (4-column icon cards)
5. How It Works (3-step process) ← NEW
6. Specifications (technical details table)
7. Why CircleTel? (value props) ← NEW
8. CTA Section (orange background)
9. Related Products (3-column cards)

* Requires Sanity schema update for pricingTiers
```

## New Components Created

### ProductHowItWorks.tsx

**Location**: `components/products/ProductHowItWorks.tsx`

**Purpose**: Reduces friction by showing simplicity of getting connected

**Steps**:
1. Check Coverage (map pin icon)
2. Choose Your Plan (list icon)
3. Get Connected (wifi icon)

**Props**:
```typescript
interface ProductHowItWorksProps {
  productSlug?: string; // For CTA link customization
}
```

### WhyCircleTel.tsx

**Location**: `components/products/WhyCircleTel.tsx`

**Purpose**: Brand differentiation (equivalent to Vodacom's "The Vodacom Difference")

**Value Props**:
1. Local Support - SA-based team, WhatsApp access
2. No Lock-in Contracts - Month-to-month available
3. Fast Installation - 3-5 business days

## Conversion Scorecard

| Factor | Vodacom | CircleTel | Winner |
|--------|---------|-----------|--------|
| Pricing Transparency | Strong (comparison tables) | Weak (single price) | Vodacom |
| Plan Comparison | Multiple tiers visible | Not shown | Vodacom |
| Process Clarity | "How to get it" section | Added via component | Tie |
| Support Access | Phone/chat links | WhatsApp button | CircleTel |
| Hero CTAs | Single button | Dual buttons | CircleTel |
| Mobile Experience | Heavy tables | Cleaner cards | CircleTel |

## Sanity Schema Gap

The current `productPage` schema only has:

```typescript
pricing: {
  startingPrice: number;
  priceNote: string;
  showContactForPricing: boolean;
}
```

**Missing**: `pricingTiers` array for tier comparison. Would need migration:

```typescript
pricingTiers: [
  {
    name: string;
    speed: string;
    price: number;
    features: string[];
    highlighted: boolean;
    ctaText: string;
  }
]
```

## Usage

Import and use in any Sanity-driven product page:

```tsx
import { ProductHowItWorks } from '@/components/products/ProductHowItWorks';
import { WhyCircleTel } from '@/components/products/WhyCircleTel';

// After Key Features section
<ProductHowItWorks productSlug={product.slug} />

// After Specifications section
<WhyCircleTel />
```

## Design Decisions

1. **Hardcoded vs CMS**: Value props and process steps are hardcoded because:
   - Brand messaging should be consistent across all products
   - Reduces CMS complexity
   - Faster to iterate on copy

2. **Keep dual CTAs**: WhatsApp + primary CTA provides better support access than Vodacom's single CTA pattern

3. **Keep specifications table**: Adds technical credibility that Vodacom lacks

## Related Files

- `app/products/[slug]/page.tsx` - Main product page template
- `lib/sanity/schemas/documents/productPage.ts` - Sanity schema
- `components/products/PricingComparisonTable.tsx` - Existing pricing comparison (Strapi-based)
