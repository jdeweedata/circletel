# Payload CMS + Image Generation + Product Pages Rework

**Date**: 2026-06-01
**Status**: Awaiting approval

---

## Goal

Replace the custom drag-and-drop CMS builder with Payload CMS. Wire OpenRouter image generation into the content workflow. Rework product pages from hardcoded data to Payload-driven. Remove the custom builder entirely.

---

## Current State

### What Exists
| Component | Location | Description |
|-----------|----------|-------------|
| Custom CMS builder | `app/admin/cms/` (3 page.tsx) + `components/admin/cms/` (10 components) + `lib/cms/` (6 files) | Drag-and-drop builder, 12 block types, 5 content types |
| Product pages | `app/products/[slug]/` | Hardcoded data in `lib/data/product-data.ts` (2050 lines, ~10 products) |
| Hardware products | `app/products/hardware/[slug]/` | Supplier pipeline-driven, `circletel_hardware_products` table |
| CMS DB tables | Supabase: `cms_pages`, `cms_templates`, `cms_media`, `cms_page_versions` | Existing tables, originally built for Prismic integration |
| Image gen scripts | `/root/hermes-image-test/` | Python scripts calling OpenRouter chat API directly |
| OpenRouter key | `~/.hermes/config.yaml` custom_providers | Already configured |

### Pain Points
- Product data is 2050 lines of TypeScript — marketing can't touch it
- Custom CMS builder is developer-only (JSON properties panel, no WYSIWYG)
- No image generation in the content workflow
- `cms_pages` table mentions "Prismic" — legacy name, repurposed for custom builder
- Two product page systems (`[slug]` hardcoded + `hardware/[slug]` pipeline) — confusing

---

## Architecture Decision: Embedded Payload in Next.js

**Payload 3.0+ runs natively inside Next.js App Router.** This is the recommended approach — no separate server, no extra Docker container. Payload becomes a set of routes under `/admin/payload/` and APIs under `/api/payload/`.

### Why Embedded
- Single deployment artifact (already `output: 'standalone'` for Docker/Coolify)
- Shares the same Supabase Postgres connection
- Auth reuses existing Supabase session (middleware already handles admin routes)
- No additional infrastructure, no new Coolify service

### Database Strategy
Payload creates its own tables with `payload_` prefix in the same Supabase Postgres database. Existing `cms_pages` table gets dropped after migration. Supplier pipeline tables (`circletel_hardware_products`, `supplier_products`, etc.) stay untouched.

---

## Step-by-Step Plan

### Phase 1: Install & Configure Payload (~30 min)

1. **Install packages**
   ```bash
   cd /home/circletel
   npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/plugin-seo
   ```

2. **Add Payload config** (`payload.config.ts` at repo root)
   - Database: Postgres adapter pointing to same Supabase URL as Next.js
   - Admin: `/admin/payload` route, use existing Supabase auth
   - Upload: Media collection with Supabase storage adapter

3. **Create Payload route handlers**
   - `app/(payload)/admin/[[...segments]]/page.tsx` — admin UI
   - `app/(payload)/admin/[[...segments]]/not-found.tsx`
   - `app/(payload)/api/[[...segments]]/route.ts` — REST + GraphQL APIs

4. **Update next.config.js**
   - Add `@payloadcms/next` to `serverExternalPackages`
   - Payload bundles its own deps, needs exclusion from webpack

5. **Environment variables** (add to `.env.local`)
   ```
   PAYLOAD_SECRET=<generated>
   PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
   ```

### Phase 2: Collections (~1 hr)

Create the following Payload collections with Lexical rich text editor:

**Blog Posts** (`payload/collections/BlogPosts.ts`)
- title, slug (auto from title), author (relationship to users)
- featuredImage (upload to media)
- content (Lexical rich text with image embeds)
- excerpt, categories (multi-select), tags
- status: draft/published/archived
- SEO fields (meta title, meta description, OG image)
- publishedAt
- One-click "Generate Hero Image" button that calls the image gen API

**Pages** (`payload/collections/Pages.ts`)
- title, slug, content (Lexical rich text)
- template (default, landing, narrow)
- status: draft/published/archived
- SEO fields
- Replaces: About Us, Terms, Privacy Policy, Contact, Services pages

**Products** (`payload/collections/Products.ts`)
- name, slug, category (business, home, wireless)
- tagline, description (Lexical)
- heroImage, gallery (array of uploads)
- pricing: startingPrice, priceNote
- keyFeatures (array of { title, description, icon })
- specifications (array of { label, value })
- blocks (relationship to block templates — optional, for custom layouts)
- status: draft/published/archived
- SEO fields
- Migrates: existing hardcoded products from `product-data.ts`

**Media** (`payload/collections/Media.ts`)
- Standard Payload upload collection
- alt text, credit
- Reuses Supabase storage bucket

**Hardware Products** (optional bridge)
- Either: read-only view of `circletel_hardware_products` via custom endpoint
- Or: Payload hooks that sync curated hardware into the `Products` collection
- Decision: keep supplier pipeline feeding `circletel_hardware_products` directly. Add a "Promote to Store" button in Payload that copies into Products.

### Phase 3: Image Generation Endpoint (~45 min)

1. **Create API route** `app/api/images/generate/route.ts`
   ```typescript
   // POST /api/images/generate
   // { prompt, style, aspect, model? }
   // -> { url: "https://circletel.co.za/media/gen_abc123.png" }
   ```

2. **Service layer** `lib/services/image-generation.ts`
   - Loads OpenRouter API key from `PAYLOAD_SECRET` env (or dedicated `OPENROUTER_API_KEY`)
   - Maps style to model: product->gpt-5-image-mini, blog_hero->gpt-5-image-mini, wireframe->nano-banana-2, icon->recraft-vector
   - Calls OpenRouter chat completions API with `modalities: ["image", "text"]`
   - Downloads base64 image, uploads to Supabase storage via Payload Local API
   - Returns public URL

3. **Wire into Payload Admin UI**
   - Custom component: "Generate Image" button in Blog Posts and Products collections
   - Opens modal: prompt textarea, style dropdown, aspect ratio selector
   - On generate: shows preview, saves to media collection, attaches to post

### Phase 4: Rework Product Pages (~1 hr)

**Current**: `app/products/[slug]/page.tsx` reads from `lib/data/product-data.ts` (hardcoded array)

**New**: 
- Payload Products collection stores all product data
- `app/products/[slug]/page.tsx` queries Payload Local API at build time
- `/products` listing page queries all published products
- `generateStaticParams` reads slugs from Payload

**Product page components stay mostly the same** — `ProductPageHero`, `FeatureGrid`, `SpecificationTable`, `WhyCircleTel`, `RelatedProducts`, `LivePricingBar` — they just get their data from Payload instead of hardcoded TypeScript.

**Hardware products** remain separate at `/products/hardware/[slug]` — these are supplier-feed-driven and use a different data model. They stay on Next.js dynamic routes. A future step could bridge them into Payload.

### Phase 5: Remove Custom Builder (~20 min)

Delete or archive:
- `app/admin/cms/` (3 files: page.tsx, builder/page.tsx, media/page.tsx)
- `components/admin/cms/` (10 files)
- `lib/cms/` (6 files: types.ts, store.ts, block-registry.ts, ai-service.ts, index.ts, usage-tracking.ts)
- Remove `cms_pages`, `cms_templates`, `cms_media`, `cms_page_versions` tables from Supabase (via migration)
- Remove admin sidebar nav links to `/admin/cms`
- Redirect `/admin/cms` -> `/admin/payload`

---

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `payload.config.ts` | Payload configuration |
| `payload/collections/BlogPosts.ts` | Blog post collection |
| `payload/collections/Pages.ts` | Content pages collection |
| `payload/collections/Products.ts` | Product collection |
| `payload/collections/Media.ts` | Media uploads collection |
| `payload/collections/Users.ts` | Admin users (bridged to Supabase auth) |
| `app/(payload)/admin/[[...segments]]/page.tsx` | Payload admin UI |
| `app/(payload)/admin/[[...segments]]/not-found.tsx` | Admin not-found |
| `app/(payload)/api/[[...segments]]/route.ts` | Payload REST/GraphQL API |
| `app/api/images/generate/route.ts` | Image gen API endpoint |
| `lib/services/image-generation.ts` | OpenRouter image service |
| `payload/components/GenerateImageButton.tsx` | Custom Payload admin component |
| `scripts/migrate-products-to-payload.ts` | Seed script for existing products |

### Modified Files
| File | Change |
|------|--------|
| `next.config.js` | Add `@payloadcms/next` to serverExternalPackages |
| `package.json` | Add payload + deps |
| `.env.local` | Add PAYLOAD_SECRET, PAYLOAD_PUBLIC_SERVER_URL |
| `app/products/[slug]/page.tsx` | Read from Payload instead of product-data.ts |
| `app/products/page.tsx` | Read from Payload |
| `app/admin/layout.tsx` | Update sidebar nav |
| `middleware.ts` | Add Payload admin route protection |

### Deleted Files
| File | Reason |
|------|--------|
| `app/admin/cms/page.tsx` | Replaced by Payload admin |
| `app/admin/cms/builder/page.tsx` | Removed per user request |
| `app/admin/cms/media/page.tsx` | Replaced by Payload media |
| `components/admin/cms/*.tsx` (10 files) | Builder components removed |
| `lib/cms/*.ts` (6 files) | CMS types/store/registry removed |
| `lib/data/product-data.ts` | Products migrated to Payload |
| `lib/data/products.ts` | Thin wrapper, no longer needed |
| `supabase/migrations/archive/20251125000001_cms_page_builder_part1_tables.sql` | Archived |

### Database Migration
New migration to drop legacy CMS tables:
```sql
DROP TABLE IF EXISTS cms_page_versions CASCADE;
DROP TABLE IF EXISTS cms_media CASCADE;
DROP TABLE IF EXISTS cms_templates CASCADE;
DROP TABLE IF EXISTS cms_pages CASCADE;
DROP FUNCTION IF EXISTS get_cms_media_path(text);
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Payload embedded build increases memory | Already using `--max-old-space-size=8192` for builds. Payload adds ~200KB to server bundle |
| Payload admin auth vs Supabase auth conflict | Payload can use Supabase as auth provider. Existing admin middleware protects routes before Payload even loads |
| Standalone output with Payload | Payload 3.0 is designed for Next.js standalone. Add `@payloadcms/next` to serverExternalPackages |
| Existing CMS pages in production | Check DB for live `cms_pages` records before dropping table. Migrate any live pages to Payload |
| Product URLs changing | Slugs stay the same — `/products/bizfibreconnect` etc. No redirects needed |
| OpenRouter API key exposure | Server-side API route only. Key stays in env, never sent to client |

---

## Open Questions

1. **Product pages vs Product CMS pages**: Do you want all product pages in Payload, or keep the dynamic data (live pricing, coverage) on the Next.js side and only store marketing content (descriptions, images, features) in Payload? Proposed: hybrid — Payload stores content, Next.js overlays live pricing at render time.

2. **Hardware products bridge**: Should Payload mirror `circletel_hardware_products` as a read-only collection, or keep them entirely separate with a "promote" workflow? Proposed: keep separate, add promote button.

3. **Existing CMS pages**: Are there live pages in the current `cms_pages` table that need migrating, or is it all test/dev data?

4. **Payload admin access**: Same Supabase auth, or separate Payload user accounts? Proposed: same Supabase auth — admins logged into CircleTel admin automatically get Payload access.

---

## Validation

After each phase:
- Phase 1: `npm run dev` — Payload admin loads at `/admin/payload`
- Phase 2: Create a test blog post and page in Payload admin
- Phase 3: `curl -X POST /api/images/generate` returns a valid image URL
- Phase 4: `/products/bizfibreconnect` renders from Payload data
- Phase 5: `npm run type-check` passes, no broken imports
