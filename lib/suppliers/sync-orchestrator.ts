/**
 * Unified Supplier Sync Orchestrator
 *
 * Runs all active supplier syncs in sequence (or optionally in parallel),
 * collects aggregate results, and reports errors per-supplier without
 * aborting the entire run when one supplier fails.
 *
 * Usage:
 *   import { syncAllSuppliers } from '@/lib/suppliers/sync-orchestrator'
 *   const result = await syncAllSuppliers({ dry_run: true })
 */

import { createClient } from '@/lib/supabase/server'
import { syncScoopProducts } from './scoop-sync'
import { syncNologyProducts } from './nology'
import { syncMiRoProducts } from './miro'
import { syncRectronProducts } from './rectron'
import { syncHardwareCosts } from '@/lib/hardware-catalogue/pricing'
import { detectSupplierTermChanges } from '@/lib/hardware-catalogue/terms'
import type { SyncResult } from './types'

// =====================================================
// Types
// =====================================================

export interface OrchestratorOptions {
  /** Trigger source for sync logs */
  triggered_by?: 'manual' | 'scheduled' | 'webhook'
  /** Admin user who triggered (if manual) */
  triggered_by_user_id?: string
  /** Dry run mode: parse feeds but don't write to DB */
  dry_run?: boolean
  /** Filter to specific supplier codes (comma-separated). Default: all active. */
  suppliers?: string
  /** Run syncs in parallel instead of sequentially */
  parallel?: boolean
  /** Verbose logging */
  verbose?: boolean
}

export interface SupplierSyncOutcome {
  supplier_code: string
  supplier_name: string
  success: boolean
  result?: SyncResult
  error?: string
  skipped?: string // reason for skipping
}

export interface AggregateSyncResult {
  /** Overall success (true if all suppliers succeeded or were skipped) */
  success: boolean
  /** Number of suppliers that were synced */
  suppliers_synced: number
  /** Number of suppliers that failed */
  suppliers_failed: number
  /** Number of suppliers skipped (inactive, filtered out) */
  suppliers_skipped: number
  /** Aggregate statistics across all suppliers */
  totals: {
    products_found: number
    products_created: number
    products_updated: number
    products_unchanged: number
    products_deactivated: number
    images_cached: number
    duration_ms: number
  }
  /** Per-supplier breakdown */
  suppliers: SupplierSyncOutcome[]
}

// =====================================================
// Sync Function Registry
// =====================================================

interface SyncFn {
  (options: {
    triggered_by?: 'manual' | 'scheduled' | 'webhook'
    triggered_by_user_id?: string
    dry_run?: boolean
  }): Promise<SyncResult>
}

interface SyncFnWithFile {
  (options: {
    triggered_by?: 'manual' | 'scheduled' | 'webhook'
    triggered_by_user_id?: string
    dry_run?: boolean
    file_path?: string
  }): Promise<SyncResult>
}

interface SupplierSyncDef {
  code: string
  name: string
  fn: SyncFn
  /** Whether this supplier supports dry_run mode */
  supports_dry_run: boolean
  /** Whether this supplier has stock data */
  has_stock_data: boolean
}

function getSyncRegistry(): SupplierSyncDef[] {
  return [
    {
      code: 'SCOOP',
      name: 'Scoop Distribution',
      fn: syncScoopProducts as SyncFn,
      supports_dry_run: false,
      has_stock_data: true,
    },
    {
      code: 'NOLOGY',
      name: 'Nology',
      fn: syncNologyProducts as SyncFnWithFile as SyncFn,
      supports_dry_run: true,
      has_stock_data: false,
    },
    {
      code: 'MIRO',
      name: 'MiRO Distribution',
      fn: syncMiRoProducts as SyncFnWithFile as SyncFn,
      supports_dry_run: true,
      has_stock_data: true,
    },
    {
      code: 'RECTRON',
      name: 'Rectron',
      fn: syncRectronProducts as SyncFnWithFile as SyncFn,
      supports_dry_run: true,
      has_stock_data: false,
    },
  ]
}

// =====================================================
// Public API
// =====================================================

/**
 * Sync all active suppliers and return aggregate results.
 *
 * Each supplier runs independently -- one failure does not abort others.
 * Results are collected and returned as AggregateSyncResult.
 */
export async function syncAllSuppliers(
  options: OrchestratorOptions = {}
): Promise<AggregateSyncResult> {
  const startTime = Date.now()
  const registry = getSyncRegistry()
  const log = options.verbose
    ? console.log
    : (..._args: unknown[]) => {}

  // Determine which suppliers to sync
  const requestedCodes = options.suppliers
    ? options.suppliers.split(',').map((s) => s.trim().toUpperCase())
    : null

  // Fetch active suppliers from DB for status check
  const supabase = await createClient()
  const { data: activeSuppliers } = await supabase
    .from('suppliers')
    .select('code, name, is_active')
    .eq('is_active', true)

  const activeCodes = new Set(
    (activeSuppliers || []).map((s) => s.code.toUpperCase())
  )

  // Filter registry to requested + active suppliers
  const toSync = registry.filter((def) => {
    const code = def.code.toUpperCase()

    // Respect --supplier filter
    if (requestedCodes && !requestedCodes.includes(code)) {
      return false
    }

    // Respect is_active flag
    if (!activeCodes.has(code)) {
      log(`[Orchestrator] Skipping ${def.name}: inactive`)
      return false
    }

    return true
  })

  // Separate requested-but-inactive for reporting
  const skippedCodes = new Set<string>()
  if (requestedCodes) {
    for (const code of requestedCodes) {
      if (!activeCodes.has(code)) {
        skippedCodes.add(code)
      }
    }
  }

  const outcomes: SupplierSyncOutcome[] = []

  // Add skipped suppliers to outcomes
  for (const code of skippedCodes) {
    const def = registry.find((d) => d.code.toUpperCase() === code)
    outcomes.push({
      supplier_code: code,
      supplier_name: def?.name || code,
      success: true,
      skipped: 'Supplier is inactive',
    })
  }

  // Also add requested-but-not-in-registry
  if (requestedCodes) {
    for (const code of requestedCodes) {
      if (
        !registry.some((d) => d.code.toUpperCase() === code) &&
        !skippedCodes.has(code)
      ) {
        outcomes.push({
          supplier_code: code,
          supplier_name: code,
          success: false,
          error: `Unknown supplier code: ${code}`,
        })
      }
    }
  }

  if (toSync.length === 0) {
    return buildResult(outcomes, startTime)
  }

  log(
    `[Orchestrator] Syncing ${toSync.length} supplier(s): ` +
      toSync.map((s) => s.code).join(', ') +
      (options.dry_run ? ' (DRY RUN)' : '')
  )

  // Run syncs
  if (options.parallel) {
    // Parallel: all suppliers run concurrently
    const promises = toSync.map((def) =>
      runSync(def, options, log)
    )
    const results = await Promise.allSettled(promises)
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        outcomes.push(r.value)
      } else {
        // This shouldn't happen as runSync catches errors internally,
        // but handle it defensively
        outcomes.push({
          supplier_code: 'UNKNOWN',
          supplier_name: 'Unknown',
          success: false,
          error: r.reason?.message || 'Unexpected parallel sync failure',
        })
      }
    })
  } else {
    // Sequential: run one at a time
    for (const def of toSync) {
      const outcome = await runSync(def, options, log)
      outcomes.push(outcome)
    }
  }

  log('[Orchestrator] All syncs complete')

  return buildResult(outcomes, startTime)
}

/**
 * Sync only suppliers that provide stock data (Scoop, Nology, MiRO).
 * Useful for high-frequency stock refreshes where Rectron (no stock) can be skipped.
 */
export async function syncStockOnly(
  options: OrchestratorOptions = {}
): Promise<AggregateSyncResult> {
  return syncAllSuppliers({
    ...options,
    suppliers: getSyncRegistry()
      .filter((d) => d.has_stock_data)
      .map((d) => d.code)
      .join(','),
  })
}

// =====================================================
// Internal Helpers
// =====================================================

async function runSync(
  def: SupplierSyncDef,
  options: OrchestratorOptions,
  log: (...args: unknown[]) => void
): Promise<SupplierSyncOutcome> {
  log(`[Orchestrator] Starting ${def.name}...`)
  const syncStart = Date.now()

  try {
    const result = await def.fn({
      triggered_by: options.triggered_by || 'manual',
      triggered_by_user_id: options.triggered_by_user_id,
      dry_run: def.supports_dry_run ? options.dry_run : false,
    })

    const elapsed = Date.now() - syncStart
    log(
      `[Orchestrator] ${def.name}: ` +
        `created=${result.stats.products_created} ` +
        `updated=${result.stats.products_updated} ` +
        `unchanged=${result.stats.products_unchanged} ` +
        `deactivated=${result.stats.products_deactivated} ` +
        `(${elapsed}ms)`
    )

    // Post-sync hooks (not in dry-run mode)
    if (!options.dry_run && result.success) {
      try {
        const costAlerts = await syncHardwareCosts(def.code)
        if (costAlerts.length > 0) {
          log(
            `[Orchestrator] ${def.name}: ${costAlerts.length} products have cost changes >5%`
          )
        }
      } catch (err) {
        log(`[Orchestrator] ${def.name}: cost sync warning — ${err}`)
      }

      try {
        const termAlerts = await detectSupplierTermChanges(def.code)
        if (termAlerts.length > 0) {
          log(
            `[Orchestrator] ${def.name}: ${termAlerts.length} products have term changes`
          )
        }
      } catch (err) {
        log(`[Orchestrator] ${def.name}: term detection warning — ${err}`)
      }
    }

    return {
      supplier_code: def.code,
      supplier_name: def.name,
      success: result.success,
      result,
    }
  } catch (error) {
    const elapsed = Date.now() - syncStart
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error'
    log(`[Orchestrator] ${def.name} FAILED (${elapsed}ms): ${errorMsg}`)

    return {
      supplier_code: def.code,
      supplier_name: def.name,
      success: false,
      error: errorMsg,
    }
  }
}

function buildResult(
  outcomes: SupplierSyncOutcome[],
  startTime: number
): AggregateSyncResult {
  let suppliersSynced = 0
  let suppliersFailed = 0
  let suppliersSkipped = 0

  const totals = {
    products_found: 0,
    products_created: 0,
    products_updated: 0,
    products_unchanged: 0,
    products_deactivated: 0,
    images_cached: 0,
    duration_ms: Date.now() - startTime,
  }

  for (const outcome of outcomes) {
    if (outcome.skipped) {
      suppliersSkipped++
      continue
    }

    if (outcome.success) {
      suppliersSynced++
      if (outcome.result) {
        totals.products_found += outcome.result.stats.products_found
        totals.products_created += outcome.result.stats.products_created
        totals.products_updated += outcome.result.stats.products_updated
        totals.products_unchanged += outcome.result.stats.products_unchanged
        totals.products_deactivated +=
          outcome.result.stats.products_deactivated
        totals.images_cached += outcome.result.stats.images_cached
      }
    } else {
      suppliersFailed++
    }
  }

  return {
    success: suppliersFailed === 0,
    suppliers_synced: suppliersSynced,
    suppliers_failed: suppliersFailed,
    suppliers_skipped: suppliersSkipped,
    totals,
    suppliers: outcomes,
  }
}
