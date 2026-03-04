# Sanity CMS Integration Learnings

**Date:** 2026-03-03
**Session:** WorkConnect Product Pages Implementation

## Summary

Integrated Sanity CMS for WorkConnect SOHO product pages with AI-generated images, dynamic Next.js pages, and Vercel deployment.

## Key Patterns

### 1. Sanity Client Setup with Fallbacks

**Problem:** Client initialization fails during Next.js build when env vars are undefined.

**Solution:** Always provide fallback values:

```typescript
// lib/sanity/client.ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export const client = createClient({
  projectId,  // Uses fallback if env var missing
  dataset,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
});
```

### 2. Next.js Image Remote Patterns for Sanity CDN

**Problem:** Runtime error "hostname cdn.sanity.io not configured"

**Solution:** Add to `next.config.js`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'cdn.sanity.io',
      port: '',
      pathname: '/images/**'
    }
  ]
}
```

### 3. GROQ Queries for Product Pages

**Pattern:** Fetch product with related data in single query:

```groq
*[_type == "productPage" && slug.current == $slug][0] {
  _id, name, tagline, "slug": slug.current, category,
  heroImage { asset->{ _id, url } },
  pricing { startingPrice, priceNote },
  keyFeatures[] { title, description, icon },
  specifications[] { label, value },
  seo { metaTitle, metaDescription }
}
```

### 4. Dynamic Product Page with ISR

**Pattern:** Server component with incremental static regeneration:

```typescript
// app/workconnect/[slug]/page.tsx
export const revalidate = 3600; // 1 hour

export async function generateStaticParams() {
  const slugs = await client.fetch(WORKCONNECT_SLUGS_QUERY);
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;  // Next.js 15 async params
  const product = await client.fetch(WORKCONNECT_PRODUCT_QUERY, { slug });
  if (!product) notFound();
  // ...
}
```

## Friction Points

### Vercel Env Vars with Newlines

**Symptom:** Build fails with "projectId can only contain a-z, 0-9 and dashes"

**Cause:** Using `echo "value" | vercel env add` adds `\n` to value

**Fix:**
```bash
# WRONG - adds newline
echo "7iqq2t7l" | vercel env add VAR production

# CORRECT - no newline
vercel env add VAR production --value 7iqq2t7l --yes
```

**Verify:** `vercel env pull .env.check && cat .env.check`

### Sanity Seeder Script

**Location:** `sanity-studio/scripts/seed-workconnect-products.ts`

**Usage:**
```bash
SANITY_API_TOKEN=<token> npx tsx scripts/seed-workconnect-products.ts
```

**Key steps:**
1. Upload images with `client.assets.upload('image', buffer)`
2. Create documents with `client.createOrReplace(doc)`
3. Reference images: `{ _type: 'image', asset: { _ref: assetId } }`

## Files Created

| File | Purpose |
|------|---------|
| `lib/sanity/client.ts` | Read/write Sanity clients |
| `lib/sanity/image.ts` | Image URL builder |
| `lib/sanity/queries.ts` | GROQ queries |
| `app/workconnect/page.tsx` | Plan comparison |
| `app/workconnect/[slug]/page.tsx` | Dynamic product page |
| `app/(marketing)/soho/SOHOContent.tsx` | Client component |
| `sanity-studio/scripts/seed-workconnect-products.ts` | Data seeder |

## Time Savings

- Sanity client setup: ~30 min → 5 min (with this pattern)
- Vercel env debugging: ~45 min → 0 min (use `--value` flag)
- CDN configuration: ~15 min → 2 min (add to remotePatterns)

## Related

- Product spec: `products/connectivity/soho/CircleTel_WorkConnect_SOHO_Product_Portfolio_v1_1.md`
- Design plan: `docs/plans/2026-03-03-workconnect-product-pages-design.md`
