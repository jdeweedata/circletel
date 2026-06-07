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

function makeClient(result: { data: any; error: any }) {
  const createBuilder = () => {
    const builder: any = {
      select: () => createBuilder(),
      order: () => createBuilder(),
      eq: () => createBuilder(),
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
