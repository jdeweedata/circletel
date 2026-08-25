/**
 * Manual Rectron sync runner — for verification.
 *
 * Usage (loads .env.local for Supabase service-role creds):
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts          # dry run
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts --write  # real upsert
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts --all    # all suppliers (dry)
 */
import { existsSync } from 'fs'

async function main() {
  const write = process.argv.includes('--write')
  const all = process.argv.includes('--all')

  if (all) {
    const { syncAllSuppliers } = await import('../lib/suppliers/sync-orchestrator')
    const res = await syncAllSuppliers({ dry_run: !write, verbose: true })
    console.log(JSON.stringify(res, null, 2))
    return
  }

  const AUG11 =
    '/home/circletel/products/rectron/RECTRON_PRICE_LIST_20260811_0811.xlsm'
  const localAug11 = existsSync(AUG11) ? AUG11 : undefined
  if (localAug11) {
    console.log(`Using local 11 Aug 2026 price list: ${AUG11}`)
  }

  const { syncRectronProducts } = await import('../lib/suppliers/rectron')
  const res = await syncRectronProducts({
    triggered_by: 'manual',
    dry_run: !write,
    download: !localAug11,
    file_path: localAug11,
  })
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
