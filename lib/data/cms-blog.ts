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
    const { data, error } = await supabase.from('cms_blog_posts').select('slug').order('published_at', { ascending: false })
    if (error || !data) return []
    return data.map((r: any) => r.slug as string)
  } catch {
    return []
  }
}
