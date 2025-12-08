/**
 * Admin Supplier Product Detail API Route
 * GET /api/admin/suppliers/products/[id] - Get single product with supplier details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedImageUrl } from '@/lib/suppliers/image-cache'

export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * GET - Fetch single supplier product with supplier details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Query product with supplier join
    const { data: product, error } = await supabase
      .from('supplier_products')
      .select(`
        *,
        supplier:suppliers(id, name, code, website_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('[Product Detail API] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product', details: error.message },
        { status: 500 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate margin if both prices are available
    const marginAmount = (product.retail_price && product.cost_price)
      ? product.retail_price - product.cost_price
      : null
    const marginPercentage = (marginAmount !== null && product.cost_price)
      ? (marginAmount / product.cost_price) * 100
      : null

    // Resolve image URL (prefer cached, fallback to source)
    const imageUrl = getCachedImageUrl(product.cached_image_path) || product.source_image_url

    // Build response with computed fields
    const responseData = {
      ...product,
      image_url: imageUrl,
      margin_amount: marginAmount,
      margin_percentage: marginPercentage !== null ? Math.round(marginPercentage * 10) / 10 : null,
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('[Product Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
