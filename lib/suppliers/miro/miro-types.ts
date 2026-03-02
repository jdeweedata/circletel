/**
 * MiRO Distribution Type Definitions
 *
 * Types for HTML scraping and product sync from miro.co.za
 */

/**
 * Stock levels by branch/warehouse
 */
export interface MiRoStockLevels {
  jhb: number | 'in_stock' | 'out'
  cpt: number | 'in_stock' | 'out'
  dbn: number | 'in_stock' | 'out'
  ns: number | 'in_stock' | 'out' // National Stock
}

/**
 * Raw product data scraped from MiRO HTML
 */
export interface MiRoScrapedProduct {
  sku: string
  name: string
  description?: string
  manufacturer?: string
  priceInclVat: number
  priceExclVat: number
  sourceImageUrl?: string
  productUrl: string
  stock: MiRoStockLevels
  category: string
  categoryUrl: string
}

/**
 * Parsed product ready for database upsert
 */
export interface ParsedMiRoProduct {
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
 * MiRO sync configuration from metadata
 */
export interface MiRoSyncConfig {
  sync_type: 'html_scrape'
  categories: string[]
  rate_limit_ms: number
  branches: string[]
}

/**
 * Category scrape result
 */
export interface CategoryScrapeResult {
  categoryUrl: string
  categoryName: string
  products: MiRoScrapedProduct[]
  productsFound: number
  duration_ms: number
  errors: string[]
}
