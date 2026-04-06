# Business Mobile — Full Sanity CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded content on `/business/mobile` with Sanity CMS-managed data so editors can update every section without a code deploy.

**Architecture:** Hybrid approach — hero stays as top-level `productPage` fields; all content below the hero is delivered via `blocks[]` rendered by `BlockRenderer`. Four new reusable block types are added to the block registry. Seven legacy hardcoded components and the static data file are deleted.

**Tech Stack:** Next.js 15, TypeScript, Sanity v3, Tailwind CSS, Material Symbols icons

**Design spec:** `docs/superpowers/specs/2026-04-06-business-mobile-sanity-cms-design.md`

---

## File Map

| Action | File |
|--------|------|
| Modify | `lib/sanity/types.ts` |
| Create | `lib/sanity/schemas/blocks/bundleGridBlock.ts` |
| Create | `lib/sanity/schemas/blocks/trustStripBlock.ts` |
| Create | `lib/sanity/schemas/blocks/dualListBlock.ts` |
| Create | `lib/sanity/schemas/blocks/whatsappQuoteBlock.ts` |
| Modify | `lib/sanity/schemas/documents/productPage.ts` |
| Modify | `lib/sanity/schemas/index.ts` |
| Create | `components/sanity/blocks/BundleGridBlock.tsx` |
| Create | `components/sanity/blocks/TrustStripBlock.tsx` |
| Create | `components/sanity/blocks/DualListBlock.tsx` |
| Create | `components/sanity/blocks/WhatsAppQuoteBlock.tsx` |
| Modify | `components/sanity/blocks/index.ts` |
| Modify | `components/business-mobile/BizMobilePromoBanner.tsx` |
| Modify | `components/business-mobile/index.ts` |
| Modify | `app/business/mobile/page.tsx` |
| Delete | `lib/data/business-mobile.ts` |
| Delete | `components/business-mobile/BizMobileBundleGrid.tsx` |
| Delete | `components/business-mobile/BizMobileTrustStrip.tsx` |
| Delete | `components/business-mobile/BizMobileComparisonTable.tsx` |
| Delete | `components/business-mobile/BizMobileQuoteForm.tsx` |
| Delete | `components/business-mobile/BizMobileTestimonials.tsx` |
| Delete | `components/business-mobile/BizMobileCTABanner.tsx` |

---

## Task 1: Extend BlockType union

**Files:**
- Modify: `lib/sanity/types.ts`

- [ ] **Step 1: Add 4 new values to the `BlockType` union**

Open `lib/sanity/types.ts`. Replace the existing `BlockType` type with:

```typescript
export type BlockType =
  | 'heroBlock'
  | 'featureGridBlock'
  | 'pricingBlock'
  | 'faqBlock'
  | 'comparisonBlock'
  | 'testimonialBlock'
  | 'productShowcaseBlock'
  | 'textBlock'
  | 'imageBlock'
  | 'ctaBlock'
  | 'formBlock'
  | 'separatorBlock'
  | 'galleryBlock'
  | 'bundleGridBlock'
  | 'trustStripBlock'
  | 'dualListBlock'
  | 'whatsappQuoteBlock'
```

Leave `BlockCommonFields` and `SanitySection` unchanged.

- [ ] **Step 2: Commit**

```bash
git add lib/sanity/types.ts
git commit -m "feat(sanity): add 4 new BlockType values for business-mobile blocks"
```

---

## Task 2: Create `bundleGridBlock` Sanity schema

**Files:**
- Create: `lib/sanity/schemas/blocks/bundleGridBlock.ts`

- [ ] **Step 1: Create the file with the full schema**

```typescript
// lib/sanity/schemas/blocks/bundleGridBlock.ts
import { defineType, defineField, defineArrayMember } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'bundleGridBlock',
  title: 'Bundle Grid',
  type: 'object',
  icon: ComponentIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow Text', type: 'string' }),
    defineField({ name: 'headline', title: 'Section Headline', type: 'string' }),
    defineField({
      name: 'description',
      title: 'Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'bundles',
      title: 'Bundles',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Bundle Name',
              validation: (Rule) => Rule.required(),
            },
            { name: 'tagline', type: 'string', title: 'Tagline' },
            { name: 'badge', type: 'string', title: 'Badge Label' },
            {
              name: 'badgeColor',
              type: 'string',
              title: 'Badge Colour',
              options: {
                list: [
                  { title: 'Orange (Primary)', value: 'primary' },
                  { title: 'Blue (Secondary)', value: 'secondary' },
                  { title: 'Navy', value: 'navy' },
                  { title: 'Purple', value: 'purple' },
                ],
              },
              initialValue: 'primary',
            },
            {
              name: 'icon',
              type: 'string',
              title: 'Material Symbols Icon Name',
              description: 'e.g. smartphone, corporate_fare, local_shipping',
            },
            {
              name: 'priceFrom',
              type: 'string',
              title: 'Price Label',
              description: 'e.g. "From R455"',
            },
            {
              name: 'priceSuffix',
              type: 'string',
              title: 'Price Suffix',
              description: 'e.g. "/mo"',
            },
            {
              name: 'features',
              type: 'array',
              title: 'Features',
              of: [{ type: 'string' }],
            },
            { name: 'ctaLabel', type: 'string', title: 'CTA Button Label' },
            { name: 'ctaUrl', type: 'string', title: 'CTA Button URL' },
            {
              name: 'featured',
              type: 'boolean',
              title: 'Featured Card',
              description: 'Highlighted with orange border and floating badge',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'badge',
              featured: 'featured',
            },
            prepare({ title, subtitle, featured }: { title: string; subtitle?: string; featured?: boolean }) {
              return { title: `${title}${featured ? ' ⭐' : ''}`, subtitle };
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Grid Columns',
      type: 'number',
      options: {
        list: [
          { title: '2 Columns', value: 2 },
          { title: '3 Columns', value: 3 },
          { title: '4 Columns', value: 4 },
        ],
      },
      initialValue: 4,
    }),
    ...blockFields,
  ],
  preview: {
    select: { title: 'headline', bundles: 'bundles' },
    prepare({ title, bundles }: { title?: string; bundles?: unknown[] }) {
      return {
        title: title || 'Bundle Grid',
        subtitle: `${bundles?.length ?? 0} bundles`,
      };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/sanity/schemas/blocks/bundleGridBlock.ts
git commit -m "feat(sanity): add bundleGridBlock schema"
```

---

## Task 3: Create `trustStripBlock` Sanity schema

**Files:**
- Create: `lib/sanity/schemas/blocks/trustStripBlock.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/sanity/schemas/blocks/trustStripBlock.ts
import { defineType, defineField, defineArrayMember } from 'sanity';
import { StarIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

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
        defineArrayMember({
          type: 'object',
          fields: [
            {
              name: 'icon',
              type: 'string',
              title: 'Material Symbols Icon Name',
              description: 'e.g. signal_cellular_alt, verified, bolt',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'text',
              type: 'string',
              title: 'Badge Text',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'text', subtitle: 'icon' },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
    ...blockFields,
  ],
  preview: {
    select: { badges: 'badges' },
    prepare({ badges }: { badges?: unknown[] }) {
      return {
        title: 'Trust Strip',
        subtitle: `${badges?.length ?? 0} badges`,
      };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/sanity/schemas/blocks/trustStripBlock.ts
git commit -m "feat(sanity): add trustStripBlock schema"
```

---

## Task 4: Create `dualListBlock` Sanity schema

**Files:**
- Create: `lib/sanity/schemas/blocks/dualListBlock.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/sanity/schemas/blocks/dualListBlock.ts
import { defineType, defineField } from 'sanity';
import { ThListIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'dualListBlock',
  title: 'Dual List (Managed vs DIY)',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({ name: 'headline', title: 'Section Headline', type: 'string' }),
    defineField({
      name: 'description',
      title: 'Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'leftColumn',
      title: 'Left Column (green check icons)',
      type: 'object',
      fields: [
        {
          name: 'label',
          type: 'string',
          title: 'Column Heading',
          validation: (Rule) => Rule.required(),
        },
        { name: 'badgeLabel', type: 'string', title: 'Badge Label' },
        {
          name: 'items',
          type: 'array',
          title: 'Items',
          of: [{ type: 'string' }],
          validation: (Rule) => Rule.min(1),
        },
      ],
    }),
    defineField({
      name: 'rightColumn',
      title: 'Right Column (grey cross icons)',
      type: 'object',
      fields: [
        {
          name: 'label',
          type: 'string',
          title: 'Column Heading',
          validation: (Rule) => Rule.required(),
        },
        { name: 'badgeLabel', type: 'string', title: 'Badge Label' },
        {
          name: 'items',
          type: 'array',
          title: 'Items',
          of: [{ type: 'string' }],
          validation: (Rule) => Rule.min(1),
        },
      ],
    }),
    ...blockFields,
  ],
  preview: {
    select: { title: 'headline' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Dual List Comparison' };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/sanity/schemas/blocks/dualListBlock.ts
git commit -m "feat(sanity): add dualListBlock schema"
```

---

## Task 5: Create `whatsappQuoteBlock` Sanity schema

**Files:**
- Create: `lib/sanity/schemas/blocks/whatsappQuoteBlock.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/sanity/schemas/blocks/whatsappQuoteBlock.ts
import { defineType, defineField } from 'sanity';
import { ComposeIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'whatsappQuoteBlock',
  title: 'WhatsApp Quote Form',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow Text', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Form Heading',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Form Subheading',
      type: 'string',
    }),
    defineField({
      name: 'bundleOptions',
      title: 'Bundle Dropdown Options',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Plan names shown in the dropdown, e.g. "BusinessMobile", "OfficeConnect". Leave empty to hide the dropdown.',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'WhatsApp Phone Number',
      type: 'string',
      description:
        'Overrides default contact number. Format: 27824873900 (no spaces, country code first). Leave blank to use the default.',
    }),
    ...blockFields,
  ],
  preview: {
    select: { title: 'headline' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'WhatsApp Quote Form' };
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/sanity/schemas/blocks/whatsappQuoteBlock.ts
git commit -m "feat(sanity): add whatsappQuoteBlock schema"
```

---

## Task 6: Register new schemas + add `promoBanner` to `productPage`

**Files:**
- Modify: `lib/sanity/schemas/index.ts`
- Modify: `lib/sanity/schemas/documents/productPage.ts`

- [ ] **Step 1: Register 4 new block schemas in `lib/sanity/schemas/index.ts`**

Add imports after the existing "New block types" section:

```typescript
// Business-mobile block types
import bundleGridBlock from './blocks/bundleGridBlock'
import trustStripBlock from './blocks/trustStripBlock'
import dualListBlock from './blocks/dualListBlock'
import whatsappQuoteBlock from './blocks/whatsappQuoteBlock'
```

Add to the `schemaTypes` array after `galleryBlock`:

```typescript
  bundleGridBlock,
  trustStripBlock,
  dualListBlock,
  whatsappQuoteBlock,
```

- [ ] **Step 2: Add `promoBanner` field and new block members to `productPage.ts`**

In `lib/sanity/schemas/documents/productPage.ts`:

After the `seo` field definition (around line 99), add:

```typescript
    defineField({
      name: 'promoBanner',
      title: 'Promo Banner',
      type: 'object',
      description: 'Urgency bar shown at the top of the page. Hidden automatically after endsAt.',
      fields: [
        {
          name: 'enabled',
          type: 'boolean',
          title: 'Show Banner',
          initialValue: false,
        },
        { name: 'message', type: 'string', title: 'Banner Message' },
        { name: 'endsAt', type: 'datetime', title: 'Promo End Date/Time' },
      ],
    }),
```

In the `blocks` field's `of` array, add 4 new members after `defineArrayMember({ type: 'galleryBlock' })`:

```typescript
        defineArrayMember({ type: 'bundleGridBlock' }),
        defineArrayMember({ type: 'trustStripBlock' }),
        defineArrayMember({ type: 'dualListBlock' }),
        defineArrayMember({ type: 'whatsappQuoteBlock' }),
```

- [ ] **Step 3: Commit**

```bash
git add lib/sanity/schemas/index.ts lib/sanity/schemas/documents/productPage.ts
git commit -m "feat(sanity): register new block schemas + add promoBanner to productPage"
```

---

## Task 7: Create `BundleGridBlock` React component

**Files:**
- Create: `components/sanity/blocks/BundleGridBlock.tsx`

Note: This component reuses `BizMobileBundleCard` from `components/business-mobile/BizMobileBundleCard.tsx` which accepts `BizMobileBundleCardProps`. The `features` prop on that component is `Readonly<{ text: string }[]>`, so we map `string[]` from Sanity.

- [ ] **Step 1: Create the component**

```typescript
// components/sanity/blocks/BundleGridBlock.tsx
import { BizMobileBundleCard } from '@/components/business-mobile/BizMobileBundleCard';

interface SanityBundle {
  _key: string;
  name: string;
  tagline?: string;
  badge?: string;
  badgeColor?: 'primary' | 'secondary' | 'navy' | 'purple';
  icon?: string;
  priceFrom?: string;
  priceSuffix?: string;
  features?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  featured?: boolean;
}

interface BundleGridBlockProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  bundles?: SanityBundle[];
  columns?: 2 | 3 | 4;
}

const GRID_COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'lg:grid-cols-4 md:grid-cols-2',
};

export function BundleGridBlock({
  eyebrow,
  headline,
  description,
  bundles = [],
  columns = 4,
}: BundleGridBlockProps) {
  const gridCols = GRID_COLS[columns] ?? GRID_COLS[4];

  return (
    <section className="py-24 bg-[#F8F9FA]">
      <div className="max-w-[1200px] mx-auto px-6">
        {(eyebrow || headline || description) && (
          <div className="text-center mb-16">
            {eyebrow && (
              <span className="inline-block text-sm font-semibold text-[#E87A1E] uppercase tracking-widest mb-3">
                {eyebrow}
              </span>
            )}
            {headline && (
              <h2
                className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4"
                style={{ letterSpacing: '-0.02em' }}
              >
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-[#6B7280] max-w-2xl mx-auto">{description}</p>
            )}
          </div>
        )}
        <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
          {bundles.map((bundle) => (
            <BizMobileBundleCard
              key={bundle._key}
              id={bundle._key}
              name={bundle.name}
              tagline={bundle.tagline ?? ''}
              badge={bundle.badge ?? ''}
              badgeVariant={bundle.badgeColor ?? 'primary'}
              icon={bundle.icon ?? 'smartphone'}
              priceFrom={bundle.priceFrom ?? ''}
              priceSuffix={bundle.priceSuffix ?? ''}
              features={(bundle.features ?? []).map((text) => ({ text }))}
              ctaLabel={bundle.ctaLabel ?? 'Get Started'}
              href={bundle.ctaUrl ?? '#'}
              featured={bundle.featured ?? false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sanity/blocks/BundleGridBlock.tsx
git commit -m "feat(blocks): add BundleGridBlock component"
```

---

## Task 8: Create `TrustStripBlock` React component

**Files:**
- Create: `components/sanity/blocks/TrustStripBlock.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/sanity/blocks/TrustStripBlock.tsx
interface TrustBadge {
  _key: string;
  icon: string;
  text: string;
}

interface TrustStripBlockProps {
  badges?: TrustBadge[];
}

export function TrustStripBlock({ badges = [] }: TrustStripBlockProps) {
  if (!badges.length) return null;

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {badges.map((badge) => (
            <div
              key={badge._key}
              className="flex items-center gap-2 text-[#1E293B] font-bold whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[#E87A1E]">{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sanity/blocks/TrustStripBlock.tsx
git commit -m "feat(blocks): add TrustStripBlock component"
```

---

## Task 9: Create `DualListBlock` React component

**Files:**
- Create: `components/sanity/blocks/DualListBlock.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/sanity/blocks/DualListBlock.tsx
interface DualColumn {
  label: string;
  badgeLabel?: string;
  items?: string[];
}

interface DualListBlockProps {
  headline?: string;
  description?: string;
  leftColumn?: DualColumn;
  rightColumn?: DualColumn;
}

export function DualListBlock({
  headline,
  description,
  leftColumn,
  rightColumn,
}: DualListBlockProps) {
  if (!leftColumn && !rightColumn) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        {(headline || description) && (
          <div className="text-center mb-12">
            {headline && (
              <h2
                className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4"
                style={{ letterSpacing: '-0.02em' }}
              >
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-[#6B7280] max-w-2xl mx-auto text-lg">{description}</p>
            )}
          </div>
        )}

        <div className="rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left column — CircleTel advantage */}
            {leftColumn && (
              <div className="p-10 md:p-14 bg-[#1E293B] text-white">
                {leftColumn.badgeLabel && (
                  <div className="inline-flex items-center gap-2 bg-[#E87A1E]/20 text-[#E87A1E] px-3 py-1 rounded-full text-xs font-bold uppercase mb-6">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    {leftColumn.badgeLabel}
                  </div>
                )}
                <h3
                  className="font-extrabold text-2xl mb-8"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {leftColumn.label}
                </h3>
                <ul className="space-y-4">
                  {(leftColumn.items ?? []).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-[#16A34A] text-xl flex-shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Right column — DIY */}
            {rightColumn && (
              <div className="p-10 md:p-14 bg-slate-800 text-slate-400 border-l border-slate-700">
                {rightColumn.badgeLabel && (
                  <div className="inline-flex items-center gap-2 bg-slate-700 text-slate-400 px-3 py-1 rounded-full text-xs font-bold uppercase mb-6">
                    {rightColumn.badgeLabel}
                  </div>
                )}
                <h3
                  className="font-extrabold text-2xl text-slate-400 mb-8"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {rightColumn.label}
                </h3>
                <ul className="space-y-4">
                  {(rightColumn.items ?? []).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-slate-500 text-xl flex-shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        cancel
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sanity/blocks/DualListBlock.tsx
git commit -m "feat(blocks): add DualListBlock component"
```

---

## Task 10: Create `WhatsAppQuoteBlock` React component

**Files:**
- Create: `components/sanity/blocks/WhatsAppQuoteBlock.tsx`

Note: `CONTACT.WHATSAPP_LINK` is `https://wa.me/27824873900`. We extract the number from it as the default fallback so the contact number is never hardcoded here.

- [ ] **Step 1: Create the component**

```typescript
// components/sanity/blocks/WhatsAppQuoteBlock.tsx
'use client';

import { useState } from 'react';
import { CONTACT } from '@/lib/constants/contact';

interface WhatsAppQuoteBlockProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  bundleOptions?: string[];
  phoneNumber?: string;
}

interface FormState {
  name: string;
  phone: string;
  bundle: string;
}

type SubmitStatus = 'idle' | 'submitting' | 'success';

export function WhatsAppQuoteBlock({
  eyebrow = 'Get a Quote in 2 Minutes',
  headline = 'Tell us what your business needs',
  description = "We'll reply on WhatsApp within 1 business hour.",
  bundleOptions = [],
  phoneNumber,
}: WhatsAppQuoteBlockProps) {
  const [form, setForm] = useState<FormState>({ name: '', phone: '', bundle: '' });
  const [status, setStatus] = useState<SubmitStatus>('idle');

  // Derive number from Sanity override or from the canonical WHATSAPP_LINK constant
  const waNumber = phoneNumber ?? CONTACT.WHATSAPP_LINK.replace('https://wa.me/', '');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    const message = encodeURIComponent(
      `Hi CircleTel! I'd like a quote.\n\nName: ${form.name}\nPhone: ${form.phone}\nPlan: ${
        form.bundle || 'Not sure yet — please help me choose'
      }`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
    setStatus('success');
  }

  const isValid = form.name.trim().length > 1 && form.phone.trim().length >= 10;

  if (status === 'success') {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-[640px] mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span
              className="material-symbols-outlined text-[#16A34A] text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h3
            className="text-2xl font-extrabold text-[#1E293B] mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            WhatsApp is opening now
          </h3>
          <p className="text-[#6B7280]">
            Your details are pre-filled. Send the message and our team will respond within 1
            business hour.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[640px] mx-auto px-6">
        <div className="bg-[#F8F9FA] rounded-[2rem] p-8 md:p-12">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-50 text-[#E87A1E] text-sm font-bold border border-orange-100 mb-4">
              {eyebrow}
            </span>
            <h2
              className="text-2xl md:text-3xl font-extrabold text-[#1E293B]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {headline}
            </h2>
            <p className="text-[#6B7280] mt-2 text-sm">{description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="wq-name"
                className="block text-sm font-medium text-[#1E293B] mb-1.5"
              >
                Your name
              </label>
              <input
                id="wq-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Thabo Dlamini"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full h-[52px] px-4 rounded-xl border border-[#D1D5DB] bg-white text-[#111827] placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="wq-phone"
                className="block text-sm font-medium text-[#1E293B] mb-1.5"
              >
                WhatsApp number
              </label>
              <input
                id="wq-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 082 487 3900"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full h-[52px] px-4 rounded-xl border border-[#D1D5DB] bg-white text-[#111827] placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20 transition-colors"
              />
            </div>

            {bundleOptions.length > 0 && (
              <div>
                <label
                  htmlFor="wq-bundle"
                  className="block text-sm font-medium text-[#1E293B] mb-1.5"
                >
                  Which plan are you interested in?
                </label>
                <select
                  id="wq-bundle"
                  name="bundle"
                  value={form.bundle}
                  onChange={handleChange}
                  className="w-full h-[52px] px-4 rounded-xl border border-[#D1D5DB] bg-white text-[#111827] text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20 transition-colors appearance-none"
                >
                  <option value="">Not sure yet — help me choose</option>
                  {bundleOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || status === 'submitting'}
              className="w-full h-[52px] mt-2 rounded-full bg-[#16A34A] text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                chat
              </span>
              {status === 'submitting' ? 'Opening WhatsApp…' : 'Get My Quote via WhatsApp'}
            </button>

            <p className="text-center text-xs text-[#9CA3AF]">
              Opens WhatsApp with your details pre-filled. No spam.{' '}
              <a
                href={`mailto:${CONTACT.EMAIL_PRIMARY}`}
                className="text-[#E87A1E] hover:underline"
              >
                Prefer email?
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sanity/blocks/WhatsAppQuoteBlock.tsx
git commit -m "feat(blocks): add WhatsAppQuoteBlock component"
```

---

## Task 11: Register new components in block registry

**Files:**
- Modify: `components/sanity/blocks/index.ts`

- [ ] **Step 1: Add imports and register in registry**

After the existing `import { GalleryBlock } from './GalleryBlock'` line, add:

```typescript
import { BundleGridBlock } from './BundleGridBlock'
import { TrustStripBlock } from './TrustStripBlock'
import { DualListBlock } from './DualListBlock'
import { WhatsAppQuoteBlock } from './WhatsAppQuoteBlock'
```

After `export { GalleryBlock } from './GalleryBlock'`, add:

```typescript
export { BundleGridBlock } from './BundleGridBlock'
export { TrustStripBlock } from './TrustStripBlock'
export { DualListBlock } from './DualListBlock'
export { WhatsAppQuoteBlock } from './WhatsAppQuoteBlock'
```

In `blockRegistry`, after `galleryBlock: GalleryBlock,` add:

```typescript
  bundleGridBlock: BundleGridBlock,
  trustStripBlock: TrustStripBlock,
  dualListBlock: DualListBlock,
  whatsappQuoteBlock: WhatsAppQuoteBlock,
```

- [ ] **Step 2: Commit**

```bash
git add components/sanity/blocks/index.ts
git commit -m "feat(blocks): register BundleGridBlock, TrustStripBlock, DualListBlock, WhatsAppQuoteBlock"
```

---

## Task 12: Update `BizMobilePromoBanner` to accept Sanity props

**Files:**
- Modify: `components/business-mobile/BizMobilePromoBanner.tsx`

The current props are `{ promoEndsAt?: string; message?: string }`. Add `enabled?: boolean` and guard against it in the render condition.

- [ ] **Step 1: Update the props interface and null-guard**

Replace the existing `BizMobilePromoBannerProps` interface:

```typescript
interface BizMobilePromoBannerProps {
  /** When false or undefined, banner is never shown */
  enabled?: boolean;
  /** ISO date string — banner hides automatically after this date passes */
  promoEndsAt?: string;
  message?: string;
}
```

Replace the existing null-guard line (`if (!promoEndsAt || timeLeft === null) return null;`) with:

```typescript
  if (!enabled || !promoEndsAt || timeLeft === null) return null;
```

The destructuring signature becomes:

```typescript
export function BizMobilePromoBanner({
  enabled,
  promoEndsAt,
  message = 'Limited-time pricing active — lock in your rate today.',
}: Readonly<BizMobilePromoBannerProps>) {
```

- [ ] **Step 2: Commit**

```bash
git add components/business-mobile/BizMobilePromoBanner.tsx
git commit -m "feat(business-mobile): accept enabled/promoEndsAt/message from Sanity in BizMobilePromoBanner"
```

---

## Task 13: Update `app/business/mobile/page.tsx`

**Files:**
- Modify: `app/business/mobile/page.tsx`

- [ ] **Step 1: Rewrite the page file**

Replace the entire contents of `app/business/mobile/page.tsx` with:

```typescript
import type { Metadata } from 'next';
import Image from 'next/image';
import { sanityFetch } from '@/lib/sanity/fetch';
import { urlFor } from '@/lib/sanity/image';
import { BlockRenderer } from '@/components/sanity/BlockRenderer';
import { SanitySection } from '@/lib/sanity/types';
import { BizMobilePromoBanner } from '@/components/business-mobile/BizMobilePromoBanner';
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';

const SLUG = 'business-mobile';

const BUSINESS_MOBILE_QUERY = `*[_type == "productPage" && slug.current == $slug][0]{
  _id,
  name,
  tagline,
  heroImage { asset->{url}, alt },
  pricing,
  seo,
  promoBanner { enabled, message, endsAt },
  blocks[]{ _key, _type, ... }
}`;

interface PageData {
  _id: string;
  name: string;
  tagline?: string;
  heroImage?: { asset?: { url?: string }; alt?: string };
  pricing?: { startingPrice?: number; priceNote?: string; showContactForPricing?: boolean };
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: { asset?: { url?: string } } };
  promoBanner?: { enabled?: boolean; message?: string; endsAt?: string };
  blocks?: SanitySection[];
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await sanityFetch<PageData | null>({
    query: BUSINESS_MOBILE_QUERY,
    params: { slug: SLUG },
    tags: [`product:${SLUG}`, 'products'],
  });

  const title =
    page?.seo?.metaTitle ||
    'Business Mobile Plans | CircleTel — One Invoice. All Your Connectivity.';
  const description =
    page?.seo?.metaDescription ||
    'Business mobile plans managed entirely by CircleTel. BusinessMobile, OfficeConnect, WorkConnect Mobile, and FleetConnect — zero CAPEX, one invoice, delivered to your door.';

  return {
    title,
    description,
    openGraph: {
      title: page?.name ? `${page.name} | CircleTel` : 'Business Mobile Plans | CircleTel',
      description,
      url: 'https://www.circletel.co.za/business/mobile',
      ...(page?.seo?.ogImage?.asset?.url
        ? { images: [{ url: page.seo.ogImage.asset.url }] }
        : {}),
    },
  };
}

export default async function BusinessMobilePage() {
  const page = await sanityFetch<PageData | null>({
    query: BUSINESS_MOBILE_QUERY,
    params: { slug: SLUG },
    tags: [`product:${SLUG}`, 'products'],
  });

  const heroImageUrl = page?.heroImage?.asset?.url
    ? urlFor(page.heroImage).width(1920).height(1080).url()
    : null;

  return (
    <main className="min-h-screen bg-white">
      {/* Promo urgency bar — from Sanity */}
      <BizMobilePromoBanner
        enabled={page?.promoBanner?.enabled}
        promoEndsAt={page?.promoBanner?.endsAt}
        message={page?.promoBanner?.message}
      />

      {/* Hero — from top-level productPage fields */}
      {heroImageUrl && (
        <section className="relative min-h-[520px] flex items-end pb-16 md:items-center md:pb-0">
          <div className="absolute inset-0 z-0">
            <Image
              src={heroImageUrl}
              alt={page?.heroImage?.alt || page?.name || 'Business Mobile Plans'}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 relative z-10 py-24">
            <div className="max-w-2xl">
              <span className="inline-block text-sm font-semibold text-[#F5831F] uppercase tracking-widest mb-3">
                Business Mobile
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
                {page?.name || 'Business Mobile Plans'}
              </h1>
              {page?.tagline && (
                <p className="text-xl md:text-2xl text-white/90 mb-6">{page.tagline}</p>
              )}
              {page?.pricing?.startingPrice && !page.pricing.showContactForPricing && (
                <p className="text-2xl font-bold text-white mb-8">
                  From R{page.pricing.startingPrice.toLocaleString()}
                  {page.pricing.priceNote && (
                    <span className="text-lg font-normal text-white/80">
                      {' '}
                      {page.pricing.priceNote}
                    </span>
                  )}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <a
                  href="#bundles"
                  className="inline-flex items-center bg-[#F5831F] hover:bg-[#e0721a] text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  View Plans
                </a>
                <a
                  href={getWhatsAppLink('Hi, I want to get a quote for Business Mobile plans')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All content sections — from Sanity blocks */}
      {page?.blocks && page.blocks.length > 0 && (
        <div id="bundles">
          <BlockRenderer sections={page.blocks} />
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/business/mobile/page.tsx
git commit -m "feat(business-mobile): render all sections from Sanity blocks, remove static imports"
```

---

## Task 14: Update barrel file and delete legacy components

**Files:**
- Modify: `components/business-mobile/index.ts`
- Delete: `lib/data/business-mobile.ts`
- Delete: `components/business-mobile/BizMobileBundleGrid.tsx`
- Delete: `components/business-mobile/BizMobileTrustStrip.tsx`
- Delete: `components/business-mobile/BizMobileComparisonTable.tsx`
- Delete: `components/business-mobile/BizMobileQuoteForm.tsx`
- Delete: `components/business-mobile/BizMobileTestimonials.tsx`
- Delete: `components/business-mobile/BizMobileCTABanner.tsx`

- [ ] **Step 1: Update `components/business-mobile/index.ts`**

Replace the entire file with:

```typescript
export { BizMobileHero } from './BizMobileHero';
export { BizMobileBundleCard } from './BizMobileBundleCard';
export { BizMobilePromoBanner } from './BizMobilePromoBanner';
```

- [ ] **Step 2: Delete the 7 legacy files**

```bash
rm lib/data/business-mobile.ts
rm components/business-mobile/BizMobileBundleGrid.tsx
rm components/business-mobile/BizMobileTrustStrip.tsx
rm components/business-mobile/BizMobileComparisonTable.tsx
rm components/business-mobile/BizMobileQuoteForm.tsx
rm components/business-mobile/BizMobileTestimonials.tsx
rm components/business-mobile/BizMobileCTABanner.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/business-mobile/index.ts
git rm lib/data/business-mobile.ts \
  components/business-mobile/BizMobileBundleGrid.tsx \
  components/business-mobile/BizMobileTrustStrip.tsx \
  components/business-mobile/BizMobileComparisonTable.tsx \
  components/business-mobile/BizMobileQuoteForm.tsx \
  components/business-mobile/BizMobileTestimonials.tsx \
  components/business-mobile/BizMobileCTABanner.tsx
git commit -m "refactor(business-mobile): remove hardcoded components and static data file"
```

---

## Task 15: Type-check and final commit

- [ ] **Step 1: Run the type checker**

```bash
npm run type-check:memory
```

Expected output: no TypeScript errors. If errors appear, fix them before continuing.

**Common errors and fixes:**

| Error | Fix |
|-------|-----|
| `Type '"bundleGridBlock"' is not assignable to type 'BlockType'` | Task 1 was not completed — re-run it |
| `Property 'bundleGridBlock' does not exist on type 'Record<BlockType, ...>'` | Task 11 was not completed — register the component |
| `Cannot find module '@/components/business-mobile'` importing a deleted export | Task 14 barrel update was not done |
| `Property 'enabled' does not exist on type 'BizMobilePromoBannerProps'` | Task 12 was not completed |

- [ ] **Step 2: Commit if no errors**

```bash
git add -A
git commit -m "chore: type-check passes — business-mobile Sanity CMS migration complete"
```

---

## Post-Implementation: Populate Sanity data

After the code is deployed, a content editor must populate the `business-mobile` productPage document in Sanity Studio with:

1. **bundleGridBlock** — add 4 bundles matching the current data in `lib/data/business-mobile.ts` (which will be deleted by this plan, so copy the data before deleting):
   - BusinessMobile: badge "DEVICE PLANS", icon `smartphone`, priceFrom "From R455", priceSuffix "/mo"
   - OfficeConnect: badge "MOST POPULAR", featured: true, icon `corporate_fare`, priceFrom "From R1,269"
   - WorkConnect Mobile: badge "BROADBAND + MOBILE", icon `home_work`, priceFrom "R1,800–R2,500"
   - FleetConnect: badge "FLEET & IoT", badgeColor "purple", icon `local_shipping`, priceFrom "From R375"

2. **trustStripBlock** — 5 badges: `signal_cellular_alt / 4G/5G Nationwide Coverage`, `verified / ICASA Licensed`, `bolt / Zero CAPEX`, `receipt_long / One Invoice`, `support_agent / Mon–Fri Support`

3. **dualListBlock** — headline "Managed for you. Delivered to your door. One invoice.", left: "CircleTel-Managed" with badge "CircleTel Advantage" and the 6 advantage points, right: "DIY / Self-Managed" with the 6 DIY points

4. **testimonialBlock** — reference existing testimonial documents (or create 3 new ones)

5. **whatsappQuoteBlock** — bundleOptions: ["BusinessMobile", "OfficeConnect", "WorkConnect Mobile", "FleetConnect"]

6. **ctaBlock** — headline "Not sure which plan fits your business?", description "Our team will match you to the right solution in under 10 minutes."
