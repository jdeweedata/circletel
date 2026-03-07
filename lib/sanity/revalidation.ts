// lib/sanity/revalidation.ts

type TagFunction = (slug?: string) => string[]

const tagMap: Record<string, TagFunction> = {
  page: (slug) => [`page:${slug}`, 'pages', 'navigation'],
  homepage: () => ['homepage', 'navigation'],
  productPage: (slug) => [`product:${slug}`, 'products', 'pricing'],
  post: (slug) => [`post:${slug}`, 'posts', 'blog', 'recent-posts'],
  campaign: () => ['campaigns', 'active-campaigns', 'banners'],
  resource: (slug) => [`resource:${slug}`, 'resources', 'resource-library'],
  teamMember: () => ['team', 'about'],
  siteSettings: () => ['site-settings', 'navigation', 'footer', 'contact'],
  testimonial: () => ['testimonials'],
  category: () => ['categories', 'blog'],
}

export function getTagsForDocument(type: string, slug?: string): string[] {
  const tagFn = tagMap[type]
  if (!tagFn) {
    console.warn(`[Revalidation] Unknown document type: ${type}`)
    return [type]
  }
  return tagFn(slug)
}

const pathMap: Record<string, (slug: string) => string> = {
  page: (slug) => `/${slug}`,
  homepage: () => '/',
  productPage: (slug) => `/products/${slug}`,
  post: (slug) => `/blog/${slug}`,
  resource: (slug) => `/resources/${slug}`,
  teamMember: (slug) => `/team/${slug}`,
}

export function getPathForDocument(type: string, slug?: string): string | null {
  if (!slug) return null
  const pathFn = pathMap[type]
  return pathFn ? pathFn(slug) : null
}
