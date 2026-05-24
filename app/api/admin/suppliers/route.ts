/**
 * Admin Suppliers API
 *
 * GET /api/admin/suppliers — list suppliers with product counts
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('suppliers')
      .select(
        `
        id,
        code,
        name,
        website_url,
        feed_type,
        is_active,
        sync_status,
        last_synced_at,
        sync_error
      `
      )
      .order('name')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Get product counts per supplier
    const { data: productCounts } = await supabase
      .from('supplier_products')
      .select('supplier_id, is_active, in_stock')

    const countMap: Record<
      string,
      { total: number; active: number; inStock: number }
    > = {}
    for (const p of productCounts || []) {
      if (!countMap[p.supplier_id]) {
        countMap[p.supplier_id] = { total: 0, active: 0, inStock: 0 }
      }
      countMap[p.supplier_id].total++
      if (p.is_active) countMap[p.supplier_id].active++
      if (p.in_stock) countMap[p.supplier_id].inStock++
    }

    const suppliers = (data || []).map((s) => ({
      ...s,
      products_total: countMap[s.id]?.total || 0,
      products_active: countMap[s.id]?.active || 0,
      products_in_stock: countMap[s.id]?.inStock || 0,
    }))

    return NextResponse.json({ data: suppliers })
  } catch (error) {
    console.error('[Admin Suppliers API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
