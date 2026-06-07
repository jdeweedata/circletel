import { getPublishedPosts, getPostBySlug, getPostSlugs, getAllCategories, getRelatedPosts } from '@/lib/data/cms-blog'

const rows = [
  {
    id: 1, title: 'Hello', slug: 'hello', excerpt: 'hi',
    published_at: '2026-06-07T00:00:00Z', author_name: 'Jeffrey',
    featured_image_thumb_url: 'http://img/thumb.jpg', featured_image_alt: 'alt',
    categories: ['how-to', 'technology'],
    content_html: '<p>body</p>', featured_image_hero_url: 'http://img/hero.jpg',
    meta_title: null, meta_description: null,
  },
  {
    id: 2, title: 'World', slug: 'world', excerpt: 'world post',
    published_at: '2026-06-06T00:00:00Z', author_name: 'Alice',
    featured_image_thumb_url: 'http://img/thumb2.jpg', featured_image_alt: 'alt2',
    categories: ['technology'],
    content_html: '<p>world body</p>', featured_image_hero_url: 'http://img/hero2.jpg',
    meta_title: null, meta_description: null,
  },
]

function makeClient(result: { data: any; error: any }) {
  const createBuilder = () => {
    const builder: any = {
      select: () => createBuilder(),
      order: () => createBuilder(),
      eq: () => createBuilder(),
      neq: () => createBuilder(),
      contains: () => createBuilder(),
      limit: (n: number) => ({ ...createBuilder(), _limit: n }),
      maybeSingle: () => Promise.resolve({ data: result.data?.[0] ?? null, error: result.error }),
      then: (onfulfilled: any, onrejected?: any) => Promise.resolve(result).then(onfulfilled, onrejected),
      catch: (onrejected: any) => Promise.resolve(result).catch(onrejected),
    }
    return builder
  }
  return { from: () => createBuilder() }
}

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
import { createClient } from '@/lib/supabase/server'

describe('cms-blog data module', () => {
  it('getPublishedPosts maps rows to cards with categories', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: rows, error: null }))
    const posts = await getPublishedPosts()
    expect(posts).toHaveLength(2)
    expect(posts[0]).toMatchObject({ slug: 'hello', authorName: 'Jeffrey', categories: ['how-to', 'technology'] })
  })
  it('getPostBySlug maps a full post incl. contentHtml and readMinutes', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: rows, error: null }))
    const post = await getPostBySlug('hello')
    expect(post).toMatchObject({ slug: 'hello', contentHtml: '<p>body</p>', featuredImageHeroUrl: 'http://img/hero.jpg' })
    expect(post?.readMinutes).toBe(1)
  })
  it('getPostSlugs returns slug strings', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: [{ slug: 'hello' }], error: null }))
    expect(await getPostSlugs()).toEqual(['hello'])
  })
  it('getAllCategories returns distinct categories', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: rows, error: null }))
    const cats = await getAllCategories()
    expect(cats).toContain('how-to')
    expect(cats).toContain('technology')
  })
  it('getRelatedPosts filters by slug and category', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: [rows[1]], error: null }))
    const related = await getRelatedPosts('hello', 'technology', 3)
    expect(related).toHaveLength(1)
    expect(related[0].slug).toBe('world')
  })
  it('degrades to empty/null on error', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeClient({ data: null, error: { message: 'boom' } }))
    expect(await getPublishedPosts()).toEqual([])
    expect(await getPostBySlug('x')).toBeNull()
    expect(await getPostSlugs()).toEqual([])
    expect(await getAllCategories()).toEqual([])
    expect(await getRelatedPosts('x', 'tech')).toEqual([])
  })
})
