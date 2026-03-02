/**
 * MiRO Distribution Product Sync Service
 *
 * Fetches products from MiRO category pages via HTML scraping,
 * parses them, and syncs to the supplier_products table.
 */

import { createClient } from '@/lib/supabase/server'
import { parseMiRoCategory, toSupplierProduct } from './miro-parser'
import type { MiRoSyncConfig, ParsedMiRoProduct } from './miro-types'
import type {
  SyncResult,
  UpsertResult,
  SupplierSyncLogInsert,
} from '../types'

const MIRO_SUPPLIER_CODE = 'MIRO'
const DEFAULT_RATE_LIMIT_MS = 2000 // 2 seconds between requests

/**
 * Fetch HTML with rate limiting and retry
 */
async function fetchHtml(url: string, timeout = 30000): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        Referer: 'https://miro.co.za/',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.text()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Fetch timeout after ${timeout}ms: ${url}`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Main sync function - scrapes all MiRO categories and syncs products
 */
export async function syncMiRoProducts(options: {
  triggered_by?: 'manual' | 'scheduled' | 'webhook'
  triggered_by_user_id?: string
  dry_run?: boolean
} = {}): Promise<SyncResult> {
  const startTime = Date.now()
  const supabase = await createClient()

  // Get supplier record
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, feed_url, metadata')
    .eq('code', MIRO_SUPPLIER_CODE)
    .single()

  if (supplierError || !supplier) {
    throw new Error(`Supplier ${MIRO_SUPPLIER_CODE} not found: ${supplierError?.message}`)
  }

  const config = supplier.metadata as MiRoSyncConfig
  const categories = config?.categories || []
  const rateLimitMs = config?.rate_limit_ms || DEFAULT_RATE_LIMIT_MS

  if (categories.length === 0) {
    throw new Error('No categories configured for MiRO supplier')
  }

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
    const allProducts: ParsedMiRoProduct[] = []
    const categoryErrors: string[] = []

    // Scrape each category with rate limiting
    console.log(`[MiRoSync] Starting sync for ${categories.length} categories`)

    for (let i = 0; i < categories.length; i++) {
      const categoryUrl = categories[i]
      console.log(`[MiRoSync] Scraping category ${i + 1}/${categories.length}: ${categoryUrl}`)

      try {
        const html = await fetchHtml(categoryUrl)
        const result = parseMiRoCategory(html, categoryUrl)

        console.log(
          `[MiRoSync] Found ${result.productsFound} products in ${result.categoryName} (${result.duration_ms}ms)`
        )

        // Convert to supplier product format
        const parsedProducts = result.products.map(toSupplierProduct)
        allProducts.push(...parsedProducts)

        if (result.errors.length > 0) {
          categoryErrors.push(...result.errors)
        }
      } catch (error) {
        const errorMsg = `Failed to scrape ${categoryUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`[MiRoSync] ${errorMsg}`)
        categoryErrors.push(errorMsg)
      }

      // Rate limiting between requests (skip after last)
      if (i < categories.length - 1) {
        await sleep(rateLimitMs)
      }
    }

    console.log(`[MiRoSync] Total products scraped: ${allProducts.length}`)

    // Handle dry run
    if (options.dry_run) {
      const durationMs = Date.now() - startTime

      await supabase
        .from('supplier_sync_logs')
        .update({
          status: 'completed',
          products_found: allProducts.length,
          products_created: 0,
          products_updated: 0,
          products_unchanged: 0,
          products_deactivated: 0,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
          error_details: { dry_run: true, categories_scraped: categories.length },
        })
        .eq('id', syncLog.id)

      return {
        success: true,
        supplier_id: supplier.id,
        log_id: syncLog.id,
        stats: {
          products_found: allProducts.length,
          products_created: 0,
          products_updated: 0,
          products_unchanged: 0,
          products_deactivated: 0,
          images_cached: 0,
        },
        duration_ms: durationMs,
      }
    }

    // Deduplicate products by SKU (keep first occurrence)
    const uniqueProducts = deduplicateProducts(allProducts)
    console.log(`[MiRoSync] Unique products after dedup: ${uniqueProducts.length}`)

    // Upsert products to database
    console.log('[MiRoSync] Upserting products...')
    const upsertResult = await upsertProducts(supabase, supplier.id, uniqueProducts)

    // Deactivate products not in scrape
    const deactivated = await deactivateMissingProducts(
      supabase,
      supplier.id,
      uniqueProducts.map((p) => p.sku)
    )

    const durationMs = Date.now() - startTime
    const hasErrors = categoryErrors.length > 0 || upsertResult.errors.length > 0

    // Update sync log with results
    await supabase
      .from('supplier_sync_logs')
      .update({
        status: hasErrors ? 'completed' : 'completed', // Could use 'completed_with_errors'
        products_found: allProducts.length,
        products_created: upsertResult.created.length,
        products_updated: upsertResult.updated.length,
        products_unchanged: upsertResult.unchanged.length,
        products_deactivated: deactivated,
        images_cached: 0,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
        error_message: hasErrors
          ? [...categoryErrors, ...upsertResult.errors.map((e) => `${e.sku}: ${e.error}`)].slice(0, 5).join('; ')
          : null,
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

    console.log(`[MiRoSync] Sync completed in ${durationMs}ms`)

    return {
      success: true,
      supplier_id: supplier.id,
      log_id: syncLog.id,
      stats: {
        products_found: allProducts.length,
        products_created: upsertResult.created.length,
        products_updated: upsertResult.updated.length,
        products_unchanged: upsertResult.unchanged.length,
        products_deactivated: deactivated,
        images_cached: 0,
      },
      duration_ms: durationMs,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const durationMs = Date.now() - startTime

    // Update sync log with error
    await supabase
      .from('supplier_sync_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        duration_ms: durationMs,
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

    console.error(`[MiRoSync] Sync failed: ${errorMessage}`)

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
      duration_ms: durationMs,
      error: errorMessage,
    }
  }
}

/**
 * Deduplicate products by SKU, keeping first occurrence
 */
function deduplicateProducts(products: ParsedMiRoProduct[]): ParsedMiRoProduct[] {
  const seen = new Set<string>()
  return products.filter((p) => {
    if (seen.has(p.sku)) return false
    seen.add(p.sku)
    return true
  })
}

/**
 * Upsert products to database
 */
async function upsertProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  products: ParsedMiRoProduct[]
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
    (existingProducts || []).map((p: ExistingProduct) => [p.sku, p])
  )

  const now = new Date().toISOString()

  // Separate products into new and existing
  const toInsert: Array<Record<string, unknown>> = []
  const toUpdate: Array<{ id: string; sku: string; data: Record<string, unknown> }> = []
  const unchangedIds: string[] = []

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
    const { error } = await supabase.from('supplier_products').insert(batch)

    if (error) {
      console.error('[MiRoSync] Batch insert error:', error)
      batch.forEach((p) => result.errors.push({ sku: p.sku as string, error: error.message }))
    } else {
      batch.forEach((p) => result.created.push(p.sku as string))
    }
  }

  // Batch update existing products
  const updateBatchSize = 50
  for (let i = 0; i < toUpdate.length; i += updateBatchSize) {
    const batch = toUpdate.slice(i, i + updateBatchSize)

    const updatePromises = batch.map(async ({ id, sku, data }) => {
      const { error } = await supabase.from('supplier_products').update(data).eq('id', id)

      if (error) {
        result.errors.push({ sku, error: error.message })
      } else {
        result.updated.push(sku)
      }
    })

    await Promise.all(updatePromises)
  }

  // Batch update last_synced_at for unchanged products
  const unchangedBatchSize = 500
  for (let i = 0; i < unchangedIds.length; i += unchangedBatchSize) {
    const batch = unchangedIds.slice(i, i + unchangedBatchSize)
    await supabase.from('supplier_products').update({ last_synced_at: now }).in('id', batch)
  }

  return result
}

/**
 * Deactivate products not in the current scrape
 */
async function deactivateMissingProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  activeSKUs: string[]
): Promise<number> {
  if (activeSKUs.length === 0) return 0

  const { data, error } = await supabase
    .from('supplier_products')
    .update({
      is_active: false,
      is_discontinued: true,
      last_synced_at: new Date().toISOString(),
    })
    .eq('supplier_id', supplierId)
    .eq('is_active', true)
    .not('sku', 'in', `(${activeSKUs.map((s) => `"${s}"`).join(',')})`)
    .select('id')

  if (error) {
    console.warn('[MiRoSync] Failed to deactivate missing products:', error)
    return 0
  }

  return data?.length || 0
}
