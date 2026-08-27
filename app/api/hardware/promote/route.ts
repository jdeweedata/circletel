/**
 * Promote API — Promote supplier product to CircleTel catalogue
 *
 * POST /api/hardware/promote
 * Body: supplier_product_id, slug, Shop Benchmark fields, confirm_unbenchmarked
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
      category: body.category,
      is_featured: body.is_featured,
      afrihost_url: body.afrihost_url,
      afrihost_price:
        body.afrihost_price != null ? Number(body.afrihost_price) : undefined,
      axxess_url: body.axxess_url,
      axxess_price:
        body.axxess_price != null ? Number(body.axxess_price) : undefined,
      street_note: body.street_note,
      confirm_unbenchmarked: Boolean(body.confirm_unbenchmarked),
      lead_time_min_days:
        body.lead_time_min_days != null
          ? Number(body.lead_time_min_days)
          : undefined,
      lead_time_max_days:
        body.lead_time_max_days != null
          ? Number(body.lead_time_max_days)
          : undefined,
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
