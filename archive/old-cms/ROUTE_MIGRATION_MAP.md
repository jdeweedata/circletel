# CMS Route Migration Map

**Created:** November 24, 2025
**Purpose:** Document current CMS routes to ensure proper replacement in Prismic

---

## Admin Routes (Backend)

### Current Custom CMS Admin Routes

| Route | Purpose | Replacement in Prismic |
|-------|---------|------------------------|
| `/admin/cms` | CMS Dashboard (list all pages) | **Prismic Dashboard** (https://[repo-name].prismic.io) |
| `/admin/cms/create` | Create new page with AI generation | **Prismic: "Create New → Page"** + `/admin/ai-copy` for AI assist |
| `/admin/cms/edit/[id]` | Edit existing page | **Prismic: Edit document** (click page in dashboard) |
| `/admin/cms/media` | Media library management | **Prismic: Assets** (built-in media library) |
| `/admin/cms/settings` | CMS configuration | **Prismic: Settings** (repository settings) |
| `/admin/cms/usage` | AI usage tracking | **Keep as `/admin/ai-usage`** (for copywriter tool) |

### New Routes to Create

| Route | Purpose | Status |
|-------|---------|--------|
| `/admin/ai-copy` | AI copywriting assistant (Gemini 3) | **✅ TO CREATE** (Phase 5) |
| `/admin/ai-usage` | Track AI copywriter usage | **✅ TO CREATE** (Phase 5, rename from cms/usage) |

---

## Public Routes (Frontend)

### Current CMS Content Routes (TO DEPRECATE)

| Route | Purpose | Content Type | Replacement |
|-------|---------|--------------|-------------|
| `/cms-blog/[slug]` | Blog post detail page | `blog` | **`/blog/[uid]`** via Prismic |
| `/cms-blog` | Blog listing page | N/A | **`/blog`** via Prismic |
| `/cms-pages/[slug]` | Generic landing pages | `landing`, `case_study` | **`/[uid]`** via Prismic |
| `/cms-products/[slug]` | Product detail pages | `product` | **`/products/[uid]`** or **`/[uid]`** via Prismic |
| `/cms-products` | Product listing | N/A | **`/products`** via Prismic |

### New Prismic Routes to Create

| Route | Purpose | Prismic Type | Status |
|-------|---------|--------------|--------|
| `/[uid]/page.tsx` | Dynamic catch-all for all Prismic pages | `Page` (Custom Type) | **✅ TO CREATE** (Phase 4) |
| `/blog/[uid]/page.tsx` | Blog post detail (if separate from general pages) | `BlogPost` (Optional) | **⚠️ Optional** (can use `/[uid]`) |
| `/products/[uid]/page.tsx` | Product detail (if separate) | `Product` (Optional) | **⚠️ Optional** (can use `/[uid]`) |

---

## API Routes

### Current Custom CMS API Routes (TO DEPRECATE)

| Route | Method | Purpose | Replacement |
|-------|--------|---------|-------------|
| `/api/cms/pages` | GET | List all pages | **Prismic Client API** (`client.getAllByType('page')`) |
| `/api/cms/pages` | POST | Create new page | **Prismic: Dashboard or REST API** |
| `/api/cms/pages/[id]` | GET | Get page by ID | **Prismic Client API** (`client.getByID(id)`) |
| `/api/cms/pages/[id]` | PATCH | Update page | **Prismic: Dashboard or REST API** |
| `/api/cms/pages/[id]` | DELETE | Delete page | **Prismic: Dashboard or REST API** |
| `/api/cms/generate` | POST | AI content generation | **Keep as `/api/ai-copywriter/generate`** (Phase 5) |
| `/api/cms/media` | POST | Upload media | **Prismic: Assets upload** (via dashboard) |
| `/api/cms/usage` | GET | Get AI usage stats | **Keep as `/api/ai-usage/stats`** |

### New API Routes to Create

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/ai-copywriter/generate` | POST | Generate marketing copy with Gemini | **✅ TO CREATE** (Phase 5) |
| `/api/ai-usage/stats` | GET | Get usage statistics | **✅ TO CREATE** (Phase 5) |
| `/api/preview` | GET | Prismic preview/draft mode | **✅ TO CREATE** (Phase 2) |

---

## Redirects Configuration

Add these redirects to `next.config.js` after Prismic migration is complete:

```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      // Old CMS blog routes
      {
        source: '/cms-blog',
        destination: '/blog',
        permanent: true
      },
      {
        source: '/cms-blog/:slug',
        destination: '/blog/:slug',
        permanent: true
      },

      // Old CMS pages routes (generic landing pages)
      {
        source: '/cms-pages/:slug',
        destination: '/:slug',
        permanent: true
      },

      // Old CMS products routes
      {
        source: '/cms-products',
        destination: '/products',
        permanent: true
      },
      {
        source: '/cms-products/:slug',
        destination: '/products/:slug', // or '/:slug' if using catch-all
        permanent: true
      },

      // Old admin routes (for users with bookmarks)
      {
        source: '/admin/cms',
        destination: '/admin',
        permanent: false // Temporary redirect, not permanent
      },
      {
        source: '/admin/cms/:path*',
        destination: '/admin',
        permanent: false
      }
    ]
  }
}
```

---

## URL Slug Mapping

When creating content in Prismic, use these UID patterns to maintain SEO:

| Old Slug Example | New UID (Prismic) | Notes |
|------------------|-------------------|-------|
| `fiber-internet-for-business` | `fiber-internet-for-business` | Keep exact same slug |
| `blog/introducing-5g-plans` | `introducing-5g-plans` | Remove `blog/` prefix, add to `/blog/[uid]` route |
| `case-study-enterprise-client` | `case-study-enterprise-client` | Keep full slug |

---

## Content Migration Strategy

**Decision:** ✅ **Start Fresh** (per user choice)

- **Old content:** Kept in Supabase `pages` table for reference
- **New content:** Created from scratch in Prismic
- **Critical pages to recreate manually:**
  - Homepage
  - Main product landing pages (Fiber, LTE, Fixed Wireless)
  - About Us
  - Contact
  - Terms of Service
  - Privacy Policy

---

## Testing Checklist

After migration, verify these routes work:

- [ ] `/[uid]` - Dynamic Prismic pages render
- [ ] `/fiber-internet` - Test specific landing page
- [ ] `/blog/[uid]` - Blog posts render (if separate route)
- [ ] Old `/cms-blog/*` URLs redirect correctly
- [ ] Old `/cms-pages/*` URLs redirect correctly
- [ ] `/api/preview` - Prismic preview works
- [ ] `/admin/ai-copy` - AI copywriter tool accessible
- [ ] 404 pages for non-existent UIDs

---

## Rollback Plan

If Prismic migration fails:

1. **Restore code:** Move files from `archive/old-cms/` back to original locations
2. **Database:** CMS tables still exist (not dropped), just need to remove deprecation comments
3. **Routes:** Remove Prismic routes and redirects
4. **Time to rollback:** ~30 minutes

---

**Next Steps:**
1. Create Prismic repository (Phase 2)
2. Build Slices (Phase 3)
3. Set up dynamic routes (Phase 4)
4. Configure redirects (Phase 6)
5. Test all routes (Phase 6)
