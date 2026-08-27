/**
 * Esquire product sync — XML datafeed into supplier_products.
 * Live fetch uses ESQUIRE_FEED_USER / ESQUIRE_FEED_PASSWORD.
 * Tests pass `xml` so CI never calls api.esquire.co.za.
 */

import { createClient } from '@/lib/supabase/server'
import { fetchEsquireXml } from './esquire-feed'
import { planEsquireUpsert, toSupplierProductRow } from './esquire-map'
import { parseEsquireXml } from './esquire-parser'
import type { ParsedEsquireProduct } from './esquire-types'
import type { SupplierSyncLogInsert, SyncResult, UpsertResult } from '../types'

export const ESQUIRE_SUPPLIER_CODE = 'ESQUIRE'

export async function syncEsquireProducts(options: {
  triggered_by?: 'manual' | 'scheduled' | 'webhook'
  triggered_by_user_id?: string
  dry_run?: boolean
  /** Fixture XML — skips the live feed (required in tests). */
  xml?: string
} = {}): Promise<SyncResult> {
  const startTime = Date.now()
  const supabase = await createClient()

  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id')
    .eq('code', ESQUIRE_SUPPLIER_CODE)
    .single()

  if (supplierError || !supplier) {
    throw new Error(
      `Supplier ${ESQUIRE_SUPPLIER_CODE} not found: ${supplierError?.message}`
    )
  }

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

  await supabase
    .from('suppliers')
    .update({ sync_status: 'syncing', sync_error: null })
    .eq('id', supplier.id)

  try {
    const xml = options.xml ?? (await fetchEsquireXml())
    const parseResult = parseEsquireXml(xml)
    if (!parseResult.success) {
      throw new Error(parseResult.errors.join('; ') || 'Esquire XML parse failed')
    }

    if (options.dry_run) {
      const durationMs = Date.now() - startTime
      await finishLog(supabase, syncLog.id, supplier.id, {
        status: 'completed',
        products_found: parseResult.products.length,
        duration_ms: durationMs,
      })
      return emptyResult(supplier.id, syncLog.id, parseResult.products.length, durationMs, true)
    }

    const upsertResult = await upsertEsquireProducts(
      supabase,
      supplier.id,
      parseResult.products
    )
    const durationMs = Date.now() - startTime
    const hasErrors = upsertResult.errors.length > 0

    await finishLog(supabase, syncLog.id, supplier.id, {
      status: hasErrors ? 'failed' : 'completed',
      products_found: parseResult.products.length,
      products_created: upsertResult.created.length,
      products_updated: upsertResult.updated.length,
      products_unchanged: upsertResult.unchanged.length,
      duration_ms: durationMs,
      error_message: upsertResult.errors
        .slice(0, 5)
        .map((e) => `${e.sku}: ${e.error}`)
        .join('; ') || null,
    })

    return {
      success: !hasErrors,
      supplier_id: supplier.id,
      log_id: syncLog.id,
      stats: {
        products_found: parseResult.products.length,
        products_created: upsertResult.created.length,
        products_updated: upsertResult.updated.length,
        products_unchanged: upsertResult.unchanged.length,
        products_deactivated: 0,
        images_cached: 0,
      },
      duration_ms: durationMs,
      error: hasErrors ? upsertResult.errors[0]?.error : undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const durationMs = Date.now() - startTime
    await finishLog(supabase, syncLog.id, supplier.id, {
      status: 'failed',
      duration_ms: durationMs,
      error_message: errorMessage,
    })
    return emptyResult(supplier.id, syncLog.id, 0, durationMs, false, errorMessage)
  }
}

async function finishLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  logId: string,
  supplierId: string,
  fields: {
    status: 'completed' | 'failed'
    products_found?: number
    products_created?: number
    products_updated?: number
    products_unchanged?: number
    duration_ms: number
    error_message?: string | null
  }
) {
  await supabase
    .from('supplier_sync_logs')
    .update({
      ...fields,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId)

  await supabase
    .from('suppliers')
    .update({
      sync_status: fields.status === 'completed' ? 'success' : 'failed',
      last_synced_at: fields.status === 'completed' ? new Date().toISOString() : undefined,
      sync_error: fields.error_message ?? null,
    })
    .eq('id', supplierId)
}

function emptyResult(
  supplierId: string,
  logId: string,
  found: number,
  durationMs: number,
  success: boolean,
  error?: string
): SyncResult {
  return {
    success,
    supplier_id: supplierId,
    log_id: logId,
    stats: {
      products_found: found,
      products_created: 0,
      products_updated: 0,
      products_unchanged: 0,
      products_deactivated: 0,
      images_cached: 0,
    },
    duration_ms: durationMs,
    error,
  }
}

async function upsertEsquireProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  products: ParsedEsquireProduct[]
): Promise<UpsertResult> {
  const result: UpsertResult = {
    created: [],
    updated: [],
    unchanged: [],
    errors: [],
  }

  const existing = await fetchAllSupplierProducts(supabase, supplierId)
  const existingBySku = new Map(
    existing.map((row) => [
      row.sku as string,
      {
        id: row.id as string,
        cost_price: row.cost_price as number | null,
        stock_total: Number(row.stock_total) || 0,
      },
    ])
  )
  const plan = planEsquireUpsert(
    products,
    new Map(
      [...existingBySku].map(([sku, row]) => [
        sku,
        { cost_price: row.cost_price, stock_total: row.stock_total },
      ])
    )
  )
  const bySku = new Map(products.map((p) => [p.sku, p]))
  const now = new Date().toISOString()

  const toInsert = plan.insert
    .map((sku) => bySku.get(sku))
    .filter((p): p is ParsedEsquireProduct => Boolean(p))
    .map((p) => ({ ...toSupplierProductRow(p, supplierId), last_synced_at: now }))

  for (let i = 0; i < toInsert.length; i += 500) {
    const batch = toInsert.slice(i, i + 500)
    const { error } = await supabase.from('supplier_products').insert(batch)
    if (error) {
      batch.forEach((row) => result.errors.push({ sku: row.sku, error: error.message }))
    } else {
      batch.forEach((row) => result.created.push(row.sku))
    }
  }

  for (const sku of plan.update) {
    const product = bySku.get(sku)
    const existingRow = existingBySku.get(sku)
    if (!product || !existingRow) continue
    const row = toSupplierProductRow(product, supplierId)
    const { error } = await supabase
      .from('supplier_products')
      .update({
        name: row.name,
        description: row.description,
        cost_price: row.cost_price,
        source_image_url: row.source_image_url,
        stock_total: row.stock_total,
        category: row.category,
        metadata: row.metadata,
        previous_cost_price: existingRow.cost_price,
        previous_stock_total: existingRow.stock_total,
        last_synced_at: now,
        is_active: true,
      })
      .eq('id', existingRow.id)
    if (error) result.errors.push({ sku, error: error.message })
    else result.updated.push(sku)
  }

  result.unchanged.push(...plan.unchanged)
  return result
}

async function fetchAllSupplierProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const pageSize = 1000
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('supplier_products')
      .select('id, sku, cost_price, stock_total')
      .eq('supplier_id', supplierId)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) {
      throw new Error(`Failed to fetch existing supplier products: ${error.message}`)
    }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
  }
  return all
}
