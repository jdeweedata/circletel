# SkyFibre SMB Product Page Implementation

**Date:** 2026-03-12
**Task:** Create product page with Sanity CMS and Gemini-generated hero image
**Time Saved Future:** ~45 min (Sanity patterns, navigation fixes, image generation)

## What Was Built

- Product page at `/products/skyfibre-smb` with:
  - Hero section with Gemini-generated image
  - 3 pricing tiers (Business 50/100/200)
  - Key features, specifications, How It Works, Why CircleTel sections
  - CTA sections with proper button styling

## Key Patterns

### 1. Sanity PricingBlock Integration

The `pricingBlock` schema must be added to `productPage.blocks` allowed types:

```typescript
// lib/sanity/schemas/documents/productPage.ts
defineField({
  name: 'blocks',
  type: 'array',
  of: [
    defineArrayMember({ type: 'pricingBlock' }), // Add this!
    // ... other blocks
  ],
}),
```

### 2. Navigation prependItems Duplication

**Problem:** `NavDropdownSection` uses `prependItems` to add overview links, but if the same `href` exists in the main items array, you get duplicate key errors.

**Solution:** Remove overview items from `NavigationData.ts` when they're added via `prependItems`:

```typescript
// WRONG - causes duplicate /services key
prependItems={[{ name: 'Services Overview', href: '/services' }]}
items={managedITItems} // Also contains href: '/services'

// RIGHT - remove from managedITItems
// Note: "/services" overview link is added via prependItems in NavigationMenu.tsx
export const managedITItems: NavigationItem[] = [
  // NO entry for /services here
  { name: "Small Business IT", href: "/services/small-business" },
  // ...
];
```

### 3. Explicit Hex Colors for Reliability

CSS variables like `bg-primary` sometimes don't render correctly. Use explicit hex:

```tsx
// Instead of
className="bg-primary hover:bg-primary/90"

// Use
className="bg-[#F5831F] hover:bg-[#e0721a]"
```

### 4. Card Design with Icon Badges

For step cards with number badges, put the badge ON the icon circle, not the card corner:

```tsx
<div className="relative">
  {/* Icon circle */}
  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5831F]/15 to-[#F5831F]/5 flex items-center justify-center">
    <IconComponent className="w-10 h-10 text-[#F5831F]" />
  </div>
  {/* Step badge on icon */}
  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#F5831F] text-white text-sm font-bold flex items-center justify-center">
    {step.number}
  </div>
</div>
```

### 5. Pricing Bar Button Styling

White border button on dark background:

```tsx
<Button
  variant="outline"
  className="border-2 border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-slate-900 transition-all duration-200"
>
```

## Gemini Hero Image Generation

### Workflow

1. Generate image with Gemini API:
```python
export GEMINI_API_KEY=$(grep "^GEMINI_API_KEY" .env.local | cut -d'=' -f2)

# Use gemini-3.1-flash-image-preview
# Aspect ratio: 16:9 for hero images
# Resolution: 2K for quality
```

2. Upload to Sanity:
```typescript
const client = createClient({
  projectId: '7iqq2t7l',  // CORRECT project ID
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
});

const asset = await client.assets.upload('image', imageBuffer, {
  filename: 'product-hero.jpg',
});

await client.patch(productId).set({
  heroImage: {
    _type: 'image',
    asset: { _type: 'reference', _ref: asset._id },
  },
}).commit();
```

### Prompt Template for Business Product Hero

```
A photorealistic wide-angle shot of a modern small business office environment
with a diverse team of professionals collaborating around a sleek conference table.
The scene features contemporary office design with glass partitions and warm lighting.
In the background, subtle visual elements suggest connectivity - a router with glowing
blue LED indicators, wireless signal waves visualized as subtle translucent arcs.
The color palette emphasizes professional navy blue tones with warm orange accent lighting.
Natural daylight streams through large windows, creating an optimistic atmosphere.
Shot with a 24mm wide-angle lens, f/2.8, commercial photography quality.
No text or logos visible.
```

## Sanity Configuration

**CRITICAL:** Use the correct project ID from `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=7iqq2t7l  # CircleTel project
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=sk...  # For write operations
```

## Files Modified

- `components/sanity/blocks/PricingBlock.tsx` - Dual-format prop support
- `components/products/ProductHowItWorks.tsx` - Card redesign with icon badges
- `components/products/WhyCircleTel.tsx` - Reduced padding
- `app/products/[slug]/page.tsx` - CTA button fixes, pricing bar button
- `lib/sanity/schemas/documents/productPage.ts` - Added pricingBlock to allowed blocks
- `components/navigation/NavigationData.ts` - Removed duplicate href entries

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| pricingBlock not showing | Add to productPage.blocks schema |
| Duplicate key in nav | Don't duplicate prependItems hrefs in items array |
| Colors not rendering | Use explicit hex instead of CSS variables |
| Badge clipped by overflow | Put badge on icon circle, not card corner |
| Sanity upload fails | Check project ID matches NEXT_PUBLIC_SANITY_PROJECT_ID |
