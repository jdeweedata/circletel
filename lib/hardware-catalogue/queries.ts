/**
 * Hardware Product Catalogue — Database Queries
 *
 * Supabase query functions for the CircleTel hardware product catalogue.
 * All functions use the service-role client (server-side only).
 */

import { createClient } from '@/lib/supabase/server'
import type {
  CircleTelHardwareProduct,
  HardwareProductInsert,
  HardwareProductUpdate,
  HardwareProductDetail,
  HardwareProductFilters,
  HardwareProductListResponse,
  HardwareProductFull,
  HardwareProductTerms,
  HardwareServiceLink,
  PromoteFromSupplierInput,
  PromoteResult,
  PricingSuggestion,
} from './types'

// =====================================================
// CRUD: Hardware Products
// =====================================================

/**
 * List hardware products with optional filters
 */
export async function getHardwareProducts(
  filters: HardwareProductFilters = {}
): Promise<HardwareProductListResponse> {
  const supabase = await createClient()
  const page = filters.page || 1
  const pageSize = filters.page_size || 20
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('v_hardware_product_detail')
    .select('*', { count: 'exact' })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  if (filters.is_featured) {
    query = query.eq('is_featured', true)
  }
  if (filters.in_stock) {
    query = query.gt('total_stock', 0)
  }
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }
  if (filters.min_price !== undefined) {
    query = query.gte('retail_price', filters.min_price)
  }
  if (filters.max_price !== undefined) {
    query = query.lte('retail_price', filters.max_price)
  }

  const { data, error, count } = await query
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) throw new Error(`Failed to fetch products: ${error.message}`)

  return {
    data: (data || []) as HardwareProductDetail[],
    total: count || 0,
    page,
    page_size: pageSize,
    has_more: (count || 0) > offset + pageSize,
  }
}

/**
 * Get a single hardware product by slug (customer-facing)
 */
export async function getHardwareProductBySlug(
  slug: string
): Promise<HardwareProductFull | null> {
  const supabase = await createClient()

  // Fetch product from view
  const { data: product, error } = await supabase
    .from('v_hardware_product_detail')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !product) return null

  // Fetch supplier links
  const { data: supplierLinks } = await supabase
    .from('hardware_product_suppliers')
    .select(
      `
      id,
      supplier_cost,
      is_preferred,
      supplier_product:supplier_products (
        id,
        sku,
        name,
        stock_cpt,
        stock_jhb,
        stock_dbn,
        stock_total,
        supplier:suppliers (code, name)
      )
    `
    )
    .eq('hardware_product_id', product.id)

  // Fetch terms
  const { data: terms } = await supabase
    .from('hardware_product_terms')
    .select('*')
    .eq('hardware_product_id', product.id)
    .single()

  // Fetch service links
  const { data: serviceLinks } = await supabase
    .from('hardware_service_links')
    .select(
      `
      service_package_id,
      relationship_type,
      service_package:service_packages (name, slug)
    `
    )
    .eq('hardware_product_id', product.id)
    .order('sort_order')

  const detail = product as HardwareProductDetail

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suppliers = (supplierLinks || []).map((link: any) => ({
    id: link.id,
    supplier_code: link.supplier_product?.supplier?.code || 'UNKNOWN',
    supplier_name: link.supplier_product?.supplier?.name || 'Unknown',
    sku: link.supplier_product?.sku || '',
    supplier_cost: link.supplier_cost,
    is_preferred: link.is_preferred,
    stock_cpt: link.supplier_product?.stock_cpt || 0,
    stock_jhb: link.supplier_product?.stock_jhb || 0,
    stock_dbn: link.supplier_product?.stock_dbn || 0,
    stock_total: link.supplier_product?.stock_total || 0,
  }))

  return {
    ...detail,
    suppliers,
    terms: terms as HardwareProductTerms | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service_links: (serviceLinks || []).map((link: any) => ({
      service_package_id: link.service_package_id,
      service_name: link.service_package?.name || '',
      service_slug: link.service_package?.slug || '',
      relationship_type: link.relationship_type,
    })),
    total_stock: detail.total_stock || 0,
    has_stock: (detail.total_stock || 0) > 0,
  }
}

/**
 * Get a hardware product by ID (admin)
 */
export async function getHardwareProductById(
  id: string
): Promise<HardwareProductFull | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('circletel_hardware_products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  const product = data as CircleTelHardwareProduct

  // Fetch related data
  const { data: supplierLinks } = await supabase
    .from('hardware_product_suppliers')
    .select(
      `
      id,
      supplier_cost,
      is_preferred,
      supplier_product:supplier_products (
        id,
        sku,
        name,
        stock_cpt,
        stock_jhb,
        stock_dbn,
        stock_total,
        supplier:suppliers (code, name)
      )
    `
    )
    .eq('hardware_product_id', id)

  const { data: terms } = await supabase
    .from('hardware_product_terms')
    .select('*')
    .eq('hardware_product_id', id)
    .single()

  const { data: serviceLinks } = await supabase
    .from('hardware_service_links')
    .select(
      `
      service_package_id,
      relationship_type,
      service_package:service_packages (name, slug)
    `
    )
    .eq('hardware_product_id', id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suppliers = (supplierLinks || []).map((link: any) => ({
    id: link.id,
    supplier_code: link.supplier_product?.supplier?.code || 'UNKNOWN',
    supplier_name: link.supplier_product?.supplier?.name || 'Unknown',
    sku: link.supplier_product?.sku || '',
    supplier_cost: link.supplier_cost,
    is_preferred: link.is_preferred,
    stock_cpt: link.supplier_product?.stock_cpt || 0,
    stock_jhb: link.supplier_product?.stock_jhb || 0,
    stock_dbn: link.supplier_product?.stock_dbn || 0,
    stock_total: link.supplier_product?.stock_total || 0,
  }))

  return {
    ...product,
    suppliers,
    terms: terms as HardwareProductTerms | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service_links: (serviceLinks || []).map((link: any) => ({
      service_package_id: link.service_package_id,
      service_name: link.service_package?.name || '',
      service_slug: link.service_package?.slug || '',
      relationship_type: link.relationship_type,
    })),
    total_stock: suppliers.reduce((sum, s) => sum + s.stock_total, 0),
    has_stock: suppliers.some((s) => s.stock_total > 0),
  }
}

/**
 * Create a new hardware product
 */
export async function createHardwareProduct(
  input: HardwareProductInsert
): Promise<CircleTelHardwareProduct> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('circletel_hardware_products')
    .insert(input)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create product: ${error.message}`)
  return data as CircleTelHardwareProduct
}

/**
 * Update a hardware product
 */
export async function updateHardwareProduct(
  id: string,
  input: HardwareProductUpdate
): Promise<CircleTelHardwareProduct> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('circletel_hardware_products')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update product: ${error.message}`)
  return data as CircleTelHardwareProduct
}

// =====================================================
// "Promote from Supplier" Workflow
// =====================================================

/**
 * Promote a supplier product to a CircleTel hardware product.
 * Creates the product record and links it to the supplier SKU.
 */
export async function promoteFromSupplier(
  input: PromoteFromSupplierInput
): Promise<PromoteResult> {
  const supabase = await createClient()

  // Fetch the supplier product
  const { data: supplierProduct, error: spError } = await supabase
    .from('supplier_products')
    .select(
      `
      id,
      sku,
      name,
      description,
      manufacturer,
      cost_price,
      specifications,
      category,
      subcategory,
      supplier:suppliers (code, name)
    `
    )
    .eq('id', input.supplier_product_id)
    .single()

  if (spError || !supplierProduct) {
    return {
      success: false,
      error: `Supplier product not found: ${spError?.message}`,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sp = supplierProduct as any
  const supplierCode = sp.supplier?.code || 'UNKNOWN'

  // Calculate retail price if not provided
  const markup = input.default_markup_percent || 25
  const retailPrice =
    input.retail_price ||
    Math.round((sp.cost_price || 0) * (1 + markup / 100) * 100) / 100

  // Create hardware product
  const { data: product, error: createError } = await supabase
    .from('circletel_hardware_products')
    .insert({
      name: input.name || sp.name,
      slug: input.slug,
      description: input.description || sp.description,
      category: input.category || sp.category,
      retail_price: retailPrice,
      cost_price: sp.cost_price || 0,
      status: 'draft',
      is_featured: input.is_featured || false,
      specifications: sp.specifications || {},
      warranty_months:
        sp.specifications?.warranty_months || null,
      primary_supplier_code: supplierCode,
    } satisfies HardwareProductInsert)
    .select('*')
    .single()

  if (createError || !product) {
    return {
      success: false,
      error: `Failed to create product: ${createError?.message}`,
    }
  }

  // Link to supplier
  await supabase.from('hardware_product_suppliers').insert({
    hardware_product_id: product.id,
    supplier_product_id: input.supplier_product_id,
    supplier_cost: sp.cost_price || 0,
    is_preferred: true,
    last_synced_cost: sp.cost_price || 0,
    cost_updated_at: new Date().toISOString(),
  })

  // Create default T&Cs (back-to-back with supplier)
  const warrantyMonths = sp.specifications?.warranty_months
  await supabase.from('hardware_product_terms').insert({
    hardware_product_id: product.id,
    warranty_period: warrantyMonths
      ? `${warrantyMonths} months manufacturer warranty`
      : null,
    return_policy: '7-day return for defects',
    is_back_to_back: true,
    source_supplier_code: supplierCode,
    source_supplier_warranty_months: warrantyMonths || null,
    effective_from: new Date().toISOString(),
  })

  return {
    success: true,
    hardware_product_id: product.id,
    slug: product.slug,
  }
}

// =====================================================
// Pricing
// =====================================================

/**
 * Get pricing suggestions for a supplier product
 */
export async function getPricingSuggestion(
  supplierProductId: string
): Promise<PricingSuggestion | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('supplier_products')
    .select(
      `
      id,
      sku,
      name,
      cost_price,
      supplier:suppliers (code)
    `
    )
    .eq('id', supplierProductId)
    .single()

  if (error || !data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sp = data as any
  const cost = sp.cost_price || 0

  return {
    best_cost: cost,
    suggested_retail: Math.round(cost * 1.25 * 100) / 100, // 25% markup
    supplier_costs: [
      {
        supplier_code: sp.supplier?.code || 'UNKNOWN',
        sku: sp.sku,
        cost,
      },
    ],
  }
}

// =====================================================
// Terms & Service Links
// =====================================================

/**
 * Get terms for a hardware product
 */
export async function getProductTerms(
  hardwareProductId: string
): Promise<HardwareProductTerms | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hardware_product_terms')
    .select('*')
    .eq('hardware_product_id', hardwareProductId)
    .single()
  return (data as HardwareProductTerms) || null
}

/**
 * Get service links for a hardware product
 */
export async function getProductServiceLinks(
  hardwareProductId: string
): Promise<HardwareServiceLink[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hardware_service_links')
    .select('*')
    .eq('hardware_product_id', hardwareProductId)
    .order('sort_order')
  return (data || []) as HardwareServiceLink[]
}

// =====================================================
// Categories
// =====================================================

/**
 * Get distinct categories used in published products
 */
export async function getHardwareCategories(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('circletel_hardware_products')
    .select('category')
    .eq('status', 'published')
    .not('category', 'is', null)

  const categories = new Set<string>()
  for (const row of data || []) {
    if (row.category) categories.add(row.category)
  }
  return Array.from(categories).sort()
}
