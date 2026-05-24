/**
 * MiRO Distribution Type Definitions
 *
 * Updated from HTML scraping to xlsx file parsing (May 2026 price list).
 * The xlsx has 69 sheets — one per brand — each with identical structure:
 *   Row 1: Generated date
 *   Row 2: Client code
 *   Row 4: Headers (Item Code | Item Description | Retail Price | Your Price | Item Link)
 *   Row 5+: Products
 */

// =====================================================
// xlsx Row Structure
// =====================================================

export interface MiRoXlsxRow {
  brand: string
  /** A: Item Code / SKU */
  item_code: string | null
  /** B: Item Description */
  description: string | null
  /** C: Retail Price (excl VAT) — formatted as "R1,234.00" */
  retail_price_raw: string | null
  /** D: Your Price / dealer cost (excl VAT) — formatted as "R987.00" */
  your_price_raw: string | null
  /** E: Product URL on miro.co.za */
  item_link: string | null
  row_number: number
}

// =====================================================
// Parsed Product (backward-compatible)
// =====================================================

export interface ParsedMiRoProduct {
  sku: string
  name: string
  description: string | null
  manufacturer: string
  cost_price: number // Dealer cost, excl VAT
  retail_price: number // Retail price, excl VAT
  source_image_url: string
  product_url: string
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
  stock_total: number
  category: string
}

// =====================================================
// Sync Configuration
// =====================================================

export interface MiRoSyncConfig {
  sync_type: 'xlsx_file'
  watch_dir: string
  file_pattern: string
  archive_processed: boolean
}

// =====================================================
// Parser Results
// =====================================================

export interface MiRoParseResult {
  success: boolean
  file_name: string
  sheets_processed: number
  products_found: number
  products_parsed: number
  rows_skipped: number
  products: ParsedMiRoProduct[]
  errors: string[]
  duration_ms: number
}

// =====================================================
// Legacy (backward compat)
// =====================================================

/** @deprecated */
export interface MiRoStockLevels {
  jhb: number | 'in_stock' | 'out'
  cpt: number | 'in_stock' | 'out'
  dbn: number | 'in_stock' | 'out'
  ns: number | 'in_stock' | 'out'
}

/** @deprecated */
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

/** @deprecated */
export interface CategoryScrapeResult {
  categoryUrl: string
  categoryName: string
  products: MiRoScrapedProduct[]
  productsFound: number
  duration_ms: number
  errors: string[]
}
