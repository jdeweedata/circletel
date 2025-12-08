/**
 * Supplier Module Type Definitions
 *
 * Types for supplier management, product catalogs, and sync operations
 */

// =====================================================
// Database Row Types (to be replaced with generated types)
// =====================================================

export interface Supplier {
  id: string
  name: string
  code: string
  website_url: string | null
  contact_email: string | null
  contact_phone: string | null
  account_number: string | null
  payment_terms: string | null
  feed_url: string | null
  feed_type: 'xml' | 'api' | 'csv' | 'manual'
  feed_credentials: Record<string, unknown>
  is_active: boolean
  last_synced_at: string | null
  sync_status: SyncStatus
  sync_error: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SupplierInsert {
  name: string
  code: string
  website_url?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  account_number?: string | null
  payment_terms?: string | null
  feed_url?: string | null
  feed_type?: 'xml' | 'api' | 'csv' | 'manual'
  feed_credentials?: Record<string, unknown>
  is_active?: boolean
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface SupplierUpdate {
  name?: string
  code?: string
  website_url?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  account_number?: string | null
  payment_terms?: string | null
  feed_url?: string | null
  feed_type?: 'xml' | 'api' | 'csv' | 'manual'
  feed_credentials?: Record<string, unknown>
  is_active?: boolean
  last_synced_at?: string | null
  sync_status?: SyncStatus
  sync_error?: string | null
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface SupplierProduct {
  id: string
  supplier_id: string
  sku: string
  name: string
  description: string | null
  manufacturer: string | null
  cost_price: number | null
  retail_price: number | null
  source_image_url: string | null
  cached_image_path: string | null
  product_url: string | null
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
  stock_total: number
  in_stock: boolean
  category: string | null
  subcategory: string | null
  specifications: Record<string, unknown>
  features: string[]
  is_active: boolean
  is_discontinued: boolean
  last_synced_at: string | null
  previous_cost_price: number | null
  previous_stock_total: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SupplierProductInsert {
  supplier_id: string
  sku: string
  name: string
  description?: string | null
  manufacturer?: string | null
  cost_price?: number | null
  retail_price?: number | null
  source_image_url?: string | null
  cached_image_path?: string | null
  product_url?: string | null
  stock_cpt?: number
  stock_jhb?: number
  stock_dbn?: number
  stock_total?: number
  category?: string | null
  subcategory?: string | null
  specifications?: Record<string, unknown>
  features?: string[]
  is_active?: boolean
  is_discontinued?: boolean
  metadata?: Record<string, unknown>
}

export interface SupplierProductUpdate {
  name?: string
  description?: string | null
  manufacturer?: string | null
  cost_price?: number | null
  retail_price?: number | null
  source_image_url?: string | null
  cached_image_path?: string | null
  product_url?: string | null
  stock_cpt?: number
  stock_jhb?: number
  stock_dbn?: number
  stock_total?: number
  category?: string | null
  subcategory?: string | null
  specifications?: Record<string, unknown>
  features?: string[]
  is_active?: boolean
  is_discontinued?: boolean
  previous_cost_price?: number | null
  previous_stock_total?: number | null
  last_synced_at?: string | null
  metadata?: Record<string, unknown>
}

export interface SupplierSyncLog {
  id: string
  supplier_id: string
  status: 'started' | 'completed' | 'failed'
  products_found: number
  products_created: number
  products_updated: number
  products_unchanged: number
  products_deactivated: number
  images_cached: number
  error_message: string | null
  error_details: Record<string, unknown>
  duration_ms: number | null
  triggered_by: 'manual' | 'scheduled' | 'webhook' | null
  triggered_by_user_id: string | null
  started_at: string
  completed_at: string | null
}

export interface SupplierSyncLogInsert {
  supplier_id: string
  status: 'started' | 'completed' | 'failed'
  products_found?: number
  products_created?: number
  products_updated?: number
  products_unchanged?: number
  products_deactivated?: number
  images_cached?: number
  error_message?: string | null
  error_details?: Record<string, unknown>
  duration_ms?: number | null
  triggered_by?: 'manual' | 'scheduled' | 'webhook' | null
  triggered_by_user_id?: string | null
  completed_at?: string | null
}

// =====================================================
// Enums & Constants
// =====================================================

export type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed'

export type FeedType = 'xml' | 'api' | 'csv' | 'manual'

export type SyncTrigger = 'manual' | 'scheduled' | 'webhook'

// =====================================================
// Scoop XML Feed Types
// =====================================================

/**
 * Raw product data from Scoop XML feed
 */
export interface ScoopXmlProduct {
  SKU: string
  Description: string
  Manufacturer: string
  DealerPrice: string       // String in XML, parse to number
  RetailPrice: string       // String in XML, parse to number
  CPT: string               // Stock count as string
  JHB: string               // Stock count as string
  DBN: string               // Stock count as string
  TotalStock: string        // Total stock as string
  ImageURL: string          // Direct image link
  ProductURL?: string       // Link to product page
  Category?: string         // Category if available
}

/**
 * Parsed product ready for database upsert
 */
export interface ParsedScoopProduct {
  sku: string
  name: string
  description: string | null
  manufacturer: string
  cost_price: number        // DealerPrice parsed
  retail_price: number      // RetailPrice parsed
  source_image_url: string
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
  stock_total: number
  product_url: string | null
  category: string | null
}

// =====================================================
// Sync Operation Types
// =====================================================

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean
  supplier_id: string
  log_id: string
  stats: {
    products_found: number
    products_created: number
    products_updated: number
    products_unchanged: number
    products_deactivated: number
    images_cached: number
  }
  duration_ms: number
  error?: string
}

/**
 * Product comparison for change detection
 */
export interface ProductChanges {
  sku: string
  changes: {
    field: string
    old_value: unknown
    new_value: unknown
  }[]
  is_price_change: boolean
  is_stock_change: boolean
}

/**
 * Batch upsert result
 */
export interface UpsertResult {
  created: string[]         // SKUs of created products
  updated: string[]         // SKUs of updated products
  unchanged: string[]       // SKUs with no changes
  errors: { sku: string; error: string }[]
}

// =====================================================
// Image Caching Types
// =====================================================

/**
 * Image cache operation result
 */
export interface ImageCacheResult {
  source_url: string
  cached_path: string | null
  success: boolean
  error?: string
  size_bytes?: number
}

/**
 * Batch image cache result
 */
export interface BatchImageCacheResult {
  total: number
  cached: number
  failed: number
  skipped: number          // Already cached
  results: ImageCacheResult[]
}

// =====================================================
// API Response Types
// =====================================================

/**
 * Supplier list response
 */
export interface SupplierListResponse {
  data: SupplierWithStats[]
  total: number
}

/**
 * Supplier with aggregated statistics
 */
export interface SupplierWithStats extends Supplier {
  total_products: number
  active_products: number
  in_stock_products: number
  min_price: number | null
  max_price: number | null
  total_stock_units: number
}

/**
 * Product list response with pagination
 */
export interface ProductListResponse {
  data: SupplierProduct[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

/**
 * Product filters for API queries
 */
export interface ProductFilters {
  supplier_id?: string
  manufacturer?: string
  category?: string
  in_stock?: boolean
  is_active?: boolean
  min_price?: number
  max_price?: number
  search?: string          // Search in name, SKU, description
}

/**
 * Sync trigger response
 */
export interface SyncTriggerResponse {
  message: string
  log_id: string
  status: 'started' | 'queued'
}

// =====================================================
// Product Enrichment Types
// =====================================================

/**
 * Enrichment status for tracking progress
 */
export type EnrichmentStatus = 'pending' | 'scraped' | 'enriched' | 'failed'

/**
 * Enrichment request mode
 */
export type EnrichmentMode = 'all' | 'missing' | 'selected'

/**
 * Enrichment request payload
 */
export interface EnrichmentRequest {
  mode: EnrichmentMode
  product_ids?: string[]
  skip_scraping?: boolean
}

/**
 * Enrichment API response
 */
export interface EnrichmentResponse {
  success: boolean
  data?: {
    total: number
    urls_found: number
    scraped: number
    enriched: number
    failed: number
    duration_ms: number
  }
  error?: string
}

/**
 * Product enrichment metadata stored in metadata JSONB
 */
export interface ProductEnrichmentMetadata {
  enrichment_status?: EnrichmentStatus
  enrichment_error?: string
  enriched_at?: string
  scraped_at?: string
  scraped_data?: {
    title?: string
    description?: string
    raw_content?: string
    additional_images?: string[]
  }
}

// =====================================================
// UI Component Props
// =====================================================

/**
 * Stock level display data
 */
export interface StockLevelDisplay {
  branch: 'CPT' | 'JHB' | 'DBN'
  label: string
  count: number
  has_stock: boolean
}

/**
 * Price display data
 */
export interface PriceDisplay {
  cost_price: number
  retail_price: number
  margin_amount: number
  margin_percentage: number
}

/**
 * Sync status display data
 */
export interface SyncStatusDisplay {
  status: SyncStatus
  last_synced_at: string | null
  error: string | null
  is_stale: boolean        // Last sync > 24 hours ago
}
