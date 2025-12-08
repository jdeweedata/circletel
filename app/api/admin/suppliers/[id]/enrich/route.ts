/**
 * Admin Supplier Product Enrichment API Route
 * POST /api/admin/suppliers/[id]/enrich - Enrich products with AI
 * GET /api/admin/suppliers/[id]/enrich - Get enrichment status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findProductUrl, scrapeProductPage } from '@/lib/suppliers/product-scraper'
import {
  enrichProduct,
  batchEnrichProducts,
  estimateEnrichmentCost,
} from '@/lib/suppliers/ai-enrichment'
import type { SupplierProduct, EnrichmentRequest, EnrichmentResponse } from '@/lib/suppliers/types'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for batch operations

/**
 * POST - Trigger product enrichment for a supplier
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()

  try {
    const { id: supplierId } = await context.params
    const body = (await request.json()) as EnrichmentRequest
    const { mode = 'missing', product_ids, skip_scraping = false } = body

    const supabase = await createClient()

    // Validate supplier exists
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, name, code')
      .eq('id', supplierId)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Build query based on mode
    let query = supabase
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('is_active', true)

    if (mode === 'selected' && product_ids?.length) {
      query = query.in('id', product_ids)
    } else if (mode === 'missing') {
      // Only products without enrichment data
      query = query.or('specifications.eq.{},features.eq.[]')
    }

    const { data: products, error: productsError } = await query.limit(100)

    if (productsError) {
      console.error('[Enrichment API] Failed to fetch products:', productsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          urls_found: 0,
          scraped: 0,
          enriched: 0,
          failed: 0,
          duration_ms: Date.now() - startTime,
        },
      } as EnrichmentResponse)
    }

    console.log(
      `[Enrichment API] Processing ${products.length} products for supplier ${supplier.code}`
    )

    // Results tracking
    let urlsFound = 0
    let scraped = 0
    let enriched = 0
    let failed = 0

    // Process each product
    for (const product of products as SupplierProduct[]) {
      try {
        // Step 1: Find product URL if not already set
        let productUrl = product.product_url
        if (!productUrl && !skip_scraping) {
          const urlMatch = await findProductUrl(product.sku, product.name)
          if (urlMatch) {
            productUrl = urlMatch.product_url
            urlsFound++

            // Save URL to database
            await supabase
              .from('supplier_products')
              .update({ product_url: productUrl })
              .eq('id', product.id)
          }
        }

        // Step 2: Scrape product page
        let scrapedData = undefined
        if (productUrl && !skip_scraping) {
          const scrapeResult = await scrapeProductPage(productUrl)
          if (scrapeResult.success && scrapeResult.data) {
            scrapedData = scrapeResult.data
            scraped++

            // Save scraped data to metadata
            await supabase
              .from('supplier_products')
              .update({
                metadata: {
                  ...(product.metadata || {}),
                  scraped_data: {
                    title: scrapedData.title,
                    description: scrapedData.description,
                    raw_content: scrapedData.raw_content?.substring(0, 5000),
                    additional_images: scrapedData.additional_images,
                  },
                  scraped_at: scrapedData.scraped_at,
                  enrichment_status: 'scraped',
                },
              })
              .eq('id', product.id)
          }
        }

        // Step 3: AI Enrichment
        const enrichResult = await enrichProduct(product, scrapedData)

        if (enrichResult.success && enrichResult.data) {
          enriched++

          // Update product with enriched data
          await supabase
            .from('supplier_products')
            .update({
              specifications: enrichResult.data.specifications,
              features: enrichResult.data.features,
              category: enrichResult.data.category || product.category,
              subcategory: enrichResult.data.subcategory || product.subcategory,
              description: enrichResult.data.enhanced_description || product.description,
              metadata: {
                ...(product.metadata || {}),
                enrichment_status: 'enriched',
                enriched_at: new Date().toISOString(),
                enrichment_tokens: enrichResult.tokens_used,
              },
            })
            .eq('id', product.id)
        } else {
          failed++

          // Save error to metadata
          await supabase
            .from('supplier_products')
            .update({
              metadata: {
                ...(product.metadata || {}),
                enrichment_status: 'failed',
                enrichment_error: enrichResult.error,
              },
            })
            .eq('id', product.id)
        }
      } catch (error) {
        failed++
        console.error(`[Enrichment API] Failed to process ${product.sku}:`, error)
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[Enrichment API] Completed: ${enriched} enriched, ${failed} failed, ${duration}ms`
    )

    return NextResponse.json({
      success: true,
      data: {
        total: products.length,
        urls_found: urlsFound,
        scraped,
        enriched,
        failed,
        duration_ms: duration,
      },
    } as EnrichmentResponse)
  } catch (error) {
    console.error('[Enrichment API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Get enrichment status and cost estimate
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await context.params
    const supabase = await createClient()

    // Get supplier products stats
    const { data: stats, error: statsError } = await supabase
      .from('supplier_products')
      .select('id, specifications, features, metadata')
      .eq('supplier_id', supplierId)
      .eq('is_active', true)

    if (statsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product stats' },
        { status: 500 }
      )
    }

    const products = stats || []
    const total = products.length

    // Count products by enrichment status
    let enriched = 0
    let scraped = 0
    let pending = 0
    let failed = 0

    for (const product of products) {
      const hasSpecs =
        product.specifications &&
        typeof product.specifications === 'object' &&
        Object.keys(product.specifications).length > 0

      const hasFeatures =
        Array.isArray(product.features) && product.features.length > 0

      const metadata = product.metadata as Record<string, unknown> || {}
      const status = metadata.enrichment_status

      if (hasSpecs || hasFeatures || status === 'enriched') {
        enriched++
      } else if (status === 'scraped') {
        scraped++
      } else if (status === 'failed') {
        failed++
      } else {
        pending++
      }
    }

    // Estimate cost for pending products
    const costEstimate = estimateEnrichmentCost(pending)

    return NextResponse.json({
      success: true,
      data: {
        total,
        enriched,
        scraped,
        pending,
        failed,
        cost_estimate: costEstimate,
      },
    })
  } catch (error) {
    console.error('[Enrichment API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
