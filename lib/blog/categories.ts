/**
 * Category label mappings for blog posts.
 * Maps slug → display label.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  'product-updates': 'Product Updates',
  'how-to': 'How-To Guides',
  'industry': 'Industry Insights',
  'case-studies': 'Case Studies',
  'company-news': 'Company News',
  'technology': 'Technology',
}

/**
 * Get the display label for a category slug.
 * Falls back to title-cased slug if not in the label map.
 */
export function categoryLabel(slug: string): string {
  if (slug in CATEGORY_LABELS) {
    return CATEGORY_LABELS[slug]
  }
  // Fallback: title-case the slug
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
