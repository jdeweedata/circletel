/**
 * MiRO Product Sync Service (xlsx-based)
 *
 * Updated from HTML scraping to xlsx file parsing.
 * Scans watch dir for latest MiRO price list xlsx, parses all brand sheets,
 * and syncs to supplier_products.
 *
 * Note: MiRO xlsx does NOT include stock levels or warranty info.
 */

import { readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { createClient } from '@/lib/supabase/server'
import { parseMiRoCsvContent, parseMiRoFile, parseMiRoXlsxBuffer } from './miro-parser'
import type { MiRoParseResult, MiRoSyncConfig, ParsedMiRoProduct } from './miro-types'
import type {
  SyncResult,
  UpsertResult,
  SupplierSyncLogInsert,
} from '../types'

const MIRO_SUPPLIER_CODE = 'MIRO'
const DEFAULT_FILE_PATTERN = 'miro_price_list*.xlsx'
const DEFAULT_WATCH_DIR = '/home/circletel/products/pricelist'

// =====================================================
// Public API
// =====================================================

export async function syncMiRoProducts(options: {
  triggered_by?: 'manual' | 'scheduled' | 'webhook'
  triggered_by_user_id?: string
  dry_run?: boolean
  file_path?: string
} = {}): Promise<SyncResult> {
  const startTime = Date.now()
  const supabase = await createClient()

  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, feed_url, metadata')
    .eq('code', MIRO_SUPPLIER_CODE)
    .single()

  if (supplierError || !supplier) {
    throw new Error(
      `Supplier ${MIRO_SUPPLIER_CODE} not found: ${supplierError?.message}`
    )
  }

  const config = (supplier.metadata || {}) as Partial<MiRoSyncConfig> & {
    pricing_csv_url?: string
  }
  const watchDir = config.watch_dir || DEFAULT_WATCH_DIR
  const filePattern = config.file_pattern || DEFAULT_FILE_PATTERN
  const csvUrl =
    process.env.MIRO_PRICING_CSV_URL ||
    config.pricing_csv_url ||
    supplier.feed_url

  const filePath = csvUrl
    ? null
    : options.file_path || findLatestFile(watchDir, filePattern)

  if (!csvUrl && !filePath) {
    throw new Error(
      `No files matching "${filePattern}" found in ${watchDir}`
    )
  }

  console.log(
    csvUrl ? '[MiRoSync] Using live CSV feed' : `[MiRoSync] Using file: ${filePath}`
  )

  // Create sync log
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

  if (!options.dry_run) {
    await supabase
      .from('suppliers')
      .update({ sync_status: 'syncing', sync_error: null })
      .eq('id', supplier.id)
  }

  try {
    const source = await loadMiRoPricingSource({ csvUrl, filePath })
    const parseResult = source.parseResult

    if (!parseResult.success) {
      throw new Error(
        `Failed to parse file: ${parseResult.errors.join('; ')}`
      )
    }

    console.log(
      `[MiRoSync] Parsed ${parseResult.products_parsed} products ` +
        `from ${parseResult.sheets_processed} brands ` +
        `(${parseResult.duration_ms}ms)`
    )

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
            source: source.description,
            products_parsed: parseResult.products_parsed,
            sheets: parseResult.sheets_processed,
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

    // Deduplicate
    const uniqueProducts = deduplicateProducts(parseResult.products)
    console.log(
      `[MiRoSync] Unique products after dedup: ${uniqueProducts.length}`
    )

    // Upsert
    console.log('[MiRoSync] Upserting products...')
    const upsertResult = await upsertProducts(
      supabase,
      supplier.id,
      uniqueProducts
    )

    const deactivated = await deactivateMissingProducts(
      supabase,
      supplier.id,
      uniqueProducts.map((p) => p.sku)
    )

    const durationMs = Date.now() - startTime
    const hasErrors =
      parseResult.errors.length > 0 || upsertResult.errors.length > 0

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
        error_message: hasErrors
          ? [
              ...parseResult.errors,
              ...upsertResult.errors.map(
                (e) => `${e.sku}: ${e.error}`
              ),
            ]
              .slice(0, 5)
              .join('; ')
          : null,
      })
      .eq('id', syncLog.id)

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

    await supabase
      .from('supplier_sync_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLog.id)

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

// =====================================================
// Helpers
// =====================================================

async function loadMiRoPricingSource({
  csvUrl,
  filePath,
}: {
  csvUrl: string | null
  filePath: string | null
}): Promise<{ parseResult: MiRoParseResult; description: string }> {
  if (csvUrl) {
    console.log('[MiRoSync] Fetching live MiRO pricing feed...')
    const feed = await fetchMiRoPricingFeed(csvUrl)
    const isWorkbook =
      feed.contentType.includes('spreadsheet') ||
      feed.contentType.includes('excel') ||
      isZipBuffer(feed.buffer)

    return {
      parseResult: isWorkbook
        ? await parseMiRoXlsxBuffer(feed.buffer, 'miro-live-pricing.xlsx')
        : parseMiRoCsvContent(feed.buffer.toString('utf8'), 'miro-live-pricing.csv'),
      description: isWorkbook ? 'live XLSX feed' : 'live CSV feed',
    }
  }

  if (!filePath) {
    throw new Error('No MiRO xlsx file path supplied')
  }

  console.log('[MiRoSync] Parsing xlsx file...')
  return {
    parseResult: await parseMiRoFile(filePath),
    description: basename(filePath),
  }
}

async function fetchMiRoPricingFeed(url: string): Promise<{
  buffer: Buffer
  contentType: string
}> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000)
  const headers: Record<string, string> = {
    'User-Agent': 'CircleTel-Sync/1.0',
    Accept: 'text/csv,text/plain,*/*',
  }

  const username = process.env.MIRO_PRICING_USERNAME
  const password = process.env.MIRO_PRICING_PASSWORD
  if (username && password) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  }

  try {
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch MiRO CSV: ${response.status} ${response.statusText}`)
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') || '',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('MiRO CSV fetch timeout - feed took too long to respond')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function isZipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b
}

function findLatestFile(
  watchDir: string,
  pattern: string
): string | null {
  try {
    const regex = new RegExp(
      '^' +
        pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.') +
        '$',
      'i'
    )
    const files = readdirSync(watchDir)
      .filter((f) => regex.test(f))
      .map((f) => {
        const fp = join(watchDir, f)
        try {
          return { path: fp, mtime: statSync(fp).mtimeMs }
        } catch {
          return null
        }
      })
      .filter(
        (f): f is { path: string; mtime: number } => f !== null
      )
      .sort((a, b) => b.mtime - a.mtime)
    return files[0]?.path || null
  } catch {
    return null
  }
}

function deduplicateProducts(
  products: ParsedMiRoProduct[]
): ParsedMiRoProduct[] {
  const seen = new Set<string>()
  return products.filter((p) => {
    if (seen.has(p.sku)) return false
    seen.add(p.sku)
    return true
  })
}

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

  const { data: existingProducts } = await supabase
    .from('supplier_products')
    .select('id, sku, cost_price, stock_total')
    .eq('supplier_id', supplierId)

  interface EP {
    sku: string
    id: string
    cost_price: number | null
    stock_total: number
  }
  const existingMap = new Map<string, EP>(
    (existingProducts || []).map((p: EP) => [p.sku, p])
  )

  const now = new Date().toISOString()
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
            product_url: product.product_url,
            category: product.manufacturer,
            previous_cost_price: existing.cost_price,
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
        product_url: product.product_url,
        category: product.manufacturer,
        last_synced_at: now,
        is_active: true,
      })
    }
  }

  const insertBatchSize = 500
  for (let i = 0; i < toInsert.length; i += insertBatchSize) {
    const batch = toInsert.slice(i, i + insertBatchSize)
    const { error } = await supabase
      .from('supplier_products')
      .insert(batch)
    if (error) {
      batch.forEach((p) =>
        result.errors.push({
          sku: p.sku as string,
          error: error.message,
        })
      )
    } else {
      batch.forEach((p) => result.created.push(p.sku as string))
    }
  }

  const updateBatchSize = 50
  for (let i = 0; i < toUpdate.length; i += updateBatchSize) {
    const batch = toUpdate.slice(i, i + updateBatchSize)
    await Promise.all(
      batch.map(async ({ id, sku, data }) => {
        const { error } = await supabase
          .from('supplier_products')
          .update(data)
          .eq('id', id)
        if (error) result.errors.push({ sku, error: error.message })
        else result.updated.push(sku)
      })
    )
  }

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

async function deactivateMissingProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  activeSKUs: string[]
): Promise<number> {
  if (activeSKUs.length === 0) return 0
  const { data } = await supabase
    .from('supplier_products')
    .update({
      is_active: false,
      is_discontinued: true,
      last_synced_at: new Date().toISOString(),
    })
    .eq('supplier_id', supplierId)
    .eq('is_active', true)
    .not('sku', 'in', activeSKUs)
    .select('id')
  return data?.length || 0
}
