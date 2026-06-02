/**
 * Migrate existing hardcoded products to Payload CMS using the Local API.
 * 
 * Reads products from lib/data/product-data.ts and creates them in Payload.
 * No auth required — Local API runs server-side within the Next.js process.
 * 
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrate-products-to-payload.ts [--dry-run]
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  // Import payload and config
  const { getPayload } = await import('payload')
  const payloadConfig = (await import('@payload-config')).default
  
  // Import hardcoded products
  const { products } = await import('../lib/data/product-data')

  console.log(`Found ${products.length} hardcoded products`)
  if (dryRun) console.log('[DRY RUN] No data will be written\n')

  const payload = await getPayload({ config: payloadConfig })

  // Check existing products
  const { totalDocs: existing } = await payload.find({
    collection: 'products',
    limit: 0,
  })
  console.log(`Existing Payload products: ${existing}`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const product of products) {
    // Check if already exists by slug
    const { docs } = await payload.find({
      collection: 'products',
      where: { slug: { equals: product.slug } },
      limit: 1,
    })

    if (docs.length > 0) {
      console.log(`  SKIP ${product.slug} — already exists`)
      skipped++
      continue
    }

    const payloadProduct: any = {
      name: product.name,
      slug: product.slug,
      category: mapCategory(product.category),
      tagline: product.tagline || '',
      pricing: {
        startingPrice: product.pricing?.startingPrice || 0,
        priceNote: product.pricing?.priceNote || 'per month',
        showContactForPricing: product.pricing?.showContactForPricing || false,
      },
      keyFeatures: (product.keyFeatures || []).map((f: any) => ({
        title: f.title,
        description: f.description || '',
        icon: f.icon || 'speed',
      })),
      specifications: (product.specifications || []).map((s: any) => ({
        label: s.label,
        value: s.value,
      })),
      status: 'draft',
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would create: ${product.slug} (${product.name})`)
      created++
      continue
    }

    try {
      const doc = await payload.create({
        collection: 'products',
        data: payloadProduct,
      })
      console.log(`  CREATED ${product.slug} (ID: ${doc.id})`)
      created++
    } catch (e: any) {
      console.error(`  ERROR ${product.slug}: ${e.message}`)
      errors++
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`)
}

function mapCategory(category: string): string {
  const map: Record<string, string> = {
    business: 'business',
    home: 'home',
    wireless: 'wireless',
    hardware: 'hardware',
    enterprise: 'business',
  }
  return map[category] || 'home'
}

main().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})
