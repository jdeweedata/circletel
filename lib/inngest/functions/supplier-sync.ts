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
import { syncAllSuppliers } from '@/lib/suppliers/sync-orchestrator'

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
      supplier_code?: string // 'MIRO' | 'NOLOGY' | 'SCOOP' | 'RECTRON' | 'ALL'
      triggered_by?: 'cron' | 'manual'
      admin_user_id?: string
      options?: { dryRun?: boolean }
    } | undefined

    const supplierCode = eventData?.supplier_code || 'ALL'
    const triggeredBy = eventData?.triggered_by ?? 'cron'
    const adminUserId = eventData?.admin_user_id
    const dryRun = eventData?.options?.dryRun ?? false

    const startTime = Date.now()

    // Step 1: Run all (or one) suppliers via the registry-based orchestrator.
    // The orchestrator's registry includes MiRO/Nology/Scoop/Rectron and filters
    // by the suppliers' is_active flag. Rectron auto-downloads its file internally.
    const agg = await step.run('sync-all-suppliers', async () => {
      return await syncAllSuppliers({
        triggered_by: triggeredBy === 'cron' ? 'scheduled' : 'manual',
        triggered_by_user_id: adminUserId,
        dry_run: dryRun,
        suppliers: supplierCode === 'ALL' ? undefined : supplierCode,
      })
    })

    // Codes that actually ran (exclude inactive/skipped entries)
    const suppliersToSync = agg.suppliers
      .filter((o) => !o.skipped)
      .map((o) => o.supplier_code)

    const errors = agg.suppliers
      .filter((o) => !o.success && o.error)
      .map((o) => `${o.supplier_code}: ${o.error}`)

    // Map the orchestrator totals onto the legacy event shape the
    // completion handler already expects.
    const totals = {
      totalProducts: agg.totals.products_found,
      totalCreated: agg.totals.products_created,
      totalUpdated: agg.totals.products_updated,
      totalUnchanged: agg.totals.products_unchanged,
      totalDeactivated: agg.totals.products_deactivated,
      suppliers_synced: agg.suppliers_synced,
      suppliers_failed: agg.suppliers_failed,
    }

    console.log(
      `[SupplierSync] Syncing suppliers: ${suppliersToSync.join(', ') || '(none)'}`
    )

    // Step 2: Emit completion event (shape unchanged from before).
    await step.run('send-completion-event', async () => {
      const hasErrors = errors.length > 0
      const eventName = hasErrors
        ? 'supplier/sync.completed_with_errors'
        : 'supplier/sync.completed'

      await inngest.send({
        name: eventName,
        data: {
          suppliers_synced: suppliersToSync,
          results: Object.fromEntries(
            agg.suppliers
              .filter((o) => o.result)
              .map((o) => [
                o.supplier_code,
                {
                  success: o.success,
                  log_id: o.result!.log_id,
                  products_found: o.result!.stats.products_found,
                  products_created: o.result!.stats.products_created,
                  products_updated: o.result!.stats.products_updated,
                  error: o.error,
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
