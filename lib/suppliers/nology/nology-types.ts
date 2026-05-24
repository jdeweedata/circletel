/**
 * Nology Type Definitions
 *
 * Types for xlsx file parsing and product sync.
 * Updated from HTML scraping to xlsx-based parsing (April 2026 price list).
 *
 * The xlsx has 39 sheets — one per brand/manufacturer — each with
 * consistent structure: SKU | DESCRIPTION | PRICE (excl VAT) | COMMENTS
 *
 * Non-product sheets (PRICING, Categories, Delivery, etc.) are skipped.
 */

// =====================================================
// xlsx Row Structure
// =====================================================

/**
 * Raw row read from a Nology product sheet.
 * Each product sheet has: SKU (B), Description (C), Price (D), Comments (E/F)
 * with category group header rows interspersed.
 */
export interface NologyXlsxRow {
  /** Sheet name = brand/manufacturer (e.g., "MikroTik", "Yealink", "TP-Link") */
  brand: string
  /** B: Stock code / SKU */
  sku: string | null
  /** C (or D): Product description */
  description: string | null
  /** D (or E): Price in Rand, excluding VAT */
  price: number | null
  /** E/F/G: Comments — warranty info, promos, stock notes, hyperlinks */
  comments: string | null
  /** Product URL extracted from hyperlink on SKU cell */
  product_url: string | null
  /** Row number in the sheet (for debugging) */
  row_number: number
}

// =====================================================
// Parsed Product (compatible with existing interface)
// =====================================================

/**
 * Parsed product ready for database upsert.
 * Compatible with the existing ParsedNologyProduct interface
 * used by the sync module.
 */
export interface ParsedNologyProduct {
  sku: string
  name: string
  description: string | null
  manufacturer: string
  cost_price: number // Excl VAT
  retail_price: number // Same as cost (Nology doesn't provide retail in xlsx)
  source_image_url: string
  product_url: string
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
  stock_total: number
  category: string
  /** Warranty info extracted from comments */
  warranty: string | null
  /** Brand/subcategory from the sheet name */
  subcategory: string | null
}

// =====================================================
// Sync Configuration
// =====================================================

/**
 * Nology sync configuration stored in supplier metadata.
 * Updated for xlsx file-based sync.
 */
export interface NologySyncConfig {
  sync_type: 'xlsx_file'
  watch_dir: string
  file_pattern: string
  archive_processed: boolean
}

// =====================================================
// Parser Results
// =====================================================

/**
 * Result from parsing a single sheet in the Nology xlsx
 */
export interface NologySheetResult {
  sheet_name: string
  brand: string
  products_found: number
  products_parsed: number
  rows_skipped: number
  products: ParsedNologyProduct[]
  errors: string[]
}

/**
 * Result from parsing the entire Nology xlsx file
 */
export interface NologyParseResult {
  success: boolean
  file_name: string
  sheets_processed: number
  products_found: number
  products_parsed: number
  rows_skipped: number
  products: ParsedNologyProduct[]
  sheet_results: NologySheetResult[]
  errors: string[]
  duration_ms: number
}

// =====================================================
// Legacy (kept for backward compat with existing sync)
// =====================================================

/** @deprecated Replaced by NologyXlsxRow */
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

/** @deprecated Replaced by NologySheetResult */
export interface NologyCategoryScrapeResult {
  categoryUrl: string
  categoryName: string
  products: NologyScrapedProduct[]
  productsFound: number
  duration_ms: number
  errors: string[]
}
