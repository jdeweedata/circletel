# CMS-Authored Blog → Public Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author blog posts in the Payload CMS (`cms.circletel.co.za`) and render them on the public site at `/blog` and `/blog/[slug]`, with persistent featured images — without bundling Payload into the public monolith.

**Architecture:** CMS gains Supabase-Storage media + a `contentHtml` (Lexical→HTML) field. A read-only `public.cms_blog_posts` view exposes published posts (+ joined image URLs) to the monolith's existing service-role Supabase client. The monolith adds a thin data module (`lib/data/cms-blog.ts`) and two ISR routes; it never imports Payload.

**Tech Stack:** Payload 3.85 (CMS repo `/home/circletel-cms`), `@payloadcms/storage-s3`, `@payloadcms/richtext-lexical/html-async`, Supabase Postgres + Storage, Next.js 15 (monolith `/home/circletel`), Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-06-07-cms-blog-public-rendering-design.md`

**Two repos:** Tasks 1–6 run in `/home/circletel-cms`. Task 7 is a DB migration. Tasks 8–13 run in `/home/circletel`.

---

## File Structure

| File | Repo | Responsibility |
|------|------|----------------|
| `payload.config.ts` | cms | register `s3Storage` plugin for media |
| `payload/collections/BlogPosts.ts` | cms | add `contentHtml` field + Lexical→HTML `beforeChange` hook |
| `.env` / Coolify env | cms | S3 (Supabase Storage) credentials |
| `public.cms_blog_posts` view | DB | published-only read surface w/ joined image URLs |
| `lib/data/cms-blog.ts` | monolith | typed read API over the view (only schema-coupling point) |
| `__tests__/lib/data/cms-blog.test.ts` | monolith | unit tests (mocked Supabase) |
| `app/blog/page.tsx` | monolith | blog index (ISR 300s) |
| `app/blog/[slug]/page.tsx` | monolith | single post (ISR 300s, SEO, static params) |
| `components/navigation/NavigationData.ts` | monolith | add "Blog" nav entry |

---

## Phase 1 — CMS: persistent media (Supabase Storage)

### Task 1: Create the Supabase Storage bucket + S3 credentials (operational)

**Files:** none (Supabase dashboard)

- [ ] **Step 1:** In the Supabase dashboard (project `agyjovdugmtopasyvlng`) → Storage → create a **public** bucket named `cms-media`.
- [ ] **Step 2:** Storage → S3 Connection → enable, and generate **S3 access keys**. Note `Access key ID`, `Secret access key`, and the endpoint `https://agyjovdugmtopasyvlng.supabase.co/storage/v1/s3` and region (shown there, e.g. `us-east-1`).
- [ ] **Step 3: Verify** the bucket exists:

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://agyjovdugmtopasyvlng.supabase.co/storage/v1/object/public/cms-media/ `
Expected: `400`/`404` (bucket reachable; empty key) — NOT a DNS/connection error.

### Task 2: Install + configure the S3 storage adapter in the CMS

**Files:**
- Modify: `/home/circletel-cms/package.json` (dep)
- Modify: `/home/circletel-cms/payload.config.ts`
- Modify: `/home/circletel-cms/.env` (local) + Coolify env (deploy)

- [ ] **Step 1: Install the adapter**

Run: `cd /home/circletel-cms && npm install @payloadcms/storage-s3@3.85.0`
Expected: added to dependencies; no peer errors.

- [ ] **Step 2: Add S3 env vars to local `.env`**

```bash
cd /home/circletel-cms
cat >> .env <<'ENV'

# Supabase Storage (S3-compatible) for Payload media
S3_ENDPOINT=https://agyjovdugmtopasyvlng.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_BUCKET=cms-media
S3_ACCESS_KEY_ID=<from Task 1 step 2>
S3_SECRET_ACCESS_KEY=<from Task 1 step 2>
ENV
```

- [ ] **Step 3: Register the plugin in `payload.config.ts`**

Add import at top:
```ts
import { s3Storage } from '@payloadcms/storage-s3'
```
Add to the `plugins` array (before `seoPlugin`):
```ts
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET || 'cms-media',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
      // Serve files from Supabase's public object URL, not the S3 endpoint
      generateFileURL: ({ filename, prefix }) =>
        `https://agyjovdugmtopasyvlng.supabase.co/storage/v1/object/public/${process.env.S3_BUCKET || 'cms-media'}/${prefix ? prefix + '/' : ''}${filename}`,
    }),
```

- [ ] **Step 4: Type-check / build locally**

Run: `cd /home/circletel-cms && set -a && source .env && set +a && npm run build`
Expected: build succeeds (compiles, generates pages).

- [ ] **Step 5: Commit**

```bash
cd /home/circletel-cms && git add package.json package-lock.json payload.config.ts && git commit -m "feat(media): store uploads in Supabase Storage (S3 adapter)"
```

---

## Phase 2 — CMS: rich-text → HTML on save

### Task 3: Add `contentHtml` field + Lexical→HTML hook to BlogPosts

**Files:**
- Modify: `/home/circletel-cms/payload/collections/BlogPosts.ts`

- [ ] **Step 1: Add the import** at the top of `BlogPosts.ts`:

```ts
import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async'
```

- [ ] **Step 2: Add the `beforeChange` hook** to the collection config (add a `hooks` key at the top level of the `BlogPosts` object, e.g. after `versions: {...}`):

```ts
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (data?.content) {
          try {
            data.contentHtml = await convertLexicalToHTMLAsync({ data: data.content })
          } catch {
            // leave previous contentHtml on conversion failure
          }
        }
        return data
      },
    ],
  },
```

- [ ] **Step 3: Add the `contentHtml` field** to the `fields` array (place it right after the `content` field):

```ts
    {
      name: 'contentHtml',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: 'Auto-generated HTML from the content field (used by the public site).',
        hidden: false,
      },
    },
```

- [ ] **Step 4: Build locally to verify it compiles**

Run: `cd /home/circletel-cms && set -a && source .env && set +a && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /home/circletel-cms && git add "payload/collections/BlogPosts.ts" && git commit -m "feat(blog): generate contentHtml from Lexical on save"
```

### Task 4: Deploy the CMS + verify schema/media

**Files:** none (deploy)

- [ ] **Step 1: Add the 5 S3 env vars** to the Coolify app `circletel-cms` (uuid `dvpmi8wv902o9q74vdxttmyz`) — `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (Runtime; the build doesn't need them). Via API:

```bash
TOKEN='3|circletel-env-sync-token-2026'; H="http://localhost:8000"; APP="dvpmi8wv902o9q74vdxttmyz"
for kv in "S3_ENDPOINT=https://agyjovdugmtopasyvlng.supabase.co/storage/v1/s3" "S3_REGION=us-east-1" "S3_BUCKET=cms-media"; do
  curl -s -o /dev/null -w "$kv -> %{http_code}\n" -X POST "$H/api/v1/applications/$APP/envs" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"key\":\"${kv%%=*}\",\"value\":\"${kv#*=}\"}"
done
# S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY: set the same way with the real values (kept out of this file)
```

- [ ] **Step 2: Push + deploy**

```bash
cd /home/circletel-cms && git push origin main
TOKEN='3|circletel-env-sync-token-2026'; H="http://localhost:8000"; APP="dvpmi8wv902o9q74vdxttmyz"
curl -s -X POST "$H/api/v1/deploy?uuid=$APP" -H "Authorization: Bearer $TOKEN"
```
Poll the returned `deployment_uuid` via `GET /api/v1/deployments/<uuid>` until `finished`.

- [ ] **Step 3: Verify the `content_html` column exists** (Supabase MCP `execute_sql`):

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='payload' AND table_name='blog_posts' AND column_name='content_html';
```
Expected: returns `content_html`.

- [ ] **Step 4: Verify media persistence** — in the CMS admin (`cms.circletel.co.za/admin`) upload a test image to Media; confirm its URL is `https://agyjovdugmtopasyvlng.supabase.co/storage/v1/object/public/cms-media/...` and the image loads. (Confirms Task 1–2 wiring.)

---

## Phase 3 — Database read surface

### Task 5: Create the `public.cms_blog_posts` view

**Files:** Supabase migration (via MCP `apply_migration`, name `create_cms_blog_posts_view`)

- [ ] **Step 1: Apply the migration**

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
  au.name                                   as author_name,
  fi.url                                    as featured_image_url,
  coalesce(fi.sizes_hero_url, fi.url)       as featured_image_hero_url,
  coalesce(fi.sizes_thumbnail_url, fi.url)  as featured_image_thumb_url,
  fi.alt                                    as featured_image_alt
from payload.blog_posts bp
left join payload.users au on au.id = bp.author_id
left join payload.media fi on fi.id = bp.featured_image_id
where bp.status = 'published';
```

- [ ] **Step 2: Verify the view is queryable**

```sql
SELECT count(*) FROM public.cms_blog_posts;
```
Expected: `0` now (no published posts yet) — but no error, proving the view + columns resolve.

---

## Phase 4 — Monolith: data module (TDD)

### Task 6: `lib/data/cms-blog.ts` types + read functions (test-first)

**Files:**
- Create: `/home/circletel/lib/data/cms-blog.ts`
- Test: `/home/circletel/__tests__/lib/data/cms-blog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/data/cms-blog.test.ts
import { getPublishedPosts, getPostBySlug, getPostSlugs } from '@/lib/data/cms-blog'

const rows = [
  {
    id: 1, title: 'Hello', slug: 'hello', excerpt: 'hi',
    published_at: '2026-06-07T00:00:00Z', author_name: 'Jeffrey',
    featured_image_thumb_url: 'http://img/thumb.jpg', featured_image_alt: 'alt',
    content_html: '<p>body</p>', featured_image_hero_url: 'http://img/hero.jpg',
    meta_title: null, meta_description: null,
  },
]

// Build a chainable Supabase mock whose terminal calls resolve to {data,error}
function makeClient(result: { data: any; error: any }) {
  const builder: any = {
    select: () => builder,
    order: () => Promise.resolve(result),
    eq: () => builder,
    maybeSingle: () => Promise.resolve({ data: result.data?.[0] ?? null, error: result.error }),
  }
  return { from: () => builder }
}

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
import { createClient } from '@/lib/supabase/server'

describe('cms-blog data module', () => {
  it('getPublishedPosts maps rows to cards', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: rows, error: null }))
    const posts = await getPublishedPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0]).toMatchObject({ slug: 'hello', authorName: 'Jeffrey', featuredImageThumbUrl: 'http://img/thumb.jpg' })
  })

  it('getPostBySlug maps a full post incl. contentHtml', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: rows, error: null }))
    const post = await getPostBySlug('hello')
    expect(post).toMatchObject({ slug: 'hello', contentHtml: '<p>body</p>', featuredImageHeroUrl: 'http://img/hero.jpg' })
  })

  it('getPostSlugs returns slug strings', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: [{ slug: 'hello' }], error: null }))
    expect(await getPostSlugs()).toEqual(['hello'])
  })

  it('degrades to empty/null on error', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: null, error: { message: 'boom' } }))
    expect(await getPublishedPosts()).toEqual([])
    expect(await getPostBySlug('x')).toBeNull()
    expect(await getPostSlugs()).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd /home/circletel && npx jest __tests__/lib/data/cms-blog.test.ts`
Expected: FAIL — `Cannot find module '@/lib/data/cms-blog'`.

- [ ] **Step 3: Implement `lib/data/cms-blog.ts`**

```ts
import { createClient } from '@/lib/supabase/server'

export interface BlogPostCard {
  id: number
  title: string
  slug: string
  excerpt: string | null
  publishedAt: string | null
  authorName: string | null
  featuredImageThumbUrl: string | null
  featuredImageAlt: string | null
}

export interface BlogPost extends BlogPostCard {
  contentHtml: string | null
  featuredImageHeroUrl: string | null
  metaTitle: string | null
  metaDescription: string | null
}

const CARD_COLS =
  'id,title,slug,excerpt,published_at,author_name,featured_image_thumb_url,featured_image_alt'
const FULL_COLS =
  CARD_COLS + ',content_html,featured_image_hero_url,meta_title,meta_description'

function mapCard(r: any): BlogPostCard {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt ?? null,
    publishedAt: r.published_at ?? null,
    authorName: r.author_name ?? null,
    featuredImageThumbUrl: r.featured_image_thumb_url ?? null,
    featuredImageAlt: r.featured_image_alt ?? null,
  }
}

function mapFull(r: any): BlogPost {
  return {
    ...mapCard(r),
    contentHtml: r.content_html ?? null,
    featuredImageHeroUrl: r.featured_image_hero_url ?? null,
    metaTitle: r.meta_title ?? null,
    metaDescription: r.meta_description ?? null,
  }
}

export async function getPublishedPosts(): Promise<BlogPostCard[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cms_blog_posts')
      .select(CARD_COLS)
      .order('published_at', { ascending: false })
    if (error || !data) return []
    return data.map(mapCard)
  } catch {
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cms_blog_posts')
      .select(FULL_COLS)
      .eq('slug', slug)
      .maybeSingle()
    if (error || !data) return null
    return mapFull(data)
  } catch {
    return null
  }
}

export async function getPostSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('cms_blog_posts').select('slug')
    if (error || !data) return []
    return data.map((r: any) => r.slug as string)
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `cd /home/circletel && npx jest __tests__/lib/data/cms-blog.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
cd /home/circletel && git add lib/data/cms-blog.ts __tests__/lib/data/cms-blog.test.ts && git commit -m "feat(blog): cms-blog data module over public.cms_blog_posts view"
```

---

## Phase 5 — Monolith: routes + nav

### Task 7: Blog index route `/blog`

**Files:**
- Create: `/home/circletel/app/blog/page.tsx`

- [ ] **Step 1: Implement the index**

```tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublishedPosts } from '@/lib/data/cms-blog'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Blog | CircleTel',
  description: 'News, guides and updates from CircleTel.',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts()

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1B2A4A] mb-8">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet. Check back soon.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group block rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition">
              {p.featuredImageThumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.featuredImageThumbUrl} alt={p.featuredImageAlt ?? p.title} className="w-full h-44 object-cover" />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg text-[#1B2A4A] group-hover:text-[#F5831F] transition">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{p.excerpt}</p>}
                <p className="text-xs text-gray-400 mt-3">{[p.authorName, formatDate(p.publishedAt)].filter(Boolean).join(' · ')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd /home/circletel && npm run type-check:memory`
Expected: no errors in `app/blog/page.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /home/circletel && git add app/blog/page.tsx && git commit -m "feat(blog): public /blog index (ISR)"
```

### Task 8: Single post route `/blog/[slug]`

**Files:**
- Create: `/home/circletel/app/blog/[slug]/page.tsx`

- [ ] **Step 1: Implement the post page**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getPostSlugs } from '@/lib/data/cms-blog'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found | CircleTel' }
  const description = post.metaDescription ?? post.excerpt ?? undefined
  return {
    title: `${post.metaTitle ?? post.title} | CircleTel`,
    description,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description,
      images: post.featuredImageHeroUrl ? [{ url: post.featuredImageHeroUrl }] : undefined,
      type: 'article',
    },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1B2A4A]">{post.title}</h1>
      <p className="text-sm text-gray-400 mt-2">{[post.authorName, formatDate(post.publishedAt)].filter(Boolean).join(' · ')}</p>
      {post.featuredImageHeroUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.featuredImageHeroUrl} alt={post.featuredImageAlt ?? post.title} className="w-full rounded-lg mt-6 object-cover" />
      )}
      {post.contentHtml ? (
        <div className="prose max-w-none mt-8" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      ) : (
        post.excerpt && <p className="mt-8 text-gray-700">{post.excerpt}</p>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd /home/circletel && npm run type-check:memory`
Expected: no errors in `app/blog/[slug]/page.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /home/circletel && git add "app/blog/[slug]/page.tsx" && git commit -m "feat(blog): public /blog/[slug] post page (ISR, SEO)"
```

### Task 9: Add "Blog" to navigation

**Files:**
- Modify: `/home/circletel/components/navigation/NavigationData.ts`

- [ ] **Step 1: Read the file** to find the top-level nav array shape (e.g. items with `{ label, href }`).

Run: `grep -nE "label:|href:|export const" components/navigation/NavigationData.ts | head -30`

- [ ] **Step 2: Add a top-level entry** matching the existing item shape exactly, e.g.:

```ts
{ label: 'Blog', href: '/blog' },
```
Place it among the existing primary nav items (follow the surrounding object's exact keys — if items use `title`/`url` instead of `label`/`href`, match that).

- [ ] **Step 3: Type-check**

Run: `cd /home/circletel && npm run type-check:memory`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/circletel && git add components/navigation/NavigationData.ts && git commit -m "feat(blog): add Blog to site navigation"
```

---

## Phase 6 — Verify end-to-end

### Task 10: Full build + author a real post + verify

**Files:** none

- [ ] **Step 1: Full production build of the monolith**

Run: `cd /home/circletel && npm run build:memory`
Expected: build succeeds, `/blog` and `/blog/[slug]` appear in the route list.

- [ ] **Step 2: Author a post** in `cms.circletel.co.za/admin` → Blog Posts → Create: title, slug, author, upload a featured image, write content, set **status = Published**, Save.

- [ ] **Step 3: Verify the view returns it** (Supabase MCP):

```sql
SELECT slug, author_name, featured_image_hero_url, (content_html IS NOT NULL) AS has_html
FROM public.cms_blog_posts;
```
Expected: one row, `has_html = true`, a Supabase Storage image URL.

- [ ] **Step 4: Deploy the monolith** (its normal pipeline) and verify on production:

```bash
curl -s -o /dev/null -w "/blog %{http_code}\n" https://www.circletel.co.za/blog
curl -s -o /dev/null -w "/blog/<slug> %{http_code}\n" https://www.circletel.co.za/blog/<slug>
```
Expected: both `200`; the post page renders the HTML body + image.

- [ ] **Step 5:** Confirm ISR — edit the post in the CMS, wait ≤5 min, reload the public page, see the change.

---

## Self-Review notes

- **Spec coverage:** media storage (T1–2,4), contentHtml hook (T3), view (T5), data module (T6), routes (T7–8), nav (T9), e2e + ISR (T10). All spec sections covered.
- **Type consistency:** `BlogPostCard`/`BlogPost` field names used identically in module + tests + both routes (`featuredImageThumbUrl`, `featuredImageHeroUrl`, `contentHtml`, `authorName`, `publishedAt`). View column names (`featured_image_thumb_url`, etc.) match `CARD_COLS`/`FULL_COLS` and the migration.
- **Sequencing:** CMS deploy (T4, creates `content_html`) precedes the view (T5, references it) — enforced by task order.
- **No monolith Payload deps:** monolith tasks only touch `lib/data/cms-blog.ts` (Supabase) + routes; nothing imports Payload.
- **Branch note:** run the monolith tasks on a dedicated branch off `main` (not the dirty `fix/card-emandate-tokenisation`) so this ships as its own clean PR.
