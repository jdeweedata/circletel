/**
 * Rectron Supplier Module - Type Definitions
 *
 * Rectron provides an Excel (.xlsm) price list via the RectronZone reseller portal.
 * The file is downloaded manually and placed in a watched directory for sync.
 *
 * Key differences from other suppliers:
 * - No stock levels (price list only)
 * - Price excludes VAT
 * - Includes warranty duration in months
 * - File-based sync (no API/auth required for the sync itself)
 */

// =====================================================
// Rectron xlsm Row Structure
// =====================================================

/**
 * Raw row as read from the RECTRON_PRICE_LIST sheet
 */
export interface RectronXlsmRow {
  /** A: Product line / brand (e.g., "Corsair", "AMD", "Seagate") */
  product_line: string | null

  /** B: Broad category (e.g., "CPU", "Hard Drives") */
  class: string | null

  /** C: Sub-category (e.g., "AMD Ryzen CPU", "Seagate Mobile HDD") */
  sub_class: string | null

  /** D: SKU / part number */
  item: string | null

  /** E: Price in Rand, excluding VAT */
  price: number | null

  /** F: Product description */
  description: string | null

  /** G: Warranty duration in months */
  warranty: number | null

  /** H: Filter helper (1 = data row) */
  filter_helper: number | null
}

// =====================================================
// Parsed Product
// =====================================================

/**
 * Parsed Rectron product ready for database upsert.
 * Normalized to match the shared SupplierProductInsert interface.
 */
export interface ParsedRectronProduct {
  sku: string
  name: string
  description: string | null
  manufacturer: string
  cost_price: number // excl VAT
  retail_price: number // supplier doesn't provide retail, set same as cost
  source_image_url: string // Rectron doesn't provide images in the xlsm
  stock_cpt: number // Not tracked by Rectron
  stock_jhb: number
  stock_dbn: number
  stock_total: number
  product_url: string | null
  category: string | null
  subcategory: string | null
  /** Rectron-specific: warranty in months */
  warranty_months: number | null
}

// =====================================================
// Sync Configuration
// =====================================================

/**
 * Configuration stored in the supplier's metadata JSONB
 */
export interface RectronSyncConfig {
  /** Directory to watch for new xlsm files */
  watch_dir: string
  /** File pattern to match (e.g., "RECTRON_PRICE_LIST_*.xlsm") */
  file_pattern: string
  /** Whether to archive processed files */
  archive_processed: boolean
}

// =====================================================
// Parser Result
// =====================================================

/**
 * Result from parsing the Rectron xlsm file
 */
export interface RectronParseResult {
  success: boolean
  file_name: string
  products_found: number
  products_parsed: number
  rows_skipped: number
  products: ParsedRectronProduct[]
  errors: string[]
  duration_ms: number
}
