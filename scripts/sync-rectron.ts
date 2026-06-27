/**
 * Manual Rectron sync runner — for verification.
 *
 * Usage (loads .env.local for Supabase service-role creds):
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts          # dry run
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts --write  # real upsert
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-rectron.ts --all    # all suppliers (dry)
 */
import { downloadRectronPricelist } from '../lib/suppliers/rectron/rectron-downloader'

async function main() {
  const write = process.argv.includes('--write')
  const all = process.argv.includes('--all')

  if (all) {
    const { syncAllSuppliers } = await import('../lib/suppliers/sync-orchestrator')
    const res = await syncAllSuppliers({ dry_run: !write, verbose: true })
    console.log(JSON.stringify(res, null, 2))
    return
  }

  // Rectron only: prove the download works, then run the sync.
  const dl = await downloadRectronPricelist({
    watchDir: '/home/circletel/products/pricelist',
  })
  console.log(
    `Download: ${dl.filename} (downloaded=${dl.downloaded}) -> ${dl.filePath}`
  )

  const { syncRectronProducts } = await import('../lib/suppliers/rectron')
  const res = await syncRectronProducts({
    triggered_by: 'manual',
    dry_run: !write,
    download: false, // already downloaded above
  })
  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
