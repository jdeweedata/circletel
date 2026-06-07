# CMS-Authored Blog → Public Site — Design Spec

**Date:** 2026-06-07
**Status:** Approved (design)
**Author:** Claude Code (brainstorming session with Jeffrey)

## Goal

Author blog posts in the standalone Payload CMS (`cms.circletel.co.za/admin`) and render them on the
public CircleTel site (`www.circletel.co.za`) at `/blog` and `/blog/[slug]`, with persistent
featured images and rich-text bodies — **without bundling Payload into the public monolith build.**

This is the **first slice** of a broader "CMS drives public marketing content" capability. It
establishes the reusable pattern (Supabase-view read layer + Next routes) that Products and Pages
will later follow. Those are explicitly **out of scope** here.

## Non-Goals (YAGNI)

- Rewiring the existing product pages (they stay on static `lib/data/products` for now).
- On-demand/instant revalidation webhooks (time-based ISR is sufficient).
- Comments, full-text search, tag/category archive pages, pagination beyond a simple list.
- Bundling Payload or any Payload dependency into the monolith.

## Key Decisions (confirmed)

| # | Decision | Choice |
|---|----------|--------|
| 1 | First content type | **Blog** |
| 2 | Read mechanism | **Supabase view in `public` schema**, queried by the monolith's existing service-role client |
| 3 | Rich-text rendering | **CMS converts Lexical→HTML on save** into a `contentHtml` field; monolith renders the string |
| 4 | Freshness | **Time-based ISR**, `revalidate = 300` (≤5 min) |
| 5 | Media storage | **Supabase Storage** (S3-compatible) via `@payloadcms/storage-s3` in the CMS |
| 6 | Public routes | `/blog` (index) and `/blog/[slug]` (post) |
| 7 | Storage bucket | `cms-media` (public-read) |

### Why a Supabase view (decision 2 refinement)

The `payload` schema is **not exposed** through Supabase's PostgREST API, so `supabase-js`
cannot `.from('blog_posts')` against it. Rather than expose the whole `payload` schema (security
surface) or add a direct `pg` connection (build weight), we create a **read-only view**
`public.cms_blog_posts` that selects only **published** posts and joins the featured-image URL.
The monolith queries this view via its existing service-role server client (`lib/supabase/server.ts`).
Benefits: no PostgREST config change, the view is the **single** place that knows Payload's table
layout, and it exposes only published content.

## Architecture

### A. CMS side (`/home/circletel-cms` — Payload already lives here)

1. **Media → Supabase Storage.** Add `@payloadcms/storage-s3`, configured against the Supabase
   Storage S3 endpoint + the `cms-media` bucket. New uploads (and the `thumbnail`/`hero`/`product`
   image sizes) persist in the bucket and get public URLs stored in `media.url` /
   `media.sizes_hero_url` / `media.sizes_thumbnail_url`. Requires Supabase Storage S3 credentials as
   CMS env vars: `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
   `S3_BUCKET=cms-media`.

2. **`contentHtml` field + hook on BlogPosts.** Add a read-only `contentHtml` (textarea/code) field.
   A `beforeChange` hook converts the Lexical `content` to an HTML string using
   `@payloadcms/richtext-lexical`'s async HTML converter (`@payloadcms/richtext-lexical/html-async`,
   `convertLexicalToHTMLAsync`) and writes it to `contentHtml`. The heavy conversion happens once,
   at author time, where Payload deps already exist. `push:true` adds the `content_html` column on
   the next CMS deploy.

`BlogPosts` already has: `title`, `slug`, `author`(rel→users), `featuredImage`(upload→media),
`excerpt`, `content`(lexical), `categories`, `tags`, `status`(`draft`|`published`, default `draft`),
`publishedAt`, plus `meta_title`/`meta_description`/`meta_image_id` (SEO plugin) and Payload draft
versions (`_status`). **Published filter = `status = 'published'`** (the explicit author field).

### B. Database (Supabase migration via `apply_migration`)

Create `public.cms_blog_posts` (run AFTER the CMS deploy that adds `content_html`):

```sql
create or replace view public.cms_blog_posts as
select
  bp.id,
  bp.title,
  bp.slug,
  bp.excerpt,
  bp.content_html,
  bp.published_at,
  bp.created_at,
  bp.updated_at,
  bp.meta_title,
  bp.meta_description,
  au.name           as author_name,
  fi.url            as featured_image_url,
  coalesce(fi.sizes_hero_url, fi.url)      as featured_image_hero_url,
  coalesce(fi.sizes_thumbnail_url, fi.url) as featured_image_thumb_url,
  fi.alt            as featured_image_alt
from payload.blog_posts bp
left join payload.users au on au.id = bp.author_id
left join payload.media fi on fi.id = bp.featured_image_id
where bp.status = 'published';
```

(Categories/tags can be added to the view later if archive pages are built — out of scope now.)
The monolith's **service-role** client reads this view; no extra grants needed. (If anon read is
ever wanted, `grant select on public.cms_blog_posts to anon;` — published-only, so safe.)

### C. Public site (`/home/circletel` monolith — never imports Payload)

3. **`lib/data/cms-blog.ts`** — the only module that knows the view. Uses
   `createClient()` from `@/lib/supabase/server` (service role). Exposes:
   - `getPublishedPosts(): Promise<BlogPostCard[]>` — `select(...).order('published_at',{desc})`.
   - `getPostBySlug(slug): Promise<BlogPost | null>` — `.eq('slug', slug).maybeSingle()`.
   - `getPostSlugs(): Promise<string[]>` — slugs for `generateStaticParams`.
   - Types `BlogPostCard` (list fields) and `BlogPost` (full, incl. `contentHtml`).
   - All wrapped in try/catch → `[]`/`null` on failure (graceful, matches existing data layer).

4. **Routes**
   - `app/blog/page.tsx` — index. Server component, `export const revalidate = 300`. Renders a
     responsive card grid (featured thumb, title, excerpt, author, formatted date). Empty state when
     no posts. Page `<title>`/description for SEO.
   - `app/blog/[slug]/page.tsx` — post. `generateStaticParams` from `getPostSlugs()`,
     `export const revalidate = 300`, `generateMetadata` (title = `meta_title||title`, description =
     `meta_description||excerpt`, OG image = `featured_image_hero_url`). Renders hero image, title,
     author + date, then `contentHtml` via `dangerouslySetInnerHTML` inside a `.prose`-styled
     wrapper. `notFound()` when slug missing.
   - Next.js 15: `params` is a Promise — `const { slug } = await params`.

5. **Navigation** — add a "Blog" link via `components/navigation/NavigationData.ts` (single source
   of truth; footer/nav pick it up).

## Data Flow

```
Author (CMS admin)
  └─ create/edit BlogPost, upload featured image, set status=Published, Save
       ├─ image → Supabase Storage (cms-media bucket) → media.url / sizes_*_url
       └─ beforeChange hook: Lexical content → contentHtml column
  → row in payload.blog_posts (status='published')
  → public.cms_blog_posts view reflects it
Public site (ISR, ≤5 min)
  └─ app/blog/* → cms-blog.ts → supabase.from('cms_blog_posts') → render contentHtml + CDN image
```

## Security & Isolation

- Monolith reads **server-side only** with the service-role client; the view exposes **published**
  content only. No Payload schema exposed via PostgREST; no Payload deps in the monolith bundle.
- `contentHtml` is generated by the trusted CMS (authenticated authors) → rendering it via
  `dangerouslySetInnerHTML` is acceptable. (Authors are staff, not public.)
- One coupling point: `public.cms_blog_posts` (SQL) + `lib/data/cms-blog.ts` (types). Payload table
  changes only ripple through the view.

## Error Handling

- Data module: try/catch → `[]`/`null`; pages render empty-state or `notFound()`.
- Missing `content_html` (legacy post saved before the hook): render excerpt only, no crash.
- Missing featured image: render without image (layout tolerates absent `featured_image_*`).

## Testing

- **Unit** (`__tests__/lib/data/cms-blog.test.ts`): mock the Supabase client; assert query shape
  (selects the view, orders by `published_at`, filters by slug), and that errors degrade to
  `[]`/`null`. Real test (not mocking the thing under test) — verifies the module's mapping/guards.
- **Integration/manual**: seed one published post (with image) in the CMS; Playwright check that
  `/blog` lists it and `/blog/[slug]` renders the HTML body + image; verify ISR (edit → appears
  within revalidate window).

## Sequencing (critical ordering)

1. CMS: add `contentHtml` field + hook **and** S3 storage → deploy CMS (creates `content_html`
   column, enables persistent media).
2. DB: create `public.cms_blog_posts` view (now that `content_html` exists).
3. Monolith: `cms-blog.ts` + routes + nav → build/type-check → deploy.
4. Author a real post to validate end-to-end.

## Open Items (none blocking)

- Bucket creation (`cms-media`, public) + Supabase S3 credentials — operational step in the plan.
- Categories/tags archive pages — future slice.
- Products & Pages rendering — future slices reusing this pattern.
