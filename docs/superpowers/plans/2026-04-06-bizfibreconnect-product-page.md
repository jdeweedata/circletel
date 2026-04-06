# BizFibreConnect Product Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `/products/bizfibreconnect` product page by adding two missing Sanity schema files, wiring them into the schema index and productPage, then seeding a complete Sanity document via a TypeScript script.

**Architecture:** The existing `app/products/[slug]/page.tsx` is a dynamic Next.js page that fetches any `productPage` Sanity document by slug — no changes to the page template are needed. We extend the Sanity schema to allow three additional block types (`pricingBlock`, `trustStripBlock`, `whatsappQuoteBlock`) on product pages, then seed the BizFibreConnect document with full content.

**Tech Stack:** Sanity (`@sanity/client` v3, `next-sanity`), TypeScript, Next.js 15, existing `BlockRenderer` and block components.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `sanity-studio/schemas/blocks/trustStripBlock.ts` | **Create** | Sanity schema for the TrustStripBlock component (`badges[]`) |
| `sanity-studio/schemas/blocks/whatsappQuoteBlock.ts` | **Create** | Sanity schema for the WhatsAppQuoteBlock component |
| `sanity-studio/schemas/index.ts` | **Modify** | Register both new schema types |
| `sanity-studio/schemas/productPage.ts` | **Modify** | Add `pricingBlock`, `trustStripBlock`, `whatsappQuoteBlock` to allowed blocks |
| `scripts/seed-bizfibreconnect.ts` | **Create** | One-time seed script — creates the Sanity document |

---

## Task 1: Create `trustStripBlock` Sanity Schema

The `TrustStripBlock` React component (`components/sanity/blocks/TrustStripBlock.tsx`) already exists and accepts `{ badges: [{ _key, icon, text }] }`. The `icon` field is a Material Symbols icon name string (e.g., `"verified"`). This task creates the matching Sanity Studio schema so editors can add/edit trust badges.

**Files:**
- Create: `sanity-studio/schemas/blocks/trustStripBlock.ts`

- [ ] **Step 1: Create the schema file**

```typescript
// sanity-studio/schemas/blocks/trustStripBlock.ts
import { defineType, defineField } from 'sanity';
import { StarIcon } from '@sanity/icons';

export default defineType({
  name: 'trustStripBlock',
  title: 'Trust Strip',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'badges',
      title: 'Trust Badges',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              type: 'string',
              title: 'Material Symbol Icon Name',
              description: 'e.g. "verified", "speed", "support_agent", "swap_vert"',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'text',
              type: 'string',
              title: 'Badge Text',
              description: 'e.g. "99.9% Uptime SLA"',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'text', subtitle: 'icon' },
          },
        },
      ],
      validation: (Rule) => Rule.min(1).max(8),
    }),
  ],
  preview: {
    select: { badges: 'badges' },
    prepare({ badges }) {
      return {
        title: 'Trust Strip',
        subtitle: `${badges?.length || 0} badges`,
      };
    },
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/circletel
npm run type-check:memory 2>&1 | grep -E "error|trustStrip" | head -20
```

Expected: no errors mentioning `trustStripBlock.ts`

- [ ] **Step 3: Commit**

```bash
git add sanity-studio/schemas/blocks/trustStripBlock.ts
git commit -m "feat(sanity): add trustStripBlock schema"
```

---

## Task 2: Create `whatsappQuoteBlock` Sanity Schema

The `WhatsAppQuoteBlock` React component (`components/sanity/blocks/WhatsAppQuoteBlock.tsx`) accepts `{ eyebrow?, headline?, description?, bundleOptions?: string[], phoneNumber? }`. This task creates the matching Sanity Studio schema.

**Files:**
- Create: `sanity-studio/schemas/blocks/whatsappQuoteBlock.ts`

- [ ] **Step 1: Create the schema file**

```typescript
// sanity-studio/schemas/blocks/whatsappQuoteBlock.ts
import { defineType, defineField } from 'sanity';
import { ChatIcon } from '@sanity/icons';

export default defineType({
  name: 'whatsappQuoteBlock',
  title: 'WhatsApp Quote Form',
  type: 'object',
  icon: ChatIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'Small label above the headline (e.g., "Get a Quote in 2 Minutes")',
      initialValue: 'Get a Quote in 2 Minutes',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'bundleOptions',
      title: 'Bundle Options',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Options shown in the "Which plan?" dropdown. Leave empty to hide the dropdown.',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'WhatsApp Number Override',
      type: 'string',
      description: 'Optional. Overrides the global CONTACT.WHATSAPP_LINK. Format: 27824873900',
    }),
  ],
  preview: {
    select: { title: 'headline' },
    prepare({ title }) {
      return {
        title: title || 'WhatsApp Quote Form',
      };
    },
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/circletel
npm run type-check:memory 2>&1 | grep -E "error|whatsappQuote" | head -20
```

Expected: no errors mentioning `whatsappQuoteBlock.ts`

- [ ] **Step 3: Commit**

```bash
git add sanity-studio/schemas/blocks/whatsappQuoteBlock.ts
git commit -m "feat(sanity): add whatsappQuoteBlock schema"
```

---

## Task 3: Register New Schemas and Extend productPage Blocks

Wire both new schemas into the Sanity schema index, and add all three block types (`pricingBlock`, `trustStripBlock`, `whatsappQuoteBlock`) to the `productPage` document's allowed blocks.

**Files:**
- Modify: `sanity-studio/schemas/index.ts`
- Modify: `sanity-studio/schemas/productPage.ts`

- [ ] **Step 1: Update `sanity-studio/schemas/index.ts`**

Add imports after the existing block imports (around line 17), and add to `schemaTypes`:

```typescript
// Add after line 17 (after `import productShowcaseBlock ...`)
import trustStripBlock from './blocks/trustStripBlock';
import whatsappQuoteBlock from './blocks/whatsappQuoteBlock';
```

Add both to the `schemaTypes` array, after `productShowcaseBlock`:

```typescript
  // Blocks
  heroBlock,
  featureGridBlock,
  pricingBlock,
  faqBlock,
  comparisonBlock,
  testimonialBlock,
  productShowcaseBlock,
  trustStripBlock,       // ← add
  whatsappQuoteBlock,    // ← add
```

- [ ] **Step 2: Update `sanity-studio/schemas/productPage.ts` — extend blocks field**

Find the `blocks` field definition (around line 107). The current `of` array is:

```typescript
of: [
  defineArrayMember({ type: 'featureGridBlock' }),
  defineArrayMember({ type: 'faqBlock' }),
  defineArrayMember({ type: 'comparisonBlock' }),
  defineArrayMember({ type: 'testimonialBlock' }),
],
```

Replace with:

```typescript
of: [
  defineArrayMember({ type: 'featureGridBlock' }),
  defineArrayMember({ type: 'faqBlock' }),
  defineArrayMember({ type: 'comparisonBlock' }),
  defineArrayMember({ type: 'testimonialBlock' }),
  defineArrayMember({ type: 'pricingBlock' }),
  defineArrayMember({ type: 'trustStripBlock' }),
  defineArrayMember({ type: 'whatsappQuoteBlock' }),
],
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/circletel
npm run type-check:memory 2>&1 | grep "error" | grep -v node_modules | head -20
```

Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add sanity-studio/schemas/index.ts sanity-studio/schemas/productPage.ts
git commit -m "feat(sanity): register trustStripBlock and whatsappQuoteBlock; add to productPage blocks"
```

---

## Task 4: Write the BizFibreConnect Seed Script

Creates the full `productPage` Sanity document for BizFibreConnect. Pattern matches the existing `sanity-studio/scripts/seed-workconnect-products.ts`. The script resolves related product IDs by slug lookup, then upserts the document.

**Files:**
- Create: `scripts/seed-bizfibreconnect.ts`

- [ ] **Step 1: Create the seed script**

```typescript
// scripts/seed-bizfibreconnect.ts
/**
 * Seed script for BizFibreConnect product page
 *
 * Creates the productPage document for /products/bizfibreconnect in Sanity.
 * Hero image is NOT seeded — upload manually in Sanity Studio afterward.
 *
 * Usage:
 *   cd /home/circletel
 *   SANITY_API_TOKEN=<token> npx ts-node --project tsconfig.json scripts/seed-bizfibreconnect.ts
 */

import { createClient } from '@sanity/client';

const projectId = '7iqq2t7l';
const dataset = 'production';
const apiVersion = '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('Error: SANITY_API_TOKEN environment variable is required');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token });

// ─── Related product lookup ────────────────────────────────────────────────
async function resolveRelatedProducts(slugs: string[]): Promise<{ _type: 'reference'; _ref: string }[]> {
  const query = `*[_type == "productPage" && slug.current in $slugs]{ _id, "slug": slug.current }`;
  const results: { _id: string; slug: string }[] = await client.fetch(query, { slugs });

  if (results.length === 0) {
    console.warn('  Warning: No related products found. They may not be seeded yet.');
  } else {
    results.forEach((r) => console.log(`  Found related product: ${r.slug} (${r._id})`));
  }

  return results.map((r) => ({ _type: 'reference' as const, _ref: r._id }));
}

// ─── Document definition ───────────────────────────────────────────────────
async function buildDocument() {
  const relatedProducts = await resolveRelatedProducts([
    'skyfibre-smb',
    'workconnect-soho',
    'cloudwifi',
  ]);

  return {
    _id: 'bizfibreconnect',
    _type: 'productPage',
    name: 'BizFibreConnect',
    slug: { _type: 'slug', current: 'bizfibreconnect' },
    category: 'business',
    tagline: 'Dedicated dark fibre for businesses that demand reliability',
    pricing: {
      startingPrice: 1899,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'symmetric',
        title: 'Symmetric Speeds',
        description: 'Upload equals download on every tier — no throttling, no surprises.',
        icon: 'arrow-up',
      },
      {
        _key: 'sla',
        title: '99.9% SLA Guarantee',
        description: 'Guaranteed uptime backed by DFA infrastructure and a binding SLA.',
        icon: 'shield',
      },
      {
        _key: 'dedicated',
        title: 'Dedicated Fibre',
        description: 'Your own fibre connection via DFA — not shared with neighbours.',
        icon: 'globe',
      },
      {
        _key: 'support',
        title: 'Business-Grade Support',
        description: 'Priority NOC monitoring, static IP included, and a dedicated account manager.',
        icon: 'phone',
      },
    ],
    specifications: [
      { _key: 'tech', label: 'Technology', value: 'DFA Dark Fibre' },
      { _key: 'tiers', label: 'Speed Tiers', value: '25/25 · 50/50 · 100/100 · 200/200 Mbps' },
      { _key: 'type', label: 'Speed Type', value: 'Symmetric (equal upload & download)' },
      { _key: 'sla', label: 'Uptime SLA', value: '99.9%' },
      { _key: 'ip', label: 'IP Addressing', value: 'Static IP included' },
      { _key: 'contract', label: 'Contract Terms', value: '12 or 24 months' },
    ],
    seo: {
      _type: 'seo',
      metaTitle: 'BizFibreConnect — Dedicated Dark Fibre for Business | CircleTel',
      metaDescription:
        'Symmetric dark fibre connectivity via DFA infrastructure. 99.9% SLA, static IP, 25–200 Mbps tiers from R1,899/mo.',
    },
    blocks: [
      // Block 1: Trust Strip
      {
        _key: 'trust-strip',
        _type: 'trustStripBlock',
        badges: [
          { _key: 'b1', icon: 'verified', text: '99.9% Uptime SLA' },
          { _key: 'b2', icon: 'speed', text: '<10ms Latency' },
          { _key: 'b3', icon: 'support_agent', text: '24/7 NOC Monitoring' },
          { _key: 'b4', icon: 'swap_vert', text: 'Symmetric Speeds' },
        ],
      },

      // Block 2: Pricing Grid
      {
        _key: 'pricing-grid',
        _type: 'pricingBlock',
        headline: 'Choose Your BizFibreConnect Plan',
        description: 'Symmetric dark fibre at every speed tier. All prices exclude VAT.',
        plans: [
          {
            _key: 'biz25',
            name: 'BizFibre 25',
            speed: '25/25 Mbps',
            price: 1899,
            description: 'Ideal for small offices and light cloud workloads.',
            features: [
              '25 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz50',
            name: 'BizFibre 50',
            speed: '50/50 Mbps',
            price: 2499,
            description: 'Handles multiple video calls and large file transfers.',
            features: [
              '50 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz100',
            name: 'BizFibre 100',
            speed: '100/100 Mbps',
            price: 2999,
            isPopular: true,
            badge: 'Most Popular',
            description: 'The sweet spot for growing businesses and remote teams.',
            features: [
              '100 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz200',
            name: 'BizFibre 200',
            speed: '200/200 Mbps',
            price: 4499,
            description: 'High-bandwidth operations, multi-site connectivity.',
            features: [
              '200 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Dedicated account manager',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz-enterprise',
            name: 'Enterprise',
            speed: '1Gbps+',
            price: 7999,
            isEnterprise: true,
            description: 'Custom 1Gbps+ solutions for enterprise and multi-site deployments. Pricing from R7,999/mo — contact us for a tailored quote.',
            features: [
              '1Gbps+ symmetric speeds',
              'Multiple static IPs',
              '99.99% uptime SLA',
              'Dedicated NOC engineer',
              'Custom SLA terms',
            ],
            ctaLabel: 'Contact Sales',
            ctaUrl: 'https://wa.me/27824873900',
          },
        ],
        footnote: 'All prices exclude VAT. Installation included on 24-month contracts.',
      },

      // Block 3: WhatsApp Quote
      {
        _key: 'whatsapp-quote',
        _type: 'whatsappQuoteBlock',
        eyebrow: 'Get a Quote in 2 Minutes',
        headline: 'Need a Custom Enterprise Solution?',
        description:
          "Our business team will tailor a BizFibreConnect plan for your requirements. We'll reply within 1 business hour.",
        bundleOptions: [
          'BizFibre 25 — 25/25 Mbps (R1,899/mo)',
          'BizFibre 50 — 50/50 Mbps (R2,499/mo)',
          'BizFibre 100 — 100/100 Mbps (R2,999/mo)',
          'BizFibre 200 — 200/200 Mbps (R4,499/mo)',
          'Enterprise — 1Gbps+ (custom pricing)',
        ],
      },
    ],
    relatedProducts,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding BizFibreConnect product page...\n');
  console.log(`Project: ${projectId} | Dataset: ${dataset}\n`);

  const doc = await buildDocument();

  try {
    const result = await client.createOrReplace(doc);
    console.log(`\n✅ Created: ${result._id}`);
    console.log(`   Page will render at: /products/bizfibreconnect`);
    console.log(`\n   Next step: Upload a hero image in Sanity Studio`);
    console.log(`   Studio URL: https://7iqq2t7l.sanity.studio/structure/productPage`);
  } catch (error) {
    console.error('Failed to seed document:', error);
    process.exit(1);
  }
}

main().catch(console.error);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/circletel
npm run type-check:memory 2>&1 | grep "error" | grep -v node_modules | grep -v ".worktrees" | head -20
```

Expected: no errors in `scripts/seed-bizfibreconnect.ts`

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-bizfibreconnect.ts
git commit -m "feat(content): add BizFibreConnect seed script"
```

---

## Task 5: Run the Seed Script and Verify

Execute the seed script against Sanity production, then verify the page renders correctly.

**Prerequisites:** `SANITY_API_TOKEN` must be set. Find it in Sanity Studio settings → API → Tokens, or check the project's `.env.local`.

- [ ] **Step 1: Check SANITY_API_TOKEN is available**

```bash
cd /home/circletel
grep "SANITY_API_TOKEN" .env.local | head -1
```

If not in `.env.local`, export it manually before the next step.

- [ ] **Step 2: Run the seed script**

```bash
cd /home/circletel
SANITY_API_TOKEN=$(grep SANITY_API_TOKEN .env.local | cut -d= -f2) \
  npx ts-node --project tsconfig.json scripts/seed-bizfibreconnect.ts
```

Expected output:
```
Seeding BizFibreConnect product page...

Project: 7iqq2t7l | Dataset: production

  Found related product: skyfibre-smb (...)
  Found related product: workconnect-soho (...)   ← may be absent if not yet seeded
  Found related product: cloudwifi (...)           ← may be absent if not yet seeded

✅ Created: bizfibreconnect
   Page will render at: /products/bizfibreconnect
   Next step: Upload a hero image in Sanity Studio
```

> **Note:** If `workconnect-soho` or `cloudwifi` are not found, the script still succeeds — it only sets related product references for documents that already exist in Sanity.

- [ ] **Step 3: Verify the page renders**

```bash
# Dev server should be running. If not:
npm run dev:memory &
sleep 10
curl -s http://localhost:3000/products/bizfibreconnect | grep -E "<title>|BizFibreConnect" | head -5
```

Expected: page HTML containing "BizFibreConnect"

- [ ] **Step 4: Manual verification checklist**

Open `http://localhost:3000/products/bizfibreconnect` in a browser and confirm:
- [ ] Hero section renders (may show no image until uploaded in Studio — that's expected)
- [ ] "Starting from R1,899/mo" pricing bar appears
- [ ] 4 key feature cards visible (Symmetric Speeds, SLA, Dedicated Fibre, Support)
- [ ] Technical Specifications table renders (6 rows)
- [ ] Trust Strip shows 4 badges (99.9% SLA, <10ms, 24/7 NOC, Symmetric)
- [ ] Pricing grid shows 4 standard plans + Enterprise banner
- [ ] WhatsApp Quote form renders with plan dropdown
- [ ] Why CircleTel section renders
- [ ] Related Products section renders (however many slugs were resolved)

- [ ] **Step 5: Upload hero image in Sanity Studio**

1. Go to `https://7iqq2t7l.sanity.studio/structure/productPage`
2. Open the **BizFibreConnect** document
3. Click **Hero Image** → upload a dark fibre / office / enterprise image
4. Click **Publish**

- [ ] **Step 6: Final commit**

```bash
git add .
git status  # Confirm only expected files changed
git commit -m "feat(content): BizFibreConnect product page — seed complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ Layout B (Enterprise) — TrustStrip + PricingBlock + WhatsAppQuote as blocks
- ✅ Seed script (Option A — programmatic)
- ✅ All 3 schema file gaps resolved (trustStripBlock, whatsappQuoteBlock, pricingBlock in productPage)
- ✅ Pricing tiers: BizFibre 25/50/100/200 + Enterprise banner
- ✅ Key features: 4 cards with correct icon strings from `iconMap` in page template
- ✅ Related products: skyfibre-smb, workconnect-soho, cloudwifi (resolved by slug)
- ✅ SEO fields: metaTitle + metaDescription
- ✅ Hero image deferred to Studio (not seeded — no image file to upload)

**Icon string check:** The page template's `iconMap` supports: `shield`, `phone`, `globe`, `message-circle`, `wifi`, `router`, `receipt`, `arrow-up`, `layout`, `chart`, `sim-card`. Key features use: `arrow-up` ✅, `shield` ✅, `globe` ✅, `phone` ✅ — all valid.

**Type consistency:** `relatedProducts` resolved to `{ _type: 'reference', _ref: string }[]` in Task 4 — matches Sanity reference schema in `productPage.ts` lines 117–123.

**No placeholders detected.**
