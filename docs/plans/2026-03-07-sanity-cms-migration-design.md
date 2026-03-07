# Sanity CMS Migration Design

**Date:** 2026-03-07
**Status:** Approved
**Approach:** Option B - Phased Rollout (2 phases)

## Overview

Replace CircleTel's custom CMS (`lib/cms/`) with Sanity Studio as the single content management system. Embed Studio at `/studio` in the Next.js app, providing a WordPress-like experience for the marketing team.

### Goals

- Single CMS for all marketing content (no sync tax)
- Marketing team independence (no developer bottleneck)
- Fast publishing with on-demand ISR
- Phase 2: Visual Editing with click-to-edit overlays

### Non-Goals (Phase 1)

- AI asset generation in Studio (external workflow for now)
- Full Visual Editing with Presentation tool (Phase 2)
- Document-level access control (simplified roles for Phase 1)

---

## Phase 1 Scope (Weeks 1-2)

| Deliverable | Description |
|-------------|-------------|
| Embedded Studio | `/studio` route with isolated layout |
| 5 new document types | `post`, `teamMember`, `campaign`, `resource`, `category` |
| 6 new blocks | `textBlock`, `imageBlock`, `ctaBlock`, `formBlock`, `separatorBlock`, `galleryBlock` |
| Webhook revalidation | Tag-based ISR on publish |
| Rendering registry | 13-block renderer with shared primitives |
| Custom CMS retirement | Read-only after verification |

## Phase 2 Scope (Weeks 3-4)

| Deliverable | Description |
|-------------|-------------|
| Visual Editing | Presentation tool + click-to-edit overlays |
| Draft mode | Preview unpublished content |
| SanityLive | Real-time preview updates |
| Canvas | AI-assisted writing environment |
| Workflow plugin | Draft → Review → Approved → Published |

---

## 1. Route Architecture

### File Structure

```
app/
├── (studio)/
│   └── studio/
│       └── [[...index]]/
│           └── page.tsx      # Catch-all for Sanity Studio
├── api/
│   └── sanity/
│       ├── revalidate/
│       │   └── route.ts      # POST + parseBody signature verification
│       └── draft/
│           └── route.ts      # GET + defineEnableDraftMode (Phase 2)

lib/
└── sanity/
    ├── client.ts             # Sanity client
    ├── fetch.ts              # Draft-aware fetch helper
    ├── queries.ts            # GROQ queries
    ├── image.ts              # Image URL builder
    ├── revalidation.ts       # Tag/path mapping
    ├── types.ts              # TypeScript types
    ├── live.ts               # SanityLive (Phase 2)
    └── schemas/
        ├── index.ts
        ├── documents/
        └── blocks/

sanity.config.ts              # Root config with basePath: '/studio'
```

### Key Decisions

- Route group `(studio)` isolates Studio layout from main app
- `basePath: '/studio'` in sanity.config.ts
- Schemas moved from `/sanity-studio/` to `/lib/sanity/schemas/`
- Centralized fetch layer for future draft-mode support

---

## 2. Schema Inventory

### Document Types (9 total)

| Document | Status | Key Fields |
|----------|--------|------------|
| `page` | Exists | `title`, `slug`, `seo`, `sections[]`, `language` |
| `homepage` | Exists | Singleton, `sections[]` |
| `productPage` | Exists | `title`, `slug`, `product`, `sections[]`, `language` |
| `siteSettings` | Exists | Singleton, nav, footer, contact |
| `testimonial` | Exists | `quote`, `author`, `role`, `company`, `avatar` |
| `post` | New | `title`, `slug`, `excerpt`, `featuredImage`, `author`, `categories`, `publishedAt`, `body`, `seo`, `language` |
| `teamMember` | New | `name`, `slug`, `role`, `department`, `photo`, `bio`, `email`, `linkedin`, `order` |
| `campaign` | New | `title`, `slug`, `campaignType`, `startDate`, `endDate`, `targetPages`, `targetAudience`, `headline`, `description`, `image`, `cta`, `priority`, `isDismissible`, `placement`, `isEnabled`, `utmCampaign` |
| `resource` | New | `title`, `slug`, `resourceType`, `description`, `thumbnail`, `accessLevel`, `file`, `externalUrl`, `body`, `categories`, `products`, `publishedAt`, `seo`, `language`, `isEnabled` |
| `category` | New | `title`, `slug`, `description` |

### Schema Conventions

- All image fields include embedded `alt` text
- `language` field on content documents for future i18n
- `isEnabled` manual override on `campaign` and `resource`
- `accessLevel` on `resource` is app-layer enforcement (not CMS security)

---

## 3. Block Contract

### All Blocks (13 total)

| Block | Status | Category |
|-------|--------|----------|
| `heroBlock` | Exists | Layout |
| `featureGridBlock` | Exists | Content |
| `pricingBlock` | Exists | Conversion |
| `faqBlock` | Exists | Content |
| `comparisonBlock` | Exists | Content |
| `testimonialBlock` | Exists | Content |
| `productShowcaseBlock` | Exists | Conversion |
| `textBlock` | New | Content |
| `imageBlock` | New | Media |
| `ctaBlock` | New | Conversion |
| `formBlock` | New | Conversion |
| `separatorBlock` | New | Utility |
| `galleryBlock` | New | Media |

### Cross-Cutting Fields (all blocks)

```typescript
{
  anchorId: string        // For in-page navigation
  theme: 'default' | 'light' | 'dark' | 'brand'
  paddingTop: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingBottom: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hideOn: 'mobile' | 'desktop' | 'none'
}
```

### Block-Specific Notes

- `textBlock`: Optional `eyebrow`, `title` for intro patterns
- `imageBlock`: Reusable `link` object (internal/external/tracking)
- `formBlock`: `formProvider` enum + `formId` (no raw webhookUrl)
- `separatorBlock`: `mode: 'divider' | 'spacer'`
- `galleryBlock`: `lightbox` as boolean, `max: 12` validation

---

## 4. Rendering Registry

### Architecture

```
components/sanity/
├── BlockRenderer.tsx        # Main dispatcher
├── blocks/
│   ├── index.ts             # Typed registry
│   └── [13 block components]
└── primitives/
    ├── PortableText.tsx     # @portabletext/react
    ├── SanityImage.tsx      # Hotspot + responsive
    └── SanityLink.tsx       # Internal/external unified
```

### Renderer Contract

```tsx
// Unified wrapper for all blocks
<section
  key={section._key}
  id={section.anchorId}
  data-block-type={section._type}
  data-theme={section.theme || 'default'}
  className={cn(
    getPaddingClasses(section.paddingTop, section.paddingBottom),
    getVisibilityClasses(section.hideOn)
  )}
>
  <Component {...section} />
</section>
```

### Registry Typing

```typescript
// Strongly typed, not Record<string, any>
type BlockRegistry = {
  [K in BlockType]: React.ComponentType<BlockProps[K]>
}
```

### Phase 2 Prep

- Centralized fetch layer for draft-mode awareness
- Stega-enabled client for Visual Editing
- Unknown block types logged to Sentry (not just console.warn)

---

## 5. Webhook & Revalidation

### Flow

```
Sanity Publish → Webhook (GROQ projection) → /api/sanity/revalidate
    → revalidateTag(tag, 'max') for most updates
    → revalidatePath() for slug changes/deletions
    → Sentry logging for audit trail
```

### Tag Strategy

| Document Type | Tags |
|---------------|------|
| `page` | `page:${slug}`, `pages`, `navigation` |
| `homepage` | `homepage`, `navigation` |
| `productPage` | `product:${slug}`, `products`, `pricing` |
| `post` | `post:${slug}`, `posts`, `blog`, `recent-posts` |
| `campaign` | `campaigns`, `active-campaigns`, `banners` |
| `resource` | `resource:${slug}`, `resources`, `resource-library` |
| `teamMember` | `team`, `about` |
| `siteSettings` | `site-settings`, `navigation`, `footer`, `contact` |
| `testimonial` | `testimonials` |

### Webhook Configuration

| Setting | Value |
|---------|-------|
| URL | `https://www.circletel.co.za/api/sanity/revalidate` |
| Method | POST |
| Secret | `SANITY_WEBHOOK_SECRET` |
| Trigger | Create, Update, Delete |
| Filter | `_type in ["page", "homepage", ...]` |

### Implementation Notes

- Use `revalidateTag(tag, 'max')` (two-argument form)
- Return 400 when `_type` missing
- Guard slug-null before path revalidation
- Enable webhook only after cache-tagged fetches are live

---

## 6. Migration Plan

### Phase 1 Timeline

| Day | Tasks |
|-----|-------|
| 1-2 | Studio embedding, file reorganization |
| 3-4 | New schemas, block contracts |
| 5 | Webhook setup, revalidation testing |
| 6-7 | Block renderers, primitives |
| 8 | Page templates, GROQ queries |
| 9 | Testing, QA |
| 10 | Production cutover |

### Cutover Sequence

1. Final deploy to production
2. Verify all pages render from Sanity
3. Test webhook revalidation end-to-end
4. 30-60 min content freeze
5. Mark custom CMS as read-only
6. Update team documentation
7. Notify marketing: "Use /studio for all content"

### Rollback Order

1. Revert page routes (custom CMS still available)
2. Disable webhook in Sanity dashboard
3. Revert schema changes if needed (non-destructive)

### Custom CMS Deprecation

- Week 2: Read-only after verification
- Week 3+: Remove `lib/cms/` directory
- Week 3+: Remove custom CMS admin routes
- Week 4+: Remove database tables (after data verification)

---

## 7. Editor Roles

### Phase 1 Roles (Simplified)

| Role | Who | Permissions |
|------|-----|-------------|
| Administrator | Dev team | Full access |
| Editor | Marketing lead | Create/edit/publish all content |
| Author | Content writers | Create/edit posts/resources, no publish |
| Viewer | Stakeholders | Read-only Studio access |

### Phase 2 Additions

- Contributor role with document-level access
- Workflow plugin (Draft → Review → Approved → Published)
- Document-level restrictions via custom roles/content resources

### Implementation Notes

- Action filtering in `document.actions` is UX, not security
- Singletons hidden from "new document" menu
- True enforcement requires Sanity project roles

---

## Environment Variables

```env
# Existing
NEXT_PUBLIC_SANITY_PROJECT_ID=7iqq2t7l
NEXT_PUBLIC_SANITY_DATASET=production

# New
SANITY_API_READ_TOKEN=<token>      # For preview/draft mode
SANITY_WEBHOOK_SECRET=<secret>      # For webhook signature
```

---

## Success Criteria

### Phase 1 Complete When

- [ ] Studio accessible at `/studio`
- [ ] All 9 document types functional
- [ ] All 13 blocks render correctly
- [ ] Webhook fires on publish → cache clears within 30s
- [ ] Marketing team trained and using Studio
- [ ] Custom CMS read-only, no active usage
- [ ] No TypeScript errors
- [ ] Lighthouse score maintained

### Phase 2 Complete When

- [ ] Visual Editing overlays working
- [ ] Draft preview functional
- [ ] Canvas enabled for writers
- [ ] Workflow plugin configured
- [ ] Click-to-edit from live site to Studio

---

## References

- [Sanity Embedded Studio](https://www.sanity.io/docs/studio/embedding-sanity-studio)
- [Sanity Visual Editing + Next.js](https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router)
- [Next.js Revalidation](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Sanity Webhooks Guide](https://www.sanity.io/guides/sanity-webhooks-and-on-demand-revalidation-in-nextjs)
