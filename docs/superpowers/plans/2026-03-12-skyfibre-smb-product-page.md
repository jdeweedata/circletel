# SkyFibre SMB Product Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `/products/skyfibre-smb` product page with 3 pricing tiers using existing Sanity CMS infrastructure.

**Architecture:** Update PricingBlock component to support Sanity schema field names, add BlockRenderer to product page template, then seed content via script.

**Tech Stack:** Next.js 15, Sanity CMS, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-12-skyfibre-smb-product-page-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `components/sanity/blocks/PricingBlock.tsx` | Support Sanity schema field names + speed display |
| Modify | `app/products/[slug]/page.tsx` | Add BlockRenderer for blocks array |
| Create | `scripts/seed-skyfibre-smb.ts` | Seed Sanity content for SkyFibre SMB product |

---

## Chunk 1: PricingBlock Component Update

### Task 1.1: Update PricingBlock Interface

**Files:**
- Modify: `components/sanity/blocks/PricingBlock.tsx:8-28`

- [ ] **Step 1: Update the PricingTier interface to support both old and Sanity field names**

```typescript
interface PricingPlan {
  _key: string;
  name: string;
  price: number;
  originalPrice?: number;  // For strikethrough pricing
  speed?: string;          // e.g., "100/25 Mbps"
  period?: string;
  description?: string;
  features: string[];
  // Support both formats
  cta?: { label: string; href: string };
  ctaLabel?: string;
  ctaUrl?: string;
  badge?: string;
  featured?: boolean;
  isPopular?: boolean;  // Sanity uses isPopular
}

interface PricingBlockProps {
  // Support both old and Sanity field names
  title?: string;
  headline?: string;
  subtitle?: string;
  description?: string;
  tiers?: PricingPlan[];
  plans?: PricingPlan[];
  footnote?: string;
  showAnnualToggle?: boolean;
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | head -50`
Expected: May have errors until implementation is updated

- [ ] **Step 3: Commit interface changes**

```bash
git add components/sanity/blocks/PricingBlock.tsx
git commit -m "refactor(PricingBlock): update interface to support Sanity schema fields"
```

---

### Task 1.2: Update PricingBlock Implementation

**Files:**
- Modify: `components/sanity/blocks/PricingBlock.tsx:30-136`

- [ ] **Step 1: Update component to normalize props and render speed + originalPrice**

Replace the entire component function with:

```typescript
export function PricingBlock({
  title,
  headline,
  subtitle,
  description,
  tiers,
  plans,
  footnote,
  showAnnualToggle = false,
}: PricingBlockProps) {
  // Normalize field names (support both old and Sanity formats)
  const displayTitle = title || headline;
  const displaySubtitle = subtitle || description;
  const displayPlans = plans || tiers || [];

  return (
    <section className="py-16 md:py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(displayTitle || displaySubtitle) && (
          <div className="text-center mb-12">
            {displayTitle && (
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {displayTitle}
              </h2>
            )}
            {displaySubtitle && (
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {displaySubtitle}
              </p>
            )}
          </div>
        )}

        {/* Pricing Grid */}
        <div className={cn(
          'grid gap-6 md:gap-8 max-w-6xl mx-auto',
          displayPlans.length === 2 && 'md:grid-cols-2',
          displayPlans.length === 3 && 'md:grid-cols-3',
          displayPlans.length >= 4 && 'md:grid-cols-2 lg:grid-cols-4'
        )}>
          {displayPlans.map((plan) => {
            // Normalize plan fields
            const isFeatured = plan.featured || plan.isPopular;
            const ctaLabel = plan.cta?.label || plan.ctaLabel || 'Get Started';
            const ctaHref = plan.cta?.href || plan.ctaUrl || '#';

            return (
              <div
                key={plan._key}
                className={cn(
                  'relative bg-white rounded-2xl p-6 md:p-8 transition-all duration-200',
                  isFeatured
                    ? 'ring-2 ring-circleTel-orange shadow-xl md:scale-105 z-10'
                    : 'shadow-lg hover:shadow-xl border border-slate-100'
                )}
              >
                {/* Badge */}
                {(plan.badge || isFeatured) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-circleTel-orange text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      {plan.badge || 'Most Popular'}
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="font-heading text-xl font-semibold text-slate-900 mb-1">
                  {plan.name}
                </h3>

                {/* Speed (if provided) */}
                {plan.speed && (
                  <p className="text-sm font-medium text-circleTel-orange mb-3">
                    {plan.speed}
                  </p>
                )}

                {/* Description */}
                {plan.description && (
                  <p className="text-sm text-slate-600 mb-4">
                    {plan.description}
                  </p>
                )}

                {/* Price */}
                <div className="mb-6">
                  {plan.originalPrice && (
                    <span className="text-lg text-slate-400 line-through mr-2">
                      R{plan.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="font-heading text-4xl md:text-5xl font-bold text-slate-900">
                    R{plan.price.toLocaleString()}
                  </span>
                  <span className="text-slate-600">/{plan.period || 'mo'}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <PiCheckBold className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  asChild
                  className={cn(
                    'w-full',
                    isFeatured
                      ? 'bg-circleTel-orange hover:bg-circleTel-orange/90 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  )}
                >
                  <Link href={ctaHref}>
                    {ctaLabel}
                    <PiArrowRightBold className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footnote */}
        {footnote && (
          <p className="text-center text-sm text-slate-500 mt-8 max-w-2xl mx-auto">
            {footnote}
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | head -30`
Expected: PASS (no type errors)

- [ ] **Step 3: Commit implementation**

```bash
git add components/sanity/blocks/PricingBlock.tsx
git commit -m "feat(PricingBlock): support Sanity schema fields, add speed and footnote display"
```

---

## Chunk 2: Product Page Template Update

### Task 2.1: Add BlockRenderer to Product Page

**Files:**
- Modify: `app/products/[slug]/page.tsx`

- [ ] **Step 1: Add BlockRenderer import at top of file (after line 30)**

```typescript
import { BlockRenderer } from '@/components/sanity/BlockRenderer';
```

- [ ] **Step 2: Add blocks rendering after Specifications section (around line 250, before WhyCircleTel)**

Find the closing `</section>` for the Specifications section and add after it:

```typescript
      {/* Additional Blocks (Pricing Tiers, etc.) */}
      {product.blocks && product.blocks.length > 0 && (
        <BlockRenderer sections={product.blocks} />
      )}
```

- [ ] **Step 3: Run type check**

Run: `npm run type-check:memory 2>&1 | head -30`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/products/[slug]/page.tsx
git commit -m "feat(products): render Sanity blocks on product pages"
```

---

## Chunk 3: Sanity Content Seeding Script

### Task 3.1: Create Sanity Seeding Script

**Files:**
- Create: `scripts/seed-skyfibre-smb.ts`

- [ ] **Step 1: Create the seeding script**

```typescript
/**
 * Seed SkyFibre SMB product page content to Sanity
 *
 * Usage: npx tsx scripts/seed-skyfibre-smb.ts
 *
 * Requires: SANITY_API_TOKEN environment variable
 */

import { writeClient } from '../lib/sanity/client';

const SKYFIBRE_SMB_PRODUCT = {
  _type: 'productPage',
  _id: 'productPage-skyfibre-smb', // Deterministic ID for idempotent upserts
  name: 'SkyFibre SMB',
  slug: { _type: 'slug', current: 'skyfibre-smb' },
  category: 'business',
  tagline: 'Business-grade wireless broadband that works as hard as you do',
  pricing: {
    startingPrice: 1299,
    priceNote: '/mo',
    showContactForPricing: false,
  },
  keyFeatures: [
    {
      _key: 'feature-1',
      title: 'Truly Uncapped',
      description: 'No fair usage throttling. Use as much as you need without speed reductions.',
      icon: 'wifi',
    },
    {
      _key: 'feature-2',
      title: 'Static IP Included',
      description: 'Public static IP for remote access, VPNs, and hosted services.',
      icon: 'globe',
    },
    {
      _key: 'feature-3',
      title: 'No Lock-in',
      description: 'Month-to-month flexibility. No 24-month contracts required.',
      icon: 'receipt',
    },
    {
      _key: 'feature-4',
      title: 'Business SLA',
      description: 'Named account manager and guaranteed response times.',
      icon: 'shield',
    },
  ],
  specifications: [
    { _key: 'spec-1', label: 'Technology', value: 'MTN Tarana G1 Fixed Wireless' },
    { _key: 'spec-2', label: 'Spectrum', value: 'Licensed (MTN managed)' },
    { _key: 'spec-3', label: 'Latency', value: '< 5 ms typical' },
    { _key: 'spec-4', label: 'Speed Ratio', value: '4:1 download to upload' },
    { _key: 'spec-5', label: 'Coverage', value: '6 million+ homes nationally' },
    { _key: 'spec-6', label: 'Contention', value: '8:1 (business grade)' },
  ],
  blocks: [
    {
      _type: 'pricingBlock',
      _key: 'pricing-tiers',
      headline: 'Choose Your Speed',
      description: 'All plans include static IP, truly uncapped data, and business support.',
      plans: [
        {
          _key: 'tier-50',
          name: 'Business 50',
          speed: '50/12.5 Mbps',
          price: 1299,
          isPopular: false,
          features: [
            'Static IP included',
            'Truly uncapped (no FUP)',
            'Basic business support',
            'Month-to-month',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=skyfibre-smb&tier=50',
        },
        {
          _key: 'tier-100',
          name: 'Business 100',
          speed: '100/25 Mbps',
          price: 1499,
          isPopular: true,
          features: [
            'Static IP included',
            'Truly uncapped (no FUP)',
            'Basic business support',
            'Month-to-month',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=skyfibre-smb&tier=100',
        },
        {
          _key: 'tier-200',
          name: 'Business 200',
          speed: '200/50 Mbps',
          price: 1899,
          isPopular: false,
          features: [
            'Static IP included',
            'Truly uncapped (no FUP)',
            'Basic business support',
            'Month-to-month',
          ],
          ctaLabel: 'Get Started',
          ctaUrl: '/order/coverage?product=skyfibre-smb&tier=200',
        },
      ],
      footnote: 'All prices exclude VAT. Installation included on 12+ month terms.',
    },
  ],
  seo: {
    title: 'SkyFibre SMB - Business Wireless Broadband | CircleTel',
    description: 'Business-grade fixed wireless broadband from R1,299/mo. Truly uncapped, static IP included, no lock-in contracts. Powered by MTN Tarana G1.',
  },
};

async function seedSkyFibreSMB() {
  console.log('Seeding SkyFibre SMB product to Sanity...');

  if (!process.env.SANITY_API_TOKEN) {
    console.error('ERROR: SANITY_API_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const result = await writeClient.createOrReplace(SKYFIBRE_SMB_PRODUCT);
    console.log('SUCCESS: SkyFibre SMB product created/updated');
    console.log('Document ID:', result._id);
    console.log('View at: https://circletel.sanity.studio/structure/productPage;' + result._id);
  } catch (error) {
    console.error('ERROR: Failed to seed SkyFibre SMB product');
    console.error(error);
    process.exit(1);
  }
}

seedSkyFibreSMB();
```

- [ ] **Step 2: Run type check on the script**

Run: `npx tsc scripts/seed-skyfibre-smb.ts --noEmit --esModuleInterop --moduleResolution node --target ES2020 2>&1 | head -20`
Expected: PASS or only minor warnings

- [ ] **Step 3: Commit script**

```bash
git add scripts/seed-skyfibre-smb.ts
git commit -m "feat: add Sanity seeding script for SkyFibre SMB product"
```

---

### Task 3.2: Run Seeding Script

**Prerequisites:** SANITY_API_TOKEN must be set in environment

- [ ] **Step 1: Run the seeding script**

Run: `npx tsx scripts/seed-skyfibre-smb.ts`
Expected: "SUCCESS: SkyFibre SMB product created/updated"

- [ ] **Step 2: Verify in Sanity Studio (optional)**

Open: https://circletel.sanity.studio/structure/productPage
Expected: SkyFibre SMB document visible with all fields populated

---

## Chunk 4: Verification

### Task 4.1: Type Check and Build

- [ ] **Step 1: Run full type check**

Run: `npm run type-check:memory`
Expected: No errors

- [ ] **Step 2: Start dev server**

Run: `npm run dev:memory &`
Expected: Server starts on localhost:3000

- [ ] **Step 3: Test product page loads**

Run: `curl -s http://localhost:3000/products/skyfibre-smb | head -50`
Expected: HTML containing "SkyFibre SMB" (not "Product Not Found")

---

### Task 4.2: Visual Verification Checklist

Open `http://localhost:3000/products/skyfibre-smb` in browser and verify:

- [ ] Hero section displays with product name and tagline
- [ ] Pricing bar shows "From R1,299/mo"
- [ ] 4 Key Features cards render with icons
- [ ] 3 Pricing tier cards display with correct prices
- [ ] "Most Popular" badge appears on Business 100 tier
- [ ] CTAs link to `/order/coverage?product=skyfibre-smb&tier=X`
- [ ] Specifications table shows 6 rows
- [ ] "How It Works" section renders
- [ ] "Why CircleTel" section renders
- [ ] Footer displays
- [ ] Mobile responsive (test at 375px width)

---

### Task 4.3: Final Commit

- [ ] **Step 1: Stop dev server**

Run: `pkill -f "next dev" || true`

- [ ] **Step 2: Create final commit if any uncommitted changes**

```bash
git status
# If changes exist:
git add -A
git commit -m "feat: complete SkyFibre SMB product page implementation"
```

---

## Success Criteria

| Criterion | Verification |
|-----------|--------------|
| Page loads without 404 | `curl` returns HTML |
| 3 pricing tiers displayed | Visual check |
| "Most Popular" on Business 100 | Visual check |
| CTAs link correctly | Click test |
| Key features render | Visual check |
| Specs table displays | Visual check |
| SEO metadata correct | View source |
| Mobile responsive | DevTools test |

---

**Plan complete.** Ready to execute?
