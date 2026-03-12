---
name: product-page-builder
description: Build CircleTel product pages with Sanity CMS, Gemini hero images, and conversion-optimized layouts. Streamlined workflow from concept to live page.
version: 1.0.0
dependencies: gemini-imagegen, brand-design
---

# Product Page Builder

Build complete, conversion-optimized product pages for CircleTel using Sanity CMS.

## When to Use This Skill

Invoke `/product-page` or use this skill when:
- Creating a new product page (e.g., `/products/new-product`)
- Adding pricing tiers to an existing product
- Generating hero images for products
- Troubleshooting product page display issues

**Keywords**: product page, new product, create product, sanity product, hero image, pricing tiers, product launch

## Quick Start

```bash
/product-page [product-name]
```

Example: `/product-page skyfibre-enterprise`

## The Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. GATHER    →  2. GENERATE   →  3. SEED    →  4. VERIFY  │
│  Product info    Hero image       Sanity data    Live page │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Gather Product Information

Collect these details before starting:

| Field | Required | Example |
|-------|----------|---------|
| Product name | ✅ | "SkyFibre Enterprise" |
| Slug | ✅ | "skyfibre-enterprise" |
| Category | ✅ | consumer / soho / business / enterprise |
| Tagline | ✅ | "Enterprise-grade connectivity for growing businesses" |
| Target customer | ✅ | "Businesses with 50-200 employees" |
| Starting price | ✅ | R2,499/mo |
| Pricing tiers | Recommended | 3-4 tiers with features |
| Key features | Recommended | 4 features with icons |
| Specifications | Optional | Technical specs table |

### Pricing Tier Template

```typescript
{
  _key: 'tier-1',
  name: 'Business 100',
  speed: '100/50 Mbps',
  price: 1499,
  originalPrice: 1699,  // Optional strikethrough
  period: 'mo',
  badge: 'Most Popular',  // Optional
  featured: true,  // Highlights this tier
  features: [
    'Uncapped data',
    '4:1 contention',
    'Static IP included',
    '24/7 support',
  ],
  ctaLabel: 'Get Started',
  ctaUrl: '/order/coverage?product=product-slug&tier=business-100',
}
```

### Icon Options for Features

Available icons (from `react-icons/pi`):
- `shield` - Security features
- `phone` - Voice/communication
- `globe` - Internet/connectivity
- `message-circle` - Support/chat
- `wifi` - Wireless
- `router` - Hardware/CPE
- `receipt` - Billing
- `arrow-up` - Speed/performance
- `layout` - Dashboard/portal
- `chart` - Analytics
- `sim-card` - Mobile/LTE

---

## Step 2: Generate Hero Image

Use Gemini to generate a professional hero image.

### Environment Setup

```bash
export GEMINI_API_KEY=$(grep "^GEMINI_API_KEY" .env.local | cut -d'=' -f2)
```

### Prompt Template

Customize this template for your product:

```
A photorealistic wide-angle shot of [TARGET CUSTOMER ENVIRONMENT]
with [PEOPLE DESCRIPTION] in a modern setting.
The scene features [ENVIRONMENT DETAILS] with warm lighting.
In the background, subtle visual elements suggest connectivity -
[TECHNOLOGY ELEMENTS like routers, wireless signals].
The color palette emphasizes professional navy blue tones with
warm orange accent lighting from modern fixtures.
Natural daylight streams through large windows, creating an
optimistic, productive atmosphere.
Shot with a 24mm wide-angle lens, f/2.8, commercial photography quality.
No text or logos visible.
```

### Example Prompts by Category

**Business/SMB:**
```
A photorealistic wide-angle shot of a modern small business office
with a diverse team of professionals collaborating around a conference table...
```

**Enterprise:**
```
A photorealistic shot of a corporate data center or executive boardroom
with IT professionals monitoring network dashboards on large screens...
```

**Consumer/SOHO:**
```
A photorealistic shot of a modern home office with a professional
working remotely, high-speed internet enabling video calls...
```

### Generation Settings

```python
config=types.GenerateContentConfig(
    response_modalities=['TEXT', 'IMAGE'],
    image_config=types.ImageConfig(
        aspect_ratio="16:9",  # Hero images
        image_size="2K"       # Good quality
    ),
)
```

### Save Location

```
/public/images/products/[product-slug]-hero.jpg
```

---

## Step 3: Seed to Sanity

### Sanity Configuration

**CRITICAL - Use correct project ID:**

```typescript
const client = createClient({
  projectId: '7iqq2t7l',  // CircleTel Sanity project
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});
```

### Seed Script Template

Create `scripts/seed-[product-name].ts`:

```typescript
import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';

const client = createClient({
  projectId: '7iqq2t7l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function seedProduct() {
  // 1. Upload hero image
  const imageBuffer = readFileSync('/home/circletel/public/images/products/[slug]-hero.jpg');
  const asset = await client.assets.upload('image', imageBuffer, {
    filename: '[slug]-hero.jpg',
  });
  console.log('Image uploaded:', asset._id);

  // 2. Create or update product
  const product = {
    _id: 'productPage-[slug]',
    _type: 'productPage',
    name: 'Product Name',
    slug: { _type: 'slug', current: '[slug]' },
    category: 'business',
    tagline: 'Your tagline here',
    heroImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
    },
    pricing: {
      startingPrice: 1299,
      priceNote: '/mo',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'feature-1',
        title: 'Feature Title',
        description: 'Feature description',
        icon: 'wifi',
      },
      // ... more features
    ],
    specifications: [
      { _key: 'spec-1', label: 'Technology', value: 'Fixed Wireless' },
      // ... more specs
    ],
    blocks: [
      {
        _type: 'pricingBlock',
        _key: 'pricing-block',
        headline: 'Choose Your Speed',
        description: 'Select the plan that fits your business needs.',
        plans: [
          // Pricing tiers here
        ],
        footnote: 'All prices exclude VAT. 24-month contract.',
      },
    ],
    seo: {
      title: 'Product Name | CircleTel',
      description: 'SEO description here',
    },
  };

  await client.createOrReplace(product);
  console.log('Product created:', product._id);
}

seedProduct().catch(console.error);
```

### Run the Seed Script

```bash
export SANITY_API_TOKEN=$(grep "^SANITY_API_TOKEN" .env.local | cut -d'=' -f2)
npx tsx scripts/seed-[product-name].ts
```

---

## Step 4: Verify & Troubleshoot

### Verification Checklist

```
[ ] Page loads at /products/[slug]
[ ] Hero image displays correctly
[ ] Pricing bar shows starting price
[ ] Pricing tiers render (if added)
[ ] Key features display with icons
[ ] "How It Works" section shows
[ ] "Why CircleTel" section shows
[ ] CTA buttons work
[ ] Mobile responsive
[ ] No console errors
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Pricing tiers not showing | `pricingBlock` not in schema | Add to `productPage.blocks` in schema |
| Colors not rendering | CSS variable issue | Use explicit hex `#F5831F` |
| Hero image missing | Wrong Sanity project ID | Use `7iqq2t7l` |
| 404 on product page | Slug mismatch | Check `slug.current` matches URL |
| Console duplicate key error | Navigation data conflict | Remove duplicate hrefs from NavigationData.ts |

### Ensure pricingBlock is Allowed

Check `lib/sanity/schemas/documents/productPage.ts`:

```typescript
defineField({
  name: 'blocks',
  type: 'array',
  of: [
    defineArrayMember({ type: 'pricingBlock' }),  // Must be present!
    // ... other blocks
  ],
}),
```

---

## Page Structure Reference

The product page renders in this order:

1. **Hero Section** - Full-width image with overlay, title, tagline, CTAs
2. **Pricing Bar** - Starting price + "Check Coverage" button
3. **Key Features** - 4-column grid with icons
4. **How It Works** - 3-step cards (Check Coverage → Choose Plan → Get Connected)
5. **Specifications** - Technical specs table
6. **Pricing Tiers** - From `pricingBlock` in blocks array
7. **Why CircleTel** - Trust signals (Local Support, No Lock-in, Fast Install)
8. **CTA Section** - Orange background with dual CTAs
9. **Related Products** - Optional, from `relatedProducts` field

---

## Button Styling Reference

```tsx
// Primary CTA (light background)
className="bg-[#F5831F] hover:bg-[#e0721a] text-white"

// Secondary CTA (light background)
className="bg-[#25D366] hover:bg-[#1da851] text-white"  // WhatsApp

// CTA on dark background
className="bg-white text-slate-900 hover:bg-slate-100"

// Outline on dark background
className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900"
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `app/products/[slug]/page.tsx` | Product page template |
| `lib/sanity/schemas/documents/productPage.ts` | Sanity schema |
| `lib/sanity/queries/products.ts` | GROQ queries |
| `components/sanity/blocks/PricingBlock.tsx` | Pricing tier component |
| `components/products/ProductHowItWorks.tsx` | How it works section |
| `components/products/WhyCircleTel.tsx` | Trust signals section |
| `components/sanity/BlockRenderer.tsx` | Renders Sanity blocks |

---

## Related Learnings

- Full implementation details: `.claude/skills/compound-learnings/learnings/2026-03-12_skyfibre-smb-product-page.md`
- Brand guidelines: `.claude/skills/brand-design/SKILL.md`
- Image generation: `.claude/skills/gemini-imagegen/`
