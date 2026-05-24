/**
 * Hardware Product Catalogue — TypeScript Types
 *
 * Customer-facing hardware product catalogue types.
 * Maps supplier_products to curated CircleTel products with pricing,
 * T&Cs, and service package linkages.
 */

// =====================================================
// Database Row Types
// =====================================================

export interface CircleTelHardwareProduct {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  image_url: string | null
  retail_price: number
  cost_price: number
  markup_percentage: number | null
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  sort_order: number
  specifications: Record<string, unknown>
  warranty_months: number | null
  warranty_description: string | null
  primary_supplier_code: string | null
  metadata: Record<string, unknown>
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface HardwareProductInsert {
  name: string
  slug: string
  description?: string | null
  category?: string | null
  image_url?: string | null
  retail_price?: number
  cost_price?: number
  status?: 'draft' | 'published' | 'archived'
  is_featured?: boolean
  sort_order?: number
  specifications?: Record<string, unknown>
  warranty_months?: number | null
  warranty_description?: string | null
  primary_supplier_code?: string | null
  metadata?: Record<string, unknown>
}

export interface HardwareProductUpdate {
  name?: string
  slug?: string
  description?: string | null
  category?: string | null
  image_url?: string | null
  retail_price?: number
  cost_price?: number
  status?: 'draft' | 'published' | 'archived'
  is_featured?: boolean
  sort_order?: number
  specifications?: Record<string, unknown>
  warranty_months?: number | null
  warranty_description?: string | null
  primary_supplier_code?: string | null
  published_at?: string | null
  metadata?: Record<string, unknown>
}

export interface HardwareProductSupplier {
  id: string
  hardware_product_id: string
  supplier_product_id: string
  supplier_cost: number
  is_preferred: boolean
  last_synced_cost: number | null
  cost_updated_at: string | null
  created_at: string
  updated_at: string
}

export interface HardwareProductTerms {
  id: string
  hardware_product_id: string
  warranty_period: string | null
  return_policy: string | null
  refund_policy: string | null
  delivery_estimate: string | null
  warranty_notes: string | null
  is_back_to_back: boolean
  source_supplier_code: string | null
  source_supplier_warranty_months: number | null
  effective_from: string | null
  created_at: string
  updated_at: string
}

export interface HardwareServiceLink {
  id: string
  hardware_product_id: string
  service_package_id: string
  relationship_type: 'bundled_with' | 'recommended_for' | 'required_for'
  sort_order: number
  created_at: string
}

// =====================================================
// View Type (flattened join)
// =====================================================

export interface HardwareProductDetail extends CircleTelHardwareProduct {
  best_supplier_cost: number | null
  supplier_count: number
  total_stock: number
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
  terms_warranty: string | null
  terms_return: string | null
  terms_back_to_back: boolean | null
}

// =====================================================
// Enriched Types (with joins)
// =====================================================

export interface HardwareProductWithSuppliers extends CircleTelHardwareProduct {
  suppliers: Array<{
    id: string
    supplier_code: string
    supplier_name: string
    sku: string
    supplier_cost: number
    is_preferred: boolean
    stock_total: number
  }>
}

export interface HardwareProductFull
  extends CircleTelHardwareProduct {
  suppliers: Array<{
    id: string
    supplier_code: string
    supplier_name: string
    sku: string
    supplier_cost: number
    is_preferred: boolean
    stock_cpt: number
    stock_jhb: number
    stock_dbn: number
    stock_total: number
  }>
  terms: HardwareProductTerms | null
  service_links: Array<{
    service_package_id: string
    service_name: string
    service_slug: string
    relationship_type: string
  }>
  total_stock: number
  has_stock: boolean
}

// =====================================================
// "Promote from Supplier" Workflow Types
// =====================================================

export interface PromoteFromSupplierInput {
  supplier_product_id: string
  slug: string
  name?: string // override supplier name
  description?: string // override supplier description
  retail_price: number
  category?: string
  is_featured?: boolean
  /** Default markup percentage if no retail price provided */
  default_markup_percent?: number
}

export interface PromoteResult {
  success: boolean
  hardware_product_id?: string
  slug?: string
  error?: string
}

// =====================================================
// Pricing Types
// =====================================================

export interface PricingSuggestion {
  /** Best supplier cost (excl VAT) */
  best_cost: number
  /** Suggested retail price at the default markup */
  suggested_retail: number
  /** Cost from each supplier */
  supplier_costs: Array<{
    supplier_code: string
    sku: string
    cost: number
  }>
}

// =====================================================
// Filter/Search Types
// =====================================================

export interface HardwareProductFilters {
  status?: 'draft' | 'published' | 'archived'
  category?: string
  supplier_code?: string
  in_stock?: boolean
  is_featured?: boolean
  search?: string
  min_price?: number
  max_price?: number
  page?: number
  page_size?: number
}

export interface HardwareProductListResponse {
  data: HardwareProductDetail[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// =====================================================
// Stock Display Types
// =====================================================

export interface StockDisplay {
  total: number
  has_stock: boolean
  branches: Array<{
    name: string
    label: string
    count: number
    has_stock: boolean
  }>
}

export function getStockDisplay(product: {
  total_stock: number
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
}): StockDisplay {
  return {
    total: product.total_stock,
    has_stock: product.total_stock > 0,
    branches: [
      {
        name: 'CPT',
        label: 'Cape Town',
        count: product.stock_cpt,
        has_stock: product.stock_cpt > 0,
      },
      {
        name: 'JHB',
        label: 'Johannesburg',
        count: product.stock_jhb,
        has_stock: product.stock_jhb > 0,
      },
      {
        name: 'DBN',
        label: 'Durban',
        count: product.stock_dbn,
        has_stock: product.stock_dbn > 0,
      },
    ],
  }
}
