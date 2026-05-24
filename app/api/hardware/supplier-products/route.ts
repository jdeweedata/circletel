/**
 * Supplier Products API — Browse for Promotion
 *
 * GET /api/hardware/supplier-products?search=router&limit=50
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '200')

    const supabase = await createClient()

    let query = supabase
      .from('supplier_products')
      .select(
        `
        id,
        sku,
        name,
        manufacturer,
        cost_price,
        stock_total,
        supplier:suppliers (code, name)
      `
      )
      .eq('is_active', true)
      .order('name')
      .limit(Math.min(limit, 500))

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('[Supplier Products API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier products' },
      { status: 500 }
    )
  }
}
