import { createClient } from '@/lib/supabase/server'
import { readMinutes } from '@/lib/blog/read-time'

export interface BlogPostCard {
  id: number
  title: string
  slug: string
  excerpt: string | null
  publishedAt: string | null
  authorName: string | null
  featuredImageThumbUrl: string | null
  featuredImageAlt: string | null
  categories: string[]
}

export interface BlogPost extends BlogPostCard {
  contentHtml: string | null
  featuredImageHeroUrl: string | null
  metaTitle: string | null
  metaDescription: string | null
  readMinutes: number
}

export function primaryCategory(categories: string[]): string | null {
  return categories.length > 0 ? categories[0] : null
}

const CARD_COLS =
  'id,title,slug,excerpt,published_at,author_name,featured_image_thumb_url,featured_image_alt,categories'
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
    categories: Array.isArray(r.categories) ? r.categories : [],
  }
}

function mapFull(r: any): BlogPost {
  return {
    ...mapCard(r),
    contentHtml: r.content_html ?? null,
    featuredImageHeroUrl: r.featured_image_hero_url ?? null,
    metaTitle: r.meta_title ?? null,
    metaDescription: r.meta_description ?? null,
    readMinutes: readMinutes(r.content_html ?? null),
  }
}

export async function getPublishedPosts(opts?: { category?: string }): Promise<BlogPostCard[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('cms_blog_posts')
      .select(CARD_COLS)
      .order('published_at', { ascending: false })

    if (opts?.category) {
      query = query.contains('categories', [opts.category])
    }

    const { data, error } = await query
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

/**
 * Get all distinct categories across published posts.
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cms_blog_posts')
      .select('categories')
      .order('published_at', { ascending: false })

    if (error || !data) return []

    // Flatten categories arrays and get unique values
    const allCategories = new Set<string>()
    for (const row of data) {
      if (Array.isArray(row.categories)) {
        for (const cat of row.categories) {
          allCategories.add(cat)
        }
      }
    }

    return Array.from(allCategories).sort()
  } catch {
    return []
  }
}

/**
 * Get related posts for a given slug and optional category.
 * Excludes the original post, prefers same category, falls back to recent.
 */
export async function getRelatedPosts(
  slug: string,
  category: string | null,
  limit = 3
): Promise<BlogPostCard[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('cms_blog_posts')
      .select(CARD_COLS)
      .neq('slug', slug)
      .order('published_at', { ascending: false })

    // If we have a category, prefer posts in that category
    if (category) {
      query = query.contains('categories', [category])
    }

    const { data, error } = await query.limit(limit)

    if (error || !data) return []
    return data.map(mapCard)
  } catch {
    return []
  }
}
