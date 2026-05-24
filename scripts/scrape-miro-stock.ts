/**
 * MiRO Stock Scraper
 *
 * Scrapes per-branch stock counts from MiRO product pages.
 *
 * HOW IT WORKS:
 * 1. Reads product URLs from supplier_products (MIRO) in Supabase
 * 2. Fetches each product page
 * 3. Extracts stock counts from the #store_content div:
 *    <div id="store_content">...JHB: 1,...CPT: 6,...DBN: 2...</div>
 * 4. Updates supplier_products.stock_cpt/stock_jhb/stock_dbn/stock_total
 *
 * USAGE:
 *   npx tsx scripts/scrape-miro-stock.ts
 *   npx tsx scripts/scrape-miro-stock.ts --limit 100     (batch mode)
 *   npx tsx scripts/scrape-miro-stock.ts --dry-run         (no DB writes)
 *   npx tsx scripts/scrape-miro-stock.ts --concurrency 3   (parallelism)
 *
 * NOTE: Must be run from a machine that can resolve miro.co.za.
 */

import { config } from 'dotenv'
config({ path: '.env.production.local' })

import { createClient } from '@supabase/supabase-js'

// =====================================================
// Config
// =====================================================

const MIRO_CODE = 'MIRO'
const BASE_DELAY_MS = 500 // ms between requests
const DEFAULT_CONCURRENCY = 2
const DEFAULT_LIMIT = 0 // 0 = all products
const REQUEST_TIMEOUT_MS = 15000

// =====================================================
// Types
// =====================================================

interface ProductWithUrl {
  id: string
  sku: string
  name: string
  product_url: string
}

interface StockResult {
  sku: string
  jhb: number
  cpt: number
  dbn: number
  total: number
  error?: string
}

// =====================================================
// Main
// =====================================================

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limit = parseInt(
    args.find((a) => a.startsWith('--limit'))?.split('=')[1] ||
      String(DEFAULT_LIMIT)
  )
  const concurrency = parseInt(
    args
      .find((a) => a.startsWith('--concurrency'))
      ?.split('=')[1] || String(DEFAULT_CONCURRENCY)
  )

  console.log('MiRO Stock Scraper')
  console.log('=================')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${limit || 'all'}`)
  console.log(`Concurrency: ${concurrency}`)
  console.log('')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get MIRO supplier ID
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('code', MIRO_CODE)
    .single()

  if (!supplier) {
    console.error('MiRO supplier not found in database')
    process.exit(1)
  }

  // Get products with URLs
  let query = supabase
    .from('supplier_products')
    .select('id, sku, name, product_url')
    .eq('supplier_id', supplier.id)
    .eq('is_active', true)
    .not('product_url', 'is', null)
    .neq('product_url', '')
    .order('name')

  if (limit > 0) {
    query = query.limit(limit)
  }

  const { data: products, error } = await query

  if (error) {
    console.error('Failed to fetch products:', error.message)
    process.exit(1)
  }

  if (!products || products.length === 0) {
    console.log('No MiRO products with URLs found.')
    process.exit(0)
  }

  console.log(`Found ${products.length} products with URLs\n`)

  const startTime = Date.now()
  const results: StockResult[] = []
  let completed = 0
  let errors = 0

  // Process in chunks for concurrency control
  const chunks = chunkArray(products as ProductWithUrl[], concurrency)

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (product) => {
        const result = await scrapeStock(product)
        completed++
        const pct = Math.round((completed / products.length) * 100)

        if (result.error) {
          errors++
          process.stdout.write(
            `\r[${pct}%] ${completed}/${products.length} — ${product.sku}: ✗ ${result.error}`
          )
        } else if (result.total > 0) {
          process.stdout.write(
            `\r[${pct}%] ${completed}/${products.length} — ${product.sku}: JHB=${result.jhb} CPT=${result.cpt} DBN=${result.dbn}`
          )
        } else {
          process.stdout.write(
            `\r[${pct}%] ${completed}/${products.length} — ${product.sku}: no stock`
          )
        }

        return result
      })
    )

    results.push(...chunkResults)

    // Delay between chunks
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await sleep(BASE_DELAY_MS * concurrency)
    }
  }

  const duration = Date.now() - startTime
  console.log(
    `\n\nCompleted in ${(duration / 1000).toFixed(1)}s`
  )
  console.log(
    `Products checked: ${completed} | With stock: ${results.filter((r) => r.total > 0).length} | Errors: ${errors}`
  )

  // Update database
  if (!dryRun) {
    console.log('\nUpdating database...')
    let updated = 0
    const batchSize = 50
    const withStock = results.filter((r) => r.total > 0 && !r.error)

    for (let i = 0; i < withStock.length; i += batchSize) {
      const batch = withStock.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (r) => {
          const { error: updateErr } = await supabase
            .from('supplier_products')
            .update({
              stock_cpt: r.cpt,
              stock_jhb: r.jhb,
              stock_dbn: r.dbn,
              stock_total: r.total,
            })
            .eq('sku', r.sku)
            .eq('supplier_id', supplier.id)

          if (updateErr) {
            console.error(`  Failed to update ${r.sku}:`, updateErr.message)
          } else {
            updated++
          }
        })
      )
    }

    // Set zero stock for products with no stock data
    const noStock = results.filter((r) => r.total === 0 && !r.error)
    for (let i = 0; i < noStock.length; i += batchSize) {
      const batch = noStock.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (r) => {
          await supabase
            .from('supplier_products')
            .update({
              stock_cpt: 0,
              stock_jhb: 0,
              stock_dbn: 0,
              stock_total: 0,
            })
            .eq('sku', r.sku)
            .eq('supplier_id', supplier.id)
        })
      )
    }

    console.log(`Updated ${updated} products in database`)
  }

  // Summary
  const totalStock = results.reduce((s, r) => s + r.total, 0)
  console.log(`\nTotal stock across all products: ${totalStock} units`)
  console.log(
    `JHB: ${results.reduce((s, r) => s + r.jhb, 0)} | CPT: ${results.reduce((s, r) => s + r.cpt, 0)} | DBN: ${results.reduce((s, r) => s + r.dbn, 0)}`
  )
}

// =====================================================
// Stock Scraping
// =====================================================

async function scrapeStock(
  product: ProductWithUrl
): Promise<StockResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    )

    const response = await fetch(product.product_url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return {
        sku: product.sku,
        jhb: 0,
        cpt: 0,
        dbn: 0,
        total: 0,
        error: `HTTP ${response.status}`,
      }
    }

    const html = await response.text()

    // Extract the store_content div
    // Pattern: <div id="store_content"...>...JHB: N,...CPT: N,...DBN: N...</div>
    const storeMatch = html.match(
      /<div[^>]*id="store_content"[^>]*>([\s\S]*?)<\/div>\s*(?:<|$)/
    )

    if (!storeMatch) {
      // No stock div — product might not have stock tracking
      return {
        sku: product.sku,
        jhb: 0,
        cpt: 0,
        dbn: 0,
        total: 0,
      }
    }

    const storeHtml = storeMatch[1]

    // Parse branch counts
    const jhb = extractStock(storeHtml, 'JHB')
    const cpt = extractStock(storeHtml, 'CPT')
    const dbn = extractStock(storeHtml, 'DBN')
    const total = jhb + cpt + dbn

    return { sku: product.sku, jhb, cpt, dbn, total }
  } catch (error) {
    return {
      sku: product.sku,
      jhb: 0,
      cpt: 0,
      dbn: 0,
      total: 0,
      error:
        error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Extract stock count for a branch from the store_content HTML.
 * Pattern: JHB: 6, or CPT: 2 or DBN: 1
 */
function extractStock(html: string, branch: string): number {
  const pattern = new RegExp(
    `${branch}:\\s*(\\d+)`,
    'i'
  )
  const match = html.match(pattern)
  return match ? parseInt(match[1], 10) : 0
}

// =====================================================
// Helpers
// =====================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
