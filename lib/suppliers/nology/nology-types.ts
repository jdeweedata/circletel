/**
 * Nology Type Definitions
 *
 * Types for HTML scraping and product sync from nology.co.za (VirtueMart)
 */

/**
 * Raw product data scraped from Nology list page
 */
export interface NologyScrapedProduct {
  sku: string
  name: string
  description?: string
  manufacturer?: string
  priceInclVat: number
  priceExclVat: number
  sourceImageUrl?: string
  productUrl: string
  inStock: boolean
  category: string
  categoryUrl: string
}

/**
 * Extended product data from detail page
 */
export interface NologyProductDetail extends NologyScrapedProduct {
  specifications?: Record<string, string>
  features?: string[]
  longDescription?: string
}

/**
 * Parsed product ready for database upsert
 */
export interface ParsedNologyProduct {
  sku: string
  name: string
  description: string | null
  manufacturer: string
  cost_price: number // Excl VAT
  retail_price: number // Incl VAT
  source_image_url: string
  product_url: string
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
  stock_total: number
  category: string
}

/**
 * Nology sync configuration from metadata
 */
export interface NologySyncConfig {
  sync_type: 'html_scrape'
  platform: 'virtuemart'
  categories: string[]
  rate_limit_ms: number
}

/**
 * Category scrape result
 */
export interface NologyCategoryScrapeResult {
  categoryUrl: string
  categoryName: string
  products: NologyScrapedProduct[]
  productsFound: number
  duration_ms: number
  errors: string[]
}
