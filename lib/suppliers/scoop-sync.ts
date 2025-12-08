/**
 * Scoop Distribution Product Sync Service
 *
 * Fetches products from Scoop's XML price list, parses them,
 * and syncs to the supplier_products table.
 */

import { parseString } from 'xml2js'
import { promisify } from 'util'
import { createClient } from '@/lib/supabase/server'
import {
  ParsedScoopProduct,
  ScoopXmlProduct,
  SyncResult,
  UpsertResult,
  SupplierSyncLogInsert,
} from './types'

const parseXml = promisify(parseString)

// Scoop feed URL (also stored in suppliers table)
const SCOOP_FEED_URL = 'https://scoop.co.za/scoop_pricelist.xml'
const SCOOP_SUPPLIER_CODE = 'SCOOP'

/**
 * Main sync function - fetches XML, parses, and upserts products
 */
export async function syncScoopProducts(options: {
  triggered_by?: 'manual' | 'scheduled' | 'webhook'
  triggered_by_user_id?: string
} = {}): Promise<SyncResult> {
  const startTime = Date.now()
  const supabase = await createClient()

  // Get supplier record
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, feed_url')
    .eq('code', SCOOP_SUPPLIER_CODE)
    .single()

  if (supplierError || !supplier) {
    throw new Error(`Supplier ${SCOOP_SUPPLIER_CODE} not found: ${supplierError?.message}`)
  }

  const feedUrl = supplier.feed_url || SCOOP_FEED_URL

  // Create sync log entry
  const { data: syncLog, error: logError } = await supabase
    .from('supplier_sync_logs')
    .insert({
      supplier_id: supplier.id,
      status: 'started',
      triggered_by: options.triggered_by || 'manual',
      triggered_by_user_id: options.triggered_by_user_id || null,
    } satisfies SupplierSyncLogInsert)
    .select('id')
    .single()

  if (logError || !syncLog) {
    throw new Error(`Failed to create sync log: ${logError?.message}`)
  }

  // Update supplier status to syncing
  await supabase
    .from('suppliers')
    .update({ sync_status: 'syncing', sync_error: null })
    .eq('id', supplier.id)

  try {
    // Fetch XML from Scoop
    console.log(`[ScoopSync] Fetching XML from ${feedUrl}`)
    const xmlData = await fetchXml(feedUrl)

    // Parse XML to products
    console.log('[ScoopSync] Parsing XML...')
    const parsedProducts = await parseXmlToProducts(xmlData)
    console.log(`[ScoopSync] Found ${parsedProducts.length} products`)

    // Upsert products to database
    console.log('[ScoopSync] Upserting products...')
    const upsertResult = await upsertProducts(supabase, supplier.id, parsedProducts)

    // Deactivate products not in feed
    const deactivated = await deactivateMissingProducts(
      supabase,
      supplier.id,
      parsedProducts.map(p => p.sku)
    )

    const duration_ms = Date.now() - startTime

    // Update sync log with results
    await supabase
      .from('supplier_sync_logs')
      .update({
        status: 'completed',
        products_found: parsedProducts.length,
        products_created: upsertResult.created.length,
        products_updated: upsertResult.updated.length,
        products_unchanged: upsertResult.unchanged.length,
        products_deactivated: deactivated,
        images_cached: 0, // Will be updated by image cache service
        duration_ms,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLog.id)

    // Update supplier status
    await supabase
      .from('suppliers')
      .update({
        sync_status: 'success',
        last_synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('id', supplier.id)

    console.log(`[ScoopSync] Sync completed in ${duration_ms}ms`)

    return {
      success: true,
      supplier_id: supplier.id,
      log_id: syncLog.id,
      stats: {
        products_found: parsedProducts.length,
        products_created: upsertResult.created.length,
        products_updated: upsertResult.updated.length,
        products_unchanged: upsertResult.unchanged.length,
        products_deactivated: deactivated,
        images_cached: 0,
      },
      duration_ms,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const duration_ms = Date.now() - startTime

    // Update sync log with error
    await supabase
      .from('supplier_sync_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        duration_ms,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLog.id)

    // Update supplier status
    await supabase
      .from('suppliers')
      .update({
        sync_status: 'failed',
        sync_error: errorMessage,
      })
      .eq('id', supplier.id)

    console.error(`[ScoopSync] Sync failed: ${errorMessage}`)

    return {
      success: false,
      supplier_id: supplier.id,
      log_id: syncLog.id,
      stats: {
        products_found: 0,
        products_created: 0,
        products_updated: 0,
        products_unchanged: 0,
        products_deactivated: 0,
        images_cached: 0,
      },
      duration_ms,
      error: errorMessage,
    }
  }
}

/**
 * Fetch XML content from URL with timeout
 */
async function fetchXml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CircleTel-Sync/1.0',
        'Accept': 'application/xml, text/xml, */*',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.status} ${response.statusText}`)
    }

    return response.text()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('XML fetch timeout - feed took too long to respond')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Parse XML string to array of products
 */
async function parseXmlToProducts(xmlData: string): Promise<ParsedScoopProduct[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await parseXml(xmlData) as any

  // Navigate to products array - structure may vary
  // Common patterns: root.products.product, root.Product, root.Items.Item
  const products = findProductsArray(result)

  if (!products || products.length === 0) {
    throw new Error('No products found in XML feed')
  }

  return products.map(parseXmlProduct).filter((p): p is ParsedScoopProduct => p !== null)
}

/**
 * Find the products array in the parsed XML structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findProductsArray(parsed: any): ScoopXmlProduct[] {
  // Try common XML structures
  if (parsed.products?.product) return parsed.products.product
  if (parsed.Products?.Product) return parsed.Products.Product
  if (parsed.Items?.Item) return parsed.Items.Item
  if (parsed.pricelist?.product) return parsed.pricelist.product
  if (parsed.Pricelist?.Product) return parsed.Pricelist.Product

  // Search recursively for an array
  for (const key of Object.keys(parsed)) {
    const value = parsed[key]
    if (Array.isArray(value) && value.length > 0) {
      // Check if it looks like product data (has SKU or similar)
      if (value[0].SKU || value[0].sku || value[0].ProductCode) {
        return value
      }
    }
    if (typeof value === 'object' && value !== null) {
      const found = findProductsArray(value)
      if (found) return found
    }
  }

  return []
}

/**
 * Parse single XML product to our structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseXmlProduct(xmlProduct: any): ParsedScoopProduct | null {
  try {
    // Extract values - xml2js wraps values in arrays
    const getValue = (field: string): string => {
      const value = xmlProduct[field]
      if (Array.isArray(value)) return value[0] || ''
      return value || ''
    }

    const sku = getValue('SKU') || getValue('sku') || getValue('ProductCode')
    const name = getValue('Description') || getValue('description') || getValue('Name')

    if (!sku || !name) {
      console.warn('[ScoopSync] Skipping product without SKU or name:', xmlProduct)
      return null
    }

    // Parse numeric values safely
    const parseNumber = (value: string): number => {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''))
      return isNaN(num) ? 0 : num
    }

    const parseInt = (value: string): number => {
      const num = Number.parseInt(value.replace(/[^0-9]/g, ''), 10)
      return isNaN(num) ? 0 : num
    }

    const stockCpt = parseInt(getValue('CPT') || getValue('StockCPT') || '0')
    const stockJhb = parseInt(getValue('JHB') || getValue('StockJHB') || '0')
    const stockDbn = parseInt(getValue('DBN') || getValue('StockDBN') || '0')
    const stockTotal = parseInt(getValue('TotalStock') || getValue('Stock') || '0') ||
      (stockCpt + stockJhb + stockDbn)

    return {
      sku: sku.trim(),
      name: name.trim(),
      description: getValue('LongDescription') || null,
      manufacturer: getValue('Manufacturer') || getValue('Brand') || 'Unknown',
      cost_price: parseNumber(getValue('DealerPrice') || getValue('CostPrice') || '0'),
      retail_price: parseNumber(getValue('RetailPrice') || getValue('RRP') || '0'),
      source_image_url: getValue('ImageURL') || getValue('Image') || '',
      stock_cpt: stockCpt,
      stock_jhb: stockJhb,
      stock_dbn: stockDbn,
      stock_total: stockTotal,
      product_url: getValue('ProductURL') || getValue('URL') || null,
      category: getValue('Category') || null,
    }
  } catch (error) {
    console.warn('[ScoopSync] Failed to parse product:', error, xmlProduct)
    return null
  }
}

/**
 * Upsert products to database using batch operations for performance
 */
async function upsertProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  products: ParsedScoopProduct[]
): Promise<UpsertResult> {
  const result: UpsertResult = {
    created: [],
    updated: [],
    unchanged: [],
    errors: [],
  }

  // Get existing products for comparison
  const { data: existingProducts } = await supabase
    .from('supplier_products')
    .select('id, sku, cost_price, stock_total')
    .eq('supplier_id', supplierId)

  interface ExistingProduct {
    sku: string
    id: string
    cost_price: number | null
    stock_total: number
  }

  const existingMap = new Map<string, ExistingProduct>(
    (existingProducts || []).map((p: ExistingProduct) =>
      [p.sku, p]
    )
  )

  const now = new Date().toISOString()

  // Separate products into new and existing for batch processing
  const toInsert: Array<{
    supplier_id: string
    sku: string
    name: string
    description: string | null
    manufacturer: string
    cost_price: number
    retail_price: number
    source_image_url: string
    stock_cpt: number
    stock_jhb: number
    stock_dbn: number
    stock_total: number
    product_url: string | null
    category: string | null
    last_synced_at: string
    is_active: boolean
  }> = []

  const toUpdate: Array<{
    id: string
    sku: string
    data: Record<string, unknown>
  }> = []

  const unchangedIds: string[] = []

  // Categorize products
  for (const product of products) {
    const existing = existingMap.get(product.sku)

    if (existing) {
      const hasChanges =
        existing.cost_price !== product.cost_price ||
        existing.stock_total !== product.stock_total

      if (hasChanges) {
        toUpdate.push({
          id: existing.id,
          sku: product.sku,
          data: {
            name: product.name,
            description: product.description,
            manufacturer: product.manufacturer,
            cost_price: product.cost_price,
            retail_price: product.retail_price,
            source_image_url: product.source_image_url,
            stock_cpt: product.stock_cpt,
            stock_jhb: product.stock_jhb,
            stock_dbn: product.stock_dbn,
            stock_total: product.stock_total,
            product_url: product.product_url,
            category: product.category,
            previous_cost_price: existing.cost_price,
            previous_stock_total: existing.stock_total,
            last_synced_at: now,
            is_active: true,
          },
        })
      } else {
        unchangedIds.push(existing.id)
        result.unchanged.push(product.sku)
      }
    } else {
      toInsert.push({
        supplier_id: supplierId,
        sku: product.sku,
        name: product.name,
        description: product.description,
        manufacturer: product.manufacturer,
        cost_price: product.cost_price,
        retail_price: product.retail_price,
        source_image_url: product.source_image_url,
        stock_cpt: product.stock_cpt,
        stock_jhb: product.stock_jhb,
        stock_dbn: product.stock_dbn,
        stock_total: product.stock_total,
        product_url: product.product_url,
        category: product.category,
        last_synced_at: now,
        is_active: true,
      })
    }
  }

  // Batch insert new products (500 at a time)
  const insertBatchSize = 500
  for (let i = 0; i < toInsert.length; i += insertBatchSize) {
    const batch = toInsert.slice(i, i + insertBatchSize)
    const { error } = await supabase
      .from('supplier_products')
      .insert(batch)

    if (error) {
      console.error('[ScoopSync] Batch insert error:', error)
      batch.forEach(p => result.errors.push({ sku: p.sku, error: error.message }))
    } else {
      batch.forEach(p => result.created.push(p.sku))
    }
  }

  // Batch update existing products (use individual updates but in parallel)
  const updateBatchSize = 50
  for (let i = 0; i < toUpdate.length; i += updateBatchSize) {
    const batch = toUpdate.slice(i, i + updateBatchSize)

    // Execute updates in parallel within batch
    const updatePromises = batch.map(async ({ id, sku, data }) => {
      const { error } = await supabase
        .from('supplier_products')
        .update(data)
        .eq('id', id)

      if (error) {
        result.errors.push({ sku, error: error.message })
      } else {
        result.updated.push(sku)
      }
    })

    await Promise.all(updatePromises)
  }

  // Batch update last_synced_at for unchanged products (500 at a time)
  const unchangedBatchSize = 500
  for (let i = 0; i < unchangedIds.length; i += unchangedBatchSize) {
    const batch = unchangedIds.slice(i, i + unchangedBatchSize)
    await supabase
      .from('supplier_products')
      .update({ last_synced_at: now })
      .in('id', batch)
  }

  return result
}

/**
 * Deactivate products that are no longer in the feed
 */
async function deactivateMissingProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  activeSKUs: string[]
): Promise<number> {
  const { data, error } = await supabase
    .from('supplier_products')
    .update({
      is_active: false,
      is_discontinued: true,
      last_synced_at: new Date().toISOString(),
    })
    .eq('supplier_id', supplierId)
    .eq('is_active', true)
    .not('sku', 'in', `(${activeSKUs.map(s => `"${s}"`).join(',')})`)
    .select('id')

  if (error) {
    console.warn('[ScoopSync] Failed to deactivate missing products:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Get supplier by code
 */
export async function getSupplierByCode(code: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('code', code)
    .single()

  if (error) throw error
  return data
}

/**
 * Get recent sync logs for a supplier
 */
export async function getSyncLogs(supplierId: string, limit = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_sync_logs')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
