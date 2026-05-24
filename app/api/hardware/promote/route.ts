/**
 * Promote API — Promote supplier product to CircleTel catalogue
 *
 * POST /api/hardware/promote
 * Body: { supplier_product_id, name?, slug, retail_price?, category?, default_markup_percent? }
 */

import { NextResponse } from 'next/server'
import { promoteFromSupplier } from '@/lib/hardware-catalogue/queries'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.supplier_product_id || !body.slug) {
      return NextResponse.json(
        { error: 'supplier_product_id and slug are required' },
        { status: 400 }
      )
    }

    const result = await promoteFromSupplier({
      supplier_product_id: body.supplier_product_id,
      slug: body.slug,
      name: body.name,
      description: body.description,
      retail_price: body.retail_price,
      category: body.category,
      is_featured: body.is_featured,
      default_markup_percent: body.default_markup_percent,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[Promote API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to promote product' },
      { status: 500 }
    )
  }
}
