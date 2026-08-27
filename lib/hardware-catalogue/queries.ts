/**
 * Hardware Product Catalogue — Database Queries
 *
 * Supabase query functions for the CircleTel hardware product catalogue.
 * All functions use the service-role client (server-side only).
 */

import { createClient } from '@/lib/supabase/server'
import {
  decidePromote,
  leadTimeLabel,
  quotesFromShopFields,
} from '@/lib/hardware-catalogue/promote-decision'
import {
  isBooleanSupplierStock,
  isStorefrontPublished,
  leadTimeFromPromote,
} from '@/lib/hardware-catalogue/storefront'
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
    data: await attachStorefrontFields(
      supabase,
      (data || []) as HardwareProductDetail[]
    ),
    total: count || 0,
    page,
    page_size: pageSize,
    has_more: (count || 0) > offset + pageSize,
  }
}

async function attachStorefrontFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: HardwareProductDetail[]
): Promise<HardwareProductDetail[]> {
  if (rows.length === 0) return rows
  const ids = rows.map((row) => row.id)
  const { data: extras } = await supabase
    .from('circletel_hardware_products')
    .select('id, metadata, primary_supplier_code')
    .in('id', ids)
  const { data: termsRows } = await supabase
    .from('hardware_product_terms')
    .select('hardware_product_id, delivery_estimate')
    .in('hardware_product_id', ids)

  const extraById = new Map((extras || []).map((row) => [row.id, row]))
  const termsById = new Map(
    (termsRows || []).map((row) => [row.hardware_product_id, row.delivery_estimate])
  )

  return rows.map((row) => {
    const extra = extraById.get(row.id)
    const metadata =
      (extra?.metadata as Record<string, unknown> | null) || row.metadata
    const supplierCode =
      extra?.primary_supplier_code || row.primary_supplier_code
    return {
      ...row,
      metadata: metadata || {},
      primary_supplier_code: supplierCode,
      stock_is_boolean: isBooleanSupplierStock(supplierCode),
      lead_time_label: leadTimeFromPromote({
        metadata,
        deliveryEstimate: termsById.get(row.id),
      }),
    }
  })
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
  if (!isStorefrontPublished(product.status)) return null

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

  const preferred = suppliers.find((s) => s.is_preferred) || suppliers[0]
  const stockIsBoolean = isBooleanSupplierStock(preferred?.supplier_code)
  const [enriched] = await attachStorefrontFields(supabase, [detail])

  return {
    ...detail,
    ...enriched,
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
    stock_is_boolean: stockIsBoolean,
    lead_time_label:
      enriched?.lead_time_label ||
      leadTimeFromPromote({
        deliveryEstimate: (terms as HardwareProductTerms | null)?.delivery_estimate,
      }),
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

  const quotes = quotesFromShopFields({
    afrihostUrl: input.afrihost_url,
    afrihostPrice: input.afrihost_price,
    axxessUrl: input.axxess_url,
    axxessPrice: input.axxess_price,
  })
  const decision = decidePromote({
    costExclVat: Number(sp.cost_price) || 0,
    quotes,
    confirmUnbenchmarked: input.confirm_unbenchmarked,
    streetNote: input.street_note,
    leadTime:
      input.lead_time_min_days && input.lead_time_max_days
        ? {
            min: input.lead_time_min_days,
            max: input.lead_time_max_days,
          }
        : undefined,
  })
  if (!decision.allowed) {
    return { success: false, error: decision.error }
  }

  const { data: existingLink } = await supabase
    .from('hardware_product_suppliers')
    .select('hardware_product_id')
    .eq('supplier_product_id', input.supplier_product_id)
    .maybeSingle()

  const hardwareFields = {
    name: input.name || sp.name,
    description: input.description || sp.description,
    category: input.category || sp.category,
    retail_price: decision.listInclVat,
    cost_price: sp.cost_price || 0,
    metadata: decision.metadata as unknown as Record<string, unknown>,
  }

  if (existingLink?.hardware_product_id) {
    const { data: product, error: updateError } = await supabase
      .from('circletel_hardware_products')
      .update(hardwareFields)
      .eq('id', existingLink.hardware_product_id)
      .select('*')
      .single()

    if (updateError || !product) {
      return {
        success: false,
        error: `Failed to update product: ${updateError?.message}`,
      }
    }

    await supabase
      .from('hardware_product_suppliers')
      .update({
        supplier_cost: sp.cost_price || 0,
        last_synced_cost: sp.cost_price || 0,
        cost_updated_at: new Date().toISOString(),
      })
      .eq('supplier_product_id', input.supplier_product_id)

    await refreshPreferredSupplier(product.id, supabase)
    return {
      success: true,
      hardware_product_id: product.id,
      slug: product.slug,
    }
  }

  const { data: product, error: createError } = await supabase
    .from('circletel_hardware_products')
    .insert({
      ...hardwareFields,
      slug: input.slug,
      status: 'draft',
      is_featured: input.is_featured || false,
      specifications: sp.specifications || {},
      warranty_months: sp.specifications?.warranty_months || null,
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

  await supabase.from('hardware_product_suppliers').insert({
    hardware_product_id: product.id,
    supplier_product_id: input.supplier_product_id,
    supplier_cost: sp.cost_price || 0,
    is_preferred: true,
    last_synced_cost: sp.cost_price || 0,
    cost_updated_at: new Date().toISOString(),
  })

  const warrantyMonths = sp.specifications?.warranty_months
  await supabase.from('hardware_product_terms').insert({
    hardware_product_id: product.id,
    warranty_period: warrantyMonths
      ? `${warrantyMonths} months manufacturer warranty`
      : null,
    return_policy: '7-day return for defects',
    delivery_estimate: leadTimeLabel(decision.metadata.lead_time_business_days),
    is_back_to_back: true,
    source_supplier_code: supplierCode,
    source_supplier_warranty_months: warrantyMonths || null,
    effective_from: new Date().toISOString(),
  })

  await refreshPreferredSupplier(product.id, supabase)

  return {
    success: true,
    hardware_product_id: product.id,
    slug: product.slug,
  }
}

async function refreshPreferredSupplier(
  hardwareProductId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const { data: links } = await supabase
    .from('hardware_product_suppliers')
    .select('id, supplier_cost')
    .eq('hardware_product_id', hardwareProductId)

  if (!links?.length) return

  const preferred = links.reduce(
    (
      best: { id: string; supplier_cost: number },
      row: { id: string; supplier_cost: number }
    ) => (row.supplier_cost < best.supplier_cost ? row : best),
    links[0]
  )

  await supabase
    .from('hardware_product_suppliers')
    .update({ is_preferred: false })
    .eq('hardware_product_id', hardwareProductId)

  await supabase
    .from('hardware_product_suppliers')
    .update({ is_preferred: true })
    .eq('id', preferred.id)

  const { data: preferredLink } = await supabase
    .from('hardware_product_suppliers')
    .select('supplier_product:supplier_products(supplier:suppliers(code))')
    .eq('id', preferred.id)
    .maybeSingle()

  const preferredCode =
    preferredLink?.supplier_product?.supplier?.code
  if (preferredCode) {
    await supabase
      .from('circletel_hardware_products')
      .update({
        primary_supplier_code: preferredCode,
        cost_price: preferred.supplier_cost,
      })
      .eq('id', hardwareProductId)
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
