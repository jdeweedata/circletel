/**
 * Supplier Products API — Browse for Promotion
 *
 * GET /api/hardware/supplier-products?search=router&suggested=1&limit=50
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluatePromoteSuggestion } from '@/lib/hardware-catalogue/promote-suggestion'

const SUGGESTED_CATEGORY_OR = [
  'category.ilike.%Access Point%',
  'category.ilike.%IP Camera%',
  'category.ilike.%CCTV%',
  'category.ilike.%Ethernet Switch%',
  'category.ilike.%UPS%',
  'category.ilike.%HDMI%',
  'category.ilike.%Networking Cable%',
  'category.ilike.%Cat5%',
  'category.ilike.%Cat6%',
  'category.ilike.%Cable: Power%',
  'category.ilike.%Network Router%',
  'category.ilike.%5G%',
  'name.ilike.%H155-386%',
  'name.ilike.%G5C%',
  'name.ilike.%G5B%',
  'name.ilike.%G5TS%',
].join(',')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const suggestedOnly = searchParams.get('suggested') === '1'
    const limit = parseInt(searchParams.get('limit') || '200', 10)

    const supabase = await createClient()

    const { data: links } = await supabase
      .from('hardware_product_suppliers')
      .select('supplier_product_id')
    const promotedIds = new Set(
      (links || []).map((row) => row.supplier_product_id)
    )

    let query = supabase
      .from('supplier_products')
      .select(
        `
        id,
        sku,
        name,
        manufacturer,
        category,
        cost_price,
        stock_total,
        supplier:suppliers (code, name)
      `
      )
      .eq('is_active', true)
      .order('name')
      .limit(Math.min(limit, 500))

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    } else if (suggestedOnly) {
      query = query.gt('stock_total', 0).or(SUGGESTED_CATEGORY_OR)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data || []).map((row) => {
      const suggestion = evaluatePromoteSuggestion({
        category: row.category,
        name: row.name,
        costExclVat: Number(row.cost_price) || 0,
        stockTotal: Number(row.stock_total) || 0,
        alreadyPromoted: promotedIds.has(row.id),
      })
      return { ...row, suggestion }
    })

    const filtered = suggestedOnly
      ? rows.filter((row) => row.suggestion.suggested)
      : rows

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('[Supplier Products API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier products' },
      { status: 500 }
    )
  }
}
