import type { ProductData } from './types'
import { products } from './product-data'

/** Re-export the products array for components that need the full list */
export { products }
/** Alias for backward compatibility */
export const getAllProducts = () => products

export function getProductBySlug(slug: string): ProductData | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductsByCategory(
  category: string
): ProductData[] {
  return products.filter((p) => p.category === category)
}
