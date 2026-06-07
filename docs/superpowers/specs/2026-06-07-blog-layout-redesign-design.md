# Blog Layout Redesign — Design Spec

**Date:** 2026-06-07
**Status:** Approved (design)
**Builds on:** `2026-06-07-cms-blog-public-rendering-design.md` (the working CMS-driven blog at `/blog`)

## Goal

Upgrade the public blog from the minimal placeholder layout to a polished **editorial layout**
optimised for the blog's purposes: **reviews, organic SEO, how-to/info guides, and driving sales.**
Reference layouts studied: BusinessTech, TechCentral (both classic editorial article + sidebar),
PCMag (review-specific blocks — deferred to a later slice).

## Brand / Visual Direction (user-approved)

Minimalist, neutral-forward — **orange is the accent, grey/neutrals carry the page, navy is rare.**

| Token | Value | Usage |
|-------|-------|-------|
| **Accent (orange)** | `#F5831F` | Primary CTAs, links, category pills, active/hover states, rules under headings |
| **Neutral scale** | Tailwind `neutral-*` (logo grey `#737373` = `neutral-500`) | Body text (`neutral-800`), meta/secondary (`neutral-500`), borders (`neutral-200`), subtle section bg (`neutral-50`) |
| **Navy** | `#1B2A4A` | **Sparingly** — at most one accent (e.g. the footer CTA band). NOT for headlines/body. |
| **Background** | `#FFFFFF` (+ `neutral-50` sections) | |
| **Fonts** | Manrope (headings), Inter (body) — already in the app | |

Principles: generous whitespace, thin `neutral-200` borders (not heavy shadows), `rounded-lg`,
subtle hover (border→`neutral-300` / slight lift), orange used intentionally not everywhere.

## Scope

In: redesign `/blog` (index) and `/blog/[slug]` (post); reusable `components/blog/*`; data-layer
additions (categories, read-time, related posts); JSON-LD `Article` SEO; sales CTAs; newsletter
**placeholder**; **simple link-based** category navigation.

Out (next slices): PCMag-style review blocks (verdict/rating/PROS-CONS — needs Payload custom
blocks); functional newsletter backend; comments; full-text search; tag archive pages.

## `/blog` — Magazine Index

- **Header band**: H1 "CircleTel Blog" (Manrope, neutral-900) + tagline "Reviews, guides and
  connectivity news" (neutral-500). Thin orange rule accent.
- **Category pills**: `All · Reviews · Guides · News · Deals` — links to `/blog?category=<slug>`
  (server-rendered filter via searchParams). Active pill = orange bg/white; others = neutral
  outline. Driven by the categories present in the CMS.
- **Featured hero** (when ≥1 post): newest post as a large 2-col card — image left, right =
  category pill, large title, excerpt, author · date · read-time.
- **Card grid**: remaining posts, responsive `sm:2 / lg:3` columns. Card = image (16:9, object-cover),
  category tag, title (Manrope, hover→orange), excerpt (`line-clamp-3`), meta row (author · date ·
  read-time). Thin border, hover lift.
- **Empty state**: friendly "No posts yet" (kept).
- SEO: single H1, semantic `<article>` cards, descriptive metadata.

## `/blog/[slug]` — Editorial Article

Container `max-w-6xl`; **two-column on `lg`** (article `~2fr` + sticky sidebar `~1fr`); single column on mobile.

- **Breadcrumb**: Home › Blog › [Category] › Title (`neutral-500`, current = neutral-700). SEO + nav.
- **Eyebrow**: category pill (orange).
- **H1**: Manrope, `neutral-900`, large.
- **Meta row**: author · formatted date · read-time (`neutral-500`, small).
- **Hero image**: full container width, `rounded-lg`.
- **Body**: `.prose` (typography plugin) with brand tweaks — links orange, `prose-headings` Manrope/
  neutral-900, `prose-img` rounded. Renders `contentHtml`.
- **Sticky sidebar** (`lg:` only, `position: sticky; top: 6rem`):
  1. **Share** — X, LinkedIn, WhatsApp, Copy-link (neutral icons, orange hover).
  2. **Sales CTA card** — "Check your coverage" → `/` (coverage checker) + secondary "View packages"
     → `/packages`. Orange primary button. **Drives sales.**
  3. **Newsletter** — email input + Subscribe button (placeholder: posts nowhere yet / disabled
     submit with a "coming soon" note). Styled, ready to wire later.
  4. **Related/Recent posts** — up to 4, title + thumb.
- **Bottom of article**:
  - **Inline sales-CTA banner** — full-width, `neutral-50` (or the single navy accent) with orange
    button: "Ready to get connected? Check your coverage." → `/`.
  - **Related posts grid** — 3 recent (prefer same category), reuse the card component.
  - **Author byline** — name + small note.
- **SEO**: JSON-LD `Article` (`headline`, `image`, `datePublished`, `dateModified`, `author`,
  `publisher` w/ CircleTel logo) via a `<script type="application/ld+json">`; existing OG/Twitter
  metadata retained.

## Data-layer changes (`lib/data/cms-blog.ts` + view)

- **Categories**: extend `public.cms_blog_posts` to expose `categories text[]` via
  `array_agg(c.value)` joined from `payload.blog_posts_categories` (grouped by post). Map to
  `categories: string[]` (+ a `primaryCategory` = first). Cards/eyebrow/breadcrumb/filter use it.
- **Read-time**: compute in the data module from `content_html` — strip tags, word count / 200 wpm,
  `Math.max(1, round)`. Add `readMinutes: number` to `BlogPostCard`/`BlogPost`. No view change.
- **`getRelatedPosts(slug, category, limit=3)`**: published posts excluding `slug`, prefer same
  category, fallback recent. (Single query on the view + filter.)
- **`getPublishedPosts({ category? })`**: optional category filter for the index.

## Components → `components/blog/`

- `PostCard.tsx` — card (variant: `default` | `featured`).
- `CategoryPills.tsx` — filter pills.
- `Breadcrumb.tsx` — article breadcrumb.
- `ShareButtons.tsx` — client component (copy-link uses `navigator.clipboard`).
- `NewsletterSignup.tsx` — placeholder form.
- `SalesCtaCard.tsx` + `SalesCtaBanner.tsx` — coverage/packages CTAs.
- `RelatedPosts.tsx` — related grid/list.
- `ArticleJsonLd.tsx` — JSON-LD script.
- `lib/blog/read-time.ts` — read-time util (unit-tested).

## Testing
- Unit: `read-time.ts` (word count → minutes, min 1); `cms-blog.ts` additions (category mapping,
  related filter) with mocked Supabase.
- Visual: Playwright screenshot of `/blog` + a seeded post page (desktop + mobile) before deploy.

## Error handling
- All data fns keep graceful `[]`/`null` fallbacks. Missing category → no eyebrow/pill. Missing image
  → text-only card. Empty related → section hidden.

## Sequencing
1. DB: extend view with `categories`.
2. Data module: categories + readMinutes + related + category filter (+ tests).
3. Components in `components/blog/`.
4. Rewrite the two routes using the components + JSON-LD.
5. Seed a couple of posts, Playwright screenshots (desktop+mobile), review, then PR → main.
