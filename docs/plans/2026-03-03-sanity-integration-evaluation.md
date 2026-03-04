# Sanity.io Integration Evaluation Plan

## Context

**Goal**: Evaluate replacing Prismic with Sanity.io as the headless CMS for CircleTel

**Motivations**:
- Developer preference for code-first approach
- Real-time collaboration for content editors
- More customization than Prismic Slice Machine
- Must maintain marketing-friendly interface for sales/marketing team

**Current State**:
- 16 files with Prismic imports (~2,100 LOC)
- 7 slice components, 5 page routes
- 5 content types: page, homepage, product_page, service_page, resource_page
- Mixed content team (developers + marketers)

---

## Phase 1: Sanity Compatibility Verification (2-3 hours)

### 1.1 Technical Compatibility Check

**Verify Next.js 15 Support**:
```bash
# Create test Sanity project
npx create-sanity@latest --template nextjs-app-router-live-preview
```

**Confirm compatibility with**:
- Next.js 15.1.9 App Router ✓
- TypeScript strict mode ✓
- Vercel deployment ✓
- Server Components ✓

### 1.2 Feature Mapping

| Prismic Feature | Sanity Equivalent | Notes |
|-----------------|-------------------|-------|
| Slice Machine | Portable Text + Custom Components | More flexible |
| PrismicRichText | PortableText component | Requires custom serializers |
| PrismicNextImage | sanity-image-loader | Native Next.js Image support |
| Draft Mode | Presentation API | Real-time preview |
| SliceZone | Custom block types | Define in schema |

### 1.3 Sanity Studio Customization for Marketing Team

Sanity Studio can be customized with:
- **Structure Builder**: Organize content by type (Products, Pages, Resources)
- **Custom Input Components**: Drag-drop builders, color pickers, preview panels
- **Validation Rules**: Prevent publishing without required fields
- **Role-Based Access**: Restrict technical fields from marketing users

---

## Phase 2: Proof of Concept (1-2 days)

### 2.1 Set Up Sanity Project

```bash
# In circletel root
mkdir sanity-studio
cd sanity-studio
npm create sanity@latest -- --project circletel --dataset production
```

### 2.2 Define Schema (Map Prismic Content Types)

**schemas/page.ts**:
```typescript
export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'content', type: 'array', of: [{ type: 'block' }, ...sliceTypes] }),
    defineField({ name: 'seo', type: 'seo' }), // Reusable SEO object
  ],
})
```

**Equivalent schemas needed**:
- `page.ts` - Generic pages
- `productPage.ts` - Product pages with hero, features, pricing
- `servicePage.ts` - Service pages
- `homepage.ts` - Homepage with segments

### 2.3 Create Block Types (Slice Equivalents)

Map the 7 Prismic slices to Sanity block types:

| Prismic Slice | Sanity Block | Fields |
|---------------|--------------|--------|
| HeroSection | heroBlock | headline, subheadline, cta, backgroundImage |
| FeatureGrid | featureGridBlock | title, features[] |
| PricingTable | pricingBlock | title, tiers[] |
| FAQ | faqBlock | title, items[] |
| ComparisonTable | comparisonBlock | columns, rows |
| CaseStudy | testimonialBlock | quote, author, company |
| Recipe | productShowcaseBlock | title, ingredients, cta |

### 2.4 Test Data Fetching

**lib/sanity/client.ts**:
```typescript
import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
})

export async function getPageBySlug(slug: string) {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug][0]`,
    { slug }
  )
}
```

---

## Phase 3: Migration Strategy (If POC Succeeds)

### 3.1 Parallel Operation Period

Run both CMSes during migration:
1. Keep Prismic live for current pages
2. Build new pages in Sanity
3. Migrate content type by type

### 3.2 Content Migration Order

1. **Homepage** - Highest visibility, test all block types
2. **Product Pages** - Core business content
3. **Service Pages** - Secondary content
4. **Resource Pages** - Lower priority
5. **Generic Pages** - Last

### 3.3 Code Migration Checklist

**Phase 3a: Client Setup (Day 1)**
- [ ] Install `next-sanity`, `@sanity/image-url`
- [ ] Create `lib/sanity/client.ts`
- [ ] Create `lib/sanity/queries.ts` (GROQ queries)
- [ ] Set up environment variables

**Phase 3b: Block Components (Days 2-3)**
- [ ] Create `components/sanity/` directory
- [ ] Migrate HeroSection → HeroBlock
- [ ] Migrate FeatureGrid → FeatureGridBlock
- [ ] Migrate PricingTable → PricingBlock
- [ ] Migrate FAQ → FAQBlock
- [ ] Migrate ComparisonTable → ComparisonBlock
- [ ] Migrate CaseStudy → TestimonialBlock
- [ ] Migrate Recipe → ProductShowcaseBlock
- [ ] Create PortableText serializers

**Phase 3c: Page Routes (Days 4-5)**
- [ ] Update `app/[slug]/page.tsx` to use Sanity
- [ ] Update `app/product/[uid]/page.tsx`
- [ ] Update `app/services/[slug]/page.tsx`
- [ ] Update `app/resources/[slug]/page.tsx`
- [ ] Update `generateStaticParams()` for SSG
- [ ] Update `generateMetadata()` for SEO

**Phase 3d: Cleanup (Day 6)**
- [ ] Remove `@prismicio/*` packages
- [ ] Delete `lib/prismicio.ts`, `lib/prismic/`
- [ ] Delete `slices/` directory
- [ ] Delete `prismicio-types.d.ts`
- [ ] Remove `slicemachine.config.json`

---

## Phase 4: Sanity Studio Configuration for Marketing Team

### 4.1 Structure Builder (User-Friendly Navigation)

```typescript
// sanity-studio/structure.ts
export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Pages')
        .icon(DocumentIcon)
        .child(S.documentTypeList('page')),
      S.listItem()
        .title('Products')
        .icon(PackageIcon)
        .child(S.documentTypeList('productPage')),
      S.divider(),
      S.listItem()
        .title('Settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings')),
    ])
```

### 4.2 Marketing-Friendly Features

- **Visual Preview Panel**: Real-time preview alongside editor
- **Scheduled Publishing**: Built-in scheduling
- **Version History**: Compare and restore previous versions
- **Collaboration**: Comments, presence indicators, real-time sync
- **Permissions**: Hide technical fields from marketing role

---

## Files to Modify/Create

### New Files (Sanity Setup)
```
sanity-studio/                    # Sanity Studio project
├── sanity.config.ts              # Studio configuration
├── schemas/                      # Content schemas
│   ├── page.ts
│   ├── productPage.ts
│   ├── servicePage.ts
│   └── blocks/                   # Block type schemas
│       ├── heroBlock.ts
│       ├── featureGridBlock.ts
│       └── ...
└── structure.ts                  # Custom studio structure

lib/sanity/                       # Sanity client
├── client.ts                     # GROQ client
├── queries.ts                    # Reusable queries
└── image.ts                      # Image URL builder

components/sanity/                # Block components
├── PortableTextComponents.tsx    # Custom serializers
├── HeroBlock.tsx
├── FeatureGridBlock.tsx
└── ...
```

### Files to Modify
```
app/[slug]/page.tsx               # Switch to Sanity client
app/product/[uid]/page.tsx        # Switch to Sanity client
app/services/[slug]/page.tsx      # Switch to Sanity client
app/resources/[slug]/page.tsx     # Switch to Sanity client
package.json                      # Swap dependencies
.env.local                        # Add Sanity env vars
```

### Files to Delete (After Migration)
```
lib/prismicio.ts
lib/prismic/
slices/
prismicio.ts
prismicio-types.d.ts
slicemachine.config.json
```

---

## Environment Variables (New)

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=<project-id>
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=<write-token>  # For preview/mutations
```

---

## Verification Steps

### After Phase 1 (Compatibility)
- [ ] Sanity project created successfully
- [ ] Studio runs locally at http://localhost:3333
- [ ] Next.js 15 compatible (no peer dependency issues)

### After Phase 2 (POC)
- [ ] Schema matches Prismic content types
- [ ] GROQ queries return expected data shape
- [ ] Block components render correctly
- [ ] Images load via Sanity CDN

### After Phase 3 (Migration)
- [ ] All 5 page routes work with Sanity
- [ ] SSG builds successfully (`npm run build`)
- [ ] SEO metadata generates correctly
- [ ] No Prismic imports remain in codebase

### After Phase 4 (Studio)
- [ ] Marketing team can navigate Studio easily
- [ ] Content preview works in real-time
- [ ] Role permissions configured
- [ ] Documentation provided to team

---

## Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Compatibility | 2-3 hours | Low |
| Phase 2: POC | 1-2 days | Medium |
| Phase 3: Migration | 5-6 days | High |
| Phase 4: Studio Setup | 1-2 days | Medium |
| **Total** | **8-11 days** | - |

---

## Decision Point

After Phase 2 (POC), evaluate:

1. **Proceed with migration** if:
   - GROQ queries are intuitive
   - Studio customization meets marketing needs
   - No blocking compatibility issues

2. **Stay with Prismic** if:
   - GROQ learning curve is too steep
   - Studio requires excessive customization
   - Content migration is too complex

---

## Sources

- [Sanity vs Prismic Comparison](https://www.sanity.io/sanity-vs-prismic)
- [Sanity Next.js CMS Guide](https://www.sanity.io/nextjs-cms)
- [Headless CMS Comparison 2026](https://www.cosmicjs.com/blog/headless-cms-comparison-2026-cosmic-contentful-strapi-sanity-prismic-hygraph)
- [Best Next.js Headless CMS Platforms](https://prismic.io/blog/best-nextjs-headless-cms-platforms)
