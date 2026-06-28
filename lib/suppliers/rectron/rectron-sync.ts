/**
 * Rectron Product Sync Service
 *
 * Syncs products from the Rectron .xlsm price list file. The latest file is
 * auto-downloaded from the public RectronZone CDN (no authentication required)
 * via downloadRectronPricelist(). If download fails, falls back to the latest
 * locally-cached file in the watch directory.
 *
 * The sync parses the .xlsm file and upserts products to the supplier_products table.
 *
 * Note: Rectron does not provide stock levels — stock fields will be 0.
 */

import { readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { createClient } from '@/lib/supabase/server'
import { parseRectronFile, parseRectronBuffer } from './rectron-parser'
import { downloadRectronBuffer } from './rectron-downloader'
import type { RectronSyncConfig, ParsedRectronProduct } from './rectron-types'
import type {
  SyncResult,
  UpsertResult,
  SupplierSyncLogInsert,
} from '../types'

const RECTRON_SUPPLIER_CODE = 'RECTRON'
const DEFAULT_FILE_PATTERN = 'RECTRON_PRICE_LIST_*.xlsm'
const DEFAULT_WATCH_DIR = '/home/circletel/products/pricelist'

// =====================================================
// Public API
// =====================================================

/**
 * Sync Rectron products from the latest xlsm file in the watch directory
 */
export async function syncRectronProducts(options: {
  triggered_by?: 'manual' | 'scheduled' | 'webhook'
  triggered_by_user_id?: string
  dry_run?: boolean
  /** Override file path for testing */
  file_path?: string
  /** Auto-download the latest file before syncing (default: true) */
  download?: boolean
} = {}): Promise<SyncResult> {
  const startTime = Date.now()
  const supabase = await createClient()

  // Get supplier record
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, metadata')
    .eq('code', RECTRON_SUPPLIER_CODE)
    .single()

  if (supplierError || !supplier) {
    throw new Error(
      `Supplier ${RECTRON_SUPPLIER_CODE} not found: ${supplierError?.message}`
    )
  }

  const config = (supplier.metadata || {}) as RectronSyncConfig
  const watchDir = config.watch_dir || DEFAULT_WATCH_DIR
  const filePattern = config.file_pattern || DEFAULT_FILE_PATTERN

  // Resolve the catalogue source:
  // 1. explicit file override, else 2. auto-download into memory (no disk —
  //    works in serverless/containers), else 3. latest local file.
  let downloadBuffer: Buffer | null = null
  let filePath: string | undefined | null = options.file_path
  let sourceName = ''
  let downloadWarning: string | null = null

  if (!filePath && (options.download ?? true)) {
    try {
      const dl = await downloadRectronBuffer({
        pageUrl: config.download_page_url,
        cdnBase: config.cdn_base_url,
      })
      downloadBuffer = dl.buffer
      sourceName = dl.filename
      console.log(
        `[RectronSync] Auto-download: ${dl.filename} (${dl.buffer.length} bytes, in-memory)`
      )
    } catch (error) {
      downloadWarning = `Auto-download failed, using latest local file: ${
        error instanceof Error ? error.message : String(error)
      }`
      console.warn(`[RectronSync] ${downloadWarning}`)
    }
  }

  if (!downloadBuffer) {
    filePath = filePath || findLatestFile(watchDir, filePattern)
    if (!filePath) {
      throw new Error(
        `No files matching "${filePattern}" found in ${watchDir}`
      )
    }
    sourceName = basename(filePath)
    console.log(`[RectronSync] Using file: ${filePath}`)
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
    // Parse the xlsm — from the in-memory download when available, else from disk.
    console.log('[RectronSync] Parsing xlsm file...')
    const parseResult = downloadBuffer
      ? await parseRectronBuffer(downloadBuffer, sourceName)
      : await parseRectronFile(filePath!)

    if (!parseResult.success) {
      throw new Error(
        `Failed to parse file: ${parseResult.errors.join('; ')}`
      )
    }

    console.log(
      `[RectronSync] Parsed ${parseResult.products_parsed} products ` +
        `(${parseResult.rows_skipped} rows skipped) in ${parseResult.duration_ms}ms`
    )

    // Handle dry run
    if (options.dry_run) {
      const durationMs = Date.now() - startTime

      await supabase
        .from('supplier_sync_logs')
        .update({
          status: 'completed',
          products_found: parseResult.products_found,
          products_created: 0,
          products_updated: 0,
          products_unchanged: 0,
          products_deactivated: 0,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
          error_details: {
            dry_run: true,
            file: sourceName,
            products_parsed: parseResult.products_parsed,
            download_warning: downloadWarning || undefined,
          },
        })
        .eq('id', syncLog.id)

      return {
        success: true,
        supplier_id: supplier.id,
        log_id: syncLog.id,
        stats: {
          products_found: parseResult.products_found,
          products_created: 0,
          products_updated: 0,
          products_unchanged: 0,
          products_deactivated: 0,
          images_cached: 0,
        },
        duration_ms: durationMs,
      }
    }

    // Upsert products to database
    console.log('[RectronSync] Upserting products...')
    const upsertResult = await upsertProducts(
      supabase,
      supplier.id,
      parseResult.products
    )

    // Deactivate products not in the current file
    const deactivated = await deactivateMissingProducts(
      supabase,
      supplier.id,
      parseResult.products.map((p) => p.sku)
    )

    const durationMs = Date.now() - startTime
    const hasErrors =
      parseResult.errors.length > 0 || upsertResult.errors.length > 0

    // Update sync log with results
    await supabase
      .from('supplier_sync_logs')
      .update({
        status: 'completed',
        products_found: parseResult.products_found,
        products_created: upsertResult.created.length,
        products_updated: upsertResult.updated.length,
        products_unchanged: upsertResult.unchanged.length,
        products_deactivated: deactivated,
        images_cached: 0,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
        error_message: (() => {
          const messages = [
            ...(downloadWarning ? [downloadWarning] : []),
            ...parseResult.errors,
            ...upsertResult.errors.map((e) => `${e.sku}: ${e.error}`),
          ]
          return messages.length ? messages.slice(0, 5).join('; ') : null
        })(),
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

    console.log(`[RectronSync] Sync completed in ${durationMs}ms`)

    return {
      success: true,
      supplier_id: supplier.id,
      log_id: syncLog.id,
      stats: {
        products_found: parseResult.products_found,
        products_created: upsertResult.created.length,
        products_updated: upsertResult.updated.length,
        products_unchanged: upsertResult.unchanged.length,
        products_deactivated: deactivated,
        images_cached: 0,
      },
      duration_ms: durationMs,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
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

    console.error(`[RectronSync] Sync failed: ${errorMessage}`)

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

// =====================================================
// File Discovery
// =====================================================

/**
 * Find the latest file matching the pattern in the watch directory
 */
function findLatestFile(
  watchDir: string,
  pattern: string
): string | null {
  try {
    // Convert glob pattern to regex
    const regex = new RegExp(
      '^' +
        pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.') +
        '$'
    )

    const files = readdirSync(watchDir)
      .filter((f) => regex.test(f))
      .map((f) => {
        const fullPath = join(watchDir, f)
        try {
          return { path: fullPath, mtime: statSync(fullPath).mtimeMs }
        } catch {
          return null
        }
      })
      .filter((f): f is { path: string; mtime: number } => f !== null)
      .sort((a, b) => b.mtime - a.mtime) // newest first

    return files[0]?.path || null
  } catch (error) {
    console.error('[RectronSync] Error scanning directory:', error)
    return null
  }
}

// =====================================================
// Database Operations
// =====================================================

/**
 * Upsert products to database
 */
/**
 * Fetch ALL supplier_products rows for a supplier, paginating past Supabase's
 * default 1000-row select cap. A plain `.select()` silently returns at most
 * 1000 rows; this catalogue exceeds that, which previously caused partial
 * upserts (missed updates, false "new" inserts) and broken deactivation.
 */
async function fetchAllSupplierProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  columns: string,
  activeOnly = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const pageSize = 1000
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = []
  for (let from = 0; ; from += pageSize) {
    let q = supabase
      .from('supplier_products')
      .select(columns)
      .eq('supplier_id', supplierId)
    if (activeOnly) q = q.eq('is_active', true)
    const { data, error } = await q
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) {
      throw new Error(
        `Failed to fetch existing supplier products: ${error.message}`
      )
    }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
  }
  return all
}

async function upsertProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  products: ParsedRectronProduct[]
): Promise<UpsertResult> {
  const result: UpsertResult = {
    created: [],
    updated: [],
    unchanged: [],
    errors: [],
  }

  // Get ALL existing products for comparison (paginated past the 1000-row cap).
  const existingProducts = await fetchAllSupplierProducts(
    supabase,
    supplierId,
    'id, sku, cost_price, stock_total'
  )

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
  const toUpdate: Array<{
    id: string
    sku: string
    data: Record<string, unknown>
  }> = []
  const unchangedIds: string[] = []

  for (const product of products) {
    const existing = existingMap.get(product.sku)

    if (existing) {
      // Check for changes (Rectron has no stock, so only compare price)
      const hasChanges = existing.cost_price !== product.cost_price

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
            category: product.category,
            subcategory: product.subcategory,
            specifications: {
              warranty_months: product.warranty_months,
            },
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
        stock_cpt: 0,
        stock_jhb: 0,
        stock_dbn: 0,
        stock_total: 0,
        product_url: product.product_url,
        category: product.category,
        subcategory: product.subcategory,
        specifications: {
          warranty_months: product.warranty_months,
        },
        last_synced_at: now,
        is_active: true,
      })
    }
  }

  // Batch insert new products
  const insertBatchSize = 500
  for (let i = 0; i < toInsert.length; i += insertBatchSize) {
    const batch = toInsert.slice(i, i + insertBatchSize)
    const { error } = await supabase.from('supplier_products').insert(batch)

    if (error) {
      console.error('[RectronSync] Batch insert error:', error)
      batch.forEach((p) =>
        result.errors.push({ sku: p.sku as string, error: error.message })
      )
    } else {
      batch.forEach((p) => result.created.push(p.sku as string))
    }
  }

  // Batch update existing products
  const updateBatchSize = 50
  for (let i = 0; i < toUpdate.length; i += updateBatchSize) {
    const batch = toUpdate.slice(i, i + updateBatchSize)

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

  // Batch update last_synced_at for unchanged products
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
 * Deactivate products not in the current file
 */
async function deactivateMissingProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  activeSKUs: string[]
): Promise<number> {
  if (activeSKUs.length === 0) return 0

  const activeSet = new Set(activeSKUs)

  // Fetch ALL currently-active products (paginated) and compute, in JS, the ones
  // whose SKU is no longer in the file. The previous `.not('sku','in', array)`
  // filter was malformed (array not serialized to a PostgREST list) and, with
  // hundreds of SKUs, would also overflow the request URL — so it deactivated
  // nothing, leaving obsolete products active.
  const existingActive = await fetchAllSupplierProducts(
    supabase,
    supplierId,
    'id, sku',
    true
  )
  const toDeactivate = existingActive
    .filter((p: { sku: string }) => !activeSet.has(p.sku))
    .map((p: { id: string }) => p.id)

  if (toDeactivate.length === 0) return 0

  const now = new Date().toISOString()
  const batchSize = 500
  let deactivated = 0

  for (let i = 0; i < toDeactivate.length; i += batchSize) {
    const batch = toDeactivate.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from('supplier_products')
      .update({
        is_active: false,
        is_discontinued: true,
        last_synced_at: now,
      })
      .in('id', batch)
      .select('id')

    if (error) {
      console.warn(
        '[RectronSync] Failed to deactivate missing products batch:',
        error
      )
      continue
    }
    deactivated += data?.length || 0
  }

  return deactivated
}
