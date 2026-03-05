/**
 * Supplier Product Sync Inngest Function
 *
 * Syncs product catalogs from hardware suppliers (MiRO, Nology) with:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron and manual event
 * - Progress tracking via supplier_sync_logs table
 * - Cancellation support
 *
 * Schedule: Daily at 2am SAST (midnight UTC)
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { syncMiRoProducts } from '@/lib/suppliers/miro'
import { syncNologyProducts } from '@/lib/suppliers/nology'
import { syncScoopProducts } from '@/lib/suppliers/scoop-sync'
import type { SyncResult } from '@/lib/suppliers/types'

// =============================================================================
// SUPPLIER SYNC FUNCTION
// =============================================================================

/**
 * Main supplier sync function.
 * Triggered by:
 * - Cron schedule: Daily at 2am SAST (midnight UTC)
 * - Event: 'supplier/sync.requested' for manual triggers
 */
export const supplierSyncFunction = inngest.createFunction(
  {
    id: 'supplier-sync',
    name: 'Supplier Product Sync',
    retries: 3,
    cancelOn: [
      {
        event: 'supplier/sync.cancelled',
        match: 'data.sync_log_id',
      },
    ],
  },
  [
    // Cron trigger: 2am SAST = midnight UTC
    { cron: '0 0 * * *' },
    // Event trigger: manual requests
    { event: 'supplier/sync.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data
    const eventData = event?.data as {
      sync_log_id?: string
      supplier_code?: string // 'MIRO', 'NOLOGY', 'SCOOP', or 'ALL'
      triggered_by?: 'cron' | 'manual'
      admin_user_id?: string
      options?: {
        dryRun?: boolean
      }
    } | undefined

    const supplierCode = eventData?.supplier_code || 'ALL'
    const triggeredBy = eventData?.triggered_by ?? 'cron'
    const adminUserId = eventData?.admin_user_id
    const dryRun = eventData?.options?.dryRun ?? false

    const startTime = Date.now()
    const results: Record<string, SyncResult> = {}
    const errors: string[] = []

    // Step 1: Determine which suppliers to sync
    const suppliersToSync = await step.run('determine-suppliers', async () => {
      const supabase = await createClient()

      if (supplierCode === 'ALL') {
        // Get all active HTML-scrape suppliers
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('code')
          .eq('is_active', true)
          .in('feed_type', ['html', 'xml'])

        return (suppliers || []).map((s) => s.code)
      }

      return [supplierCode]
    })

    console.log(`[SupplierSync] Syncing suppliers: ${suppliersToSync.join(', ')}`)

    // Step 2: Sync MiRO (if requested)
    if (suppliersToSync.includes('MIRO')) {
      const miroResult = await step.run('sync-miro-products', async () => {
        console.log('[SupplierSync] Starting MiRO sync...')
        try {
          return await syncMiRoProducts({
            triggered_by: triggeredBy === 'cron' ? 'scheduled' : 'manual',
            triggered_by_user_id: adminUserId,
            dry_run: dryRun,
          })
        } catch (error) {
          const errorMsg = `MiRO sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(`[SupplierSync] ${errorMsg}`)
          return {
            success: false,
            supplier_id: '',
            log_id: '',
            stats: {
              products_found: 0,
              products_created: 0,
              products_updated: 0,
              products_unchanged: 0,
              products_deactivated: 0,
              images_cached: 0,
            },
            duration_ms: 0,
            error: errorMsg,
          }
        }
      })

      results.MIRO = miroResult
      if (!miroResult.success) {
        errors.push(`MIRO: ${miroResult.error}`)
      }

      // Add delay between suppliers
      if (suppliersToSync.length > 1) {
        await step.sleep('wait-after-miro', '5s')
      }
    }

    // Step 3: Sync Nology (if requested)
    if (suppliersToSync.includes('NOLOGY')) {
      const nologyResult = await step.run('sync-nology-products', async () => {
        console.log('[SupplierSync] Starting Nology sync...')
        try {
          return await syncNologyProducts({
            triggered_by: triggeredBy === 'cron' ? 'scheduled' : 'manual',
            triggered_by_user_id: adminUserId,
            dry_run: dryRun,
          })
        } catch (error) {
          const errorMsg = `Nology sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(`[SupplierSync] ${errorMsg}`)
          return {
            success: false,
            supplier_id: '',
            log_id: '',
            stats: {
              products_found: 0,
              products_created: 0,
              products_updated: 0,
              products_unchanged: 0,
              products_deactivated: 0,
              images_cached: 0,
            },
            duration_ms: 0,
            error: errorMsg,
          }
        }
      })

      results.NOLOGY = nologyResult
      if (!nologyResult.success) {
        errors.push(`NOLOGY: ${nologyResult.error}`)
      }

      // Add delay between suppliers
      if (suppliersToSync.includes('SCOOP')) {
        await step.sleep('wait-after-nology', '5s')
      }
    }

    // Step 4: Sync Scoop (if requested)
    if (suppliersToSync.includes('SCOOP')) {
      const scoopResult = await step.run('sync-scoop-products', async () => {
        console.log('[SupplierSync] Starting Scoop sync...')
        try {
          return await syncScoopProducts({
            triggered_by: triggeredBy === 'cron' ? 'scheduled' : 'manual',
            triggered_by_user_id: adminUserId,
          })
        } catch (error) {
          const errorMsg = `Scoop sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(`[SupplierSync] ${errorMsg}`)
          return {
            success: false,
            supplier_id: '',
            log_id: '',
            stats: {
              products_found: 0,
              products_created: 0,
              products_updated: 0,
              products_unchanged: 0,
              products_deactivated: 0,
              images_cached: 0,
            },
            duration_ms: 0,
            error: errorMsg,
          }
        }
      })

      results.SCOOP = scoopResult
      if (!scoopResult.success) {
        errors.push(`SCOOP: ${scoopResult.error}`)
      }
    }

    // Step 5: Calculate totals and send completion event
    const totals = await step.run('calculate-totals', async () => {
      let totalProducts = 0
      let totalCreated = 0
      let totalUpdated = 0
      let totalUnchanged = 0
      let totalDeactivated = 0

      for (const result of Object.values(results)) {
        if (result.success) {
          totalProducts += result.stats.products_found
          totalCreated += result.stats.products_created
          totalUpdated += result.stats.products_updated
          totalUnchanged += result.stats.products_unchanged
          totalDeactivated += result.stats.products_deactivated
        }
      }

      return {
        totalProducts,
        totalCreated,
        totalUpdated,
        totalUnchanged,
        totalDeactivated,
        suppliers_synced: suppliersToSync.length,
        suppliers_failed: errors.length,
      }
    })

    // Step 6: PiPaperPlaneRightBold completion event
    await step.run('send-completion-event', async () => {
      const hasErrors = errors.length > 0
      const eventName = hasErrors ? 'supplier/sync.completed_with_errors' : 'supplier/sync.completed'

      await inngest.send({
        name: eventName,
        data: {
          suppliers_synced: suppliersToSync,
          results: Object.fromEntries(
            Object.entries(results).map(([code, result]) => [
              code,
              {
                success: result.success,
                log_id: result.log_id,
                products_found: result.stats.products_found,
                products_created: result.stats.products_created,
                products_updated: result.stats.products_updated,
                error: result.error,
              },
            ])
          ),
          totals,
          errors: hasErrors ? errors : undefined,
          duration_ms: Date.now() - startTime,
          dry_run: dryRun,
        },
      })
    })

    const totalDuration = Date.now() - startTime
    const hasErrors = errors.length > 0

    console.log(
      `[SupplierSync] Complete: ${totals.totalProducts} products found, ` +
        `${totals.totalCreated} created, ${totals.totalUpdated} updated ` +
        `(${totalDuration}ms, ${errors.length} errors)`
    )

    return {
      success: !hasErrors,
      suppliers_synced: suppliersToSync,
      totals,
      errors: hasErrors ? errors : undefined,
      duration_ms: totalDuration,
      dry_run: dryRun,
    }
  }
)

// =============================================================================
// SYNC COMPLETION HANDLER
// =============================================================================

/**
 * Handle supplier sync completion events.
 * Can be extended to send notifications, trigger downstream processes, etc.
 */
export const supplierSyncCompletedFunction = inngest.createFunction(
  {
    id: 'supplier-sync-completed',
    name: 'Supplier Sync Completed Handler',
  },
  [
    { event: 'supplier/sync.completed' },
    { event: 'supplier/sync.completed_with_errors' },
  ],
  async ({ event, step }) => {
    const { suppliers_synced, totals, errors, duration_ms, dry_run } = event.data as {
      suppliers_synced: string[]
      totals: {
        totalProducts: number
        totalCreated: number
        totalUpdated: number
        totalUnchanged: number
        totalDeactivated: number
        suppliers_synced: number
        suppliers_failed: number
      }
      errors?: string[]
      duration_ms: number
      dry_run: boolean
    }

    await step.run('log-completion', async () => {
      const status = errors?.length ? 'with errors' : 'successfully'
      console.log(
        `[SupplierSync] Sync completed ${status}: ` +
          `${suppliers_synced.join(', ')} - ` +
          `${totals.totalProducts} products, ${totals.totalCreated} new, ` +
          `${totals.totalUpdated} updated (${duration_ms}ms)` +
          (dry_run ? ' [DRY RUN]' : '')
      )

      if (errors?.length) {
        console.error('[SupplierSync] Errors:', errors.join('; '))
      }

      // TODO: PiPaperPlaneRightBold Slack notification for daily sync summary
      // TODO: PiPaperPlaneRightBold alert if sync fails
      // TODO: Update dashboard metrics
    })

    return { logged: true }
  }
)

// =============================================================================
// SYNC FAILED HANDLER
// =============================================================================

/**
 * Handle supplier sync failure events.
 * Sends alerts and logs on failure.
 */
export const supplierSyncFailedFunction = inngest.createFunction(
  {
    id: 'supplier-sync-failed',
    name: 'Supplier Sync Failed Handler',
  },
  { event: 'supplier/sync.failed' },
  async ({ event, step }) => {
    const { supplier_code, error, attempt } = event.data as {
      supplier_code: string
      error: string
      attempt: number
    }

    await step.run('handle-failure', async () => {
      console.error(
        `[SupplierSync] Sync failed for ${supplier_code} (attempt ${attempt}): ${error}`
      )

      // TODO: PiPaperPlaneRightBold alert notification
      // TODO: Log to error tracking service (Sentry, etc.)
    })

    return { handled: true }
  }
)
