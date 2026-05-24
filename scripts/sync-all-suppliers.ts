/**
 * Sync All Suppliers — CLI Script
 *
 * Run with:
 *   npx tsx scripts/sync-all-suppliers.ts
 *   npx tsx scripts/sync-all-suppliers.ts --dry-run
 *   npx tsx scripts/sync-all-suppliers.ts --supplier SCOOP,RECTRON
 *   npx tsx scripts/sync-all-suppliers.ts --stock-only
 *   npx tsx scripts/sync-all-suppliers.ts --verbose
 */

import { config } from 'dotenv'
config({ path: '.env.production.local' })

async function main() {
  const {
    syncAllSuppliers,
    syncStockOnly,
  } = await import('../lib/suppliers/sync-orchestrator')

  const args = process.argv.slice(2)
  const flags = parseArgs(args)

  console.log('Supplier Sync Orchestrator')
  console.log('==========================')
  console.log(
    `Mode: ${flags['dry-run'] ? 'DRY RUN' : 'LIVE'}` +
      (flags['stock-only'] ? ' (stock only)' : '') +
      (flags.supplier ? ` (suppliers: ${flags.supplier})` : ' (all active)')
  )
  console.log('')

  const startTime = Date.now()

  try {
    const result = flags['stock-only']
      ? await syncStockOnly({
          triggered_by: 'manual',
          dry_run: flags['dry-run'],
          suppliers: flags.supplier,
          verbose: flags.verbose,
        })
      : await syncAllSuppliers({
          triggered_by: 'manual',
          dry_run: flags['dry-run'],
          suppliers: flags.supplier,
          verbose: flags.verbose,
        })

    const totalDuration = Date.now() - startTime

    // Print per-supplier results
    console.log('=== PER-SUPPLIER RESULTS ===')
    for (const supplier of result.suppliers) {
      if (supplier.skipped) {
        console.log(
          `  ${supplier.supplier_name}: SKIPPED (${supplier.skipped})`
        )
        continue
      }

      const r = supplier.result
      if (supplier.success && r) {
        console.log(
          `  ${supplier.supplier_name}: OK — ` +
            `${r.stats.products_found} found, ` +
            `${r.stats.products_created} created, ` +
            `${r.stats.products_updated} updated, ` +
            `${r.stats.products_unchanged} unchanged, ` +
            `${r.stats.products_deactivated} deactivated ` +
            `(${r.duration_ms}ms)`
        )
      } else {
        console.log(
          `  ${supplier.supplier_name}: FAILED — ${supplier.error}`
        )
      }
    }

    // Print aggregate
    console.log('\n=== AGGREGATE ===')
    console.log(`  Suppliers synced:    ${result.suppliers_synced}`)
    console.log(`  Suppliers failed:    ${result.suppliers_failed}`)
    console.log(`  Suppliers skipped:   ${result.suppliers_skipped}`)
    console.log(`  Products found:      ${result.totals.products_found}`)
    console.log(`  Products created:    ${result.totals.products_created}`)
    console.log(`  Products updated:    ${result.totals.products_updated}`)
    console.log(
      `  Products unchanged:  ${result.totals.products_unchanged}`
    )
    console.log(
      `  Products deactivated: ${result.totals.products_deactivated}`
    )
    console.log(
      `  Total duration:      ${(totalDuration / 1000).toFixed(1)}s`
    )

    if (result.suppliers_failed > 0) {
      console.log('\n⚠️  Some suppliers failed. Check logs for details.')
      process.exitCode = 1
    }
  } catch (error) {
    console.error(
      'Fatal error:',
      error instanceof Error ? error.message : error
    )
    process.exit(1)
  }
}

function parseArgs(
  args: string[]
): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (
        next &&
        !next.startsWith('--') &&
        key !== 'dry-run' &&
        key !== 'verbose' &&
        key !== 'stock-only'
      ) {
        flags[key] = next
        i++
      } else {
        flags[key] = true
      }
    }
  }
  return flags
}

main()
