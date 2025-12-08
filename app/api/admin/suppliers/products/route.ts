/**
 * Admin Supplier Products API Route
 * GET /api/admin/suppliers/products - List all supplier products with filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedImageUrl } from '@/lib/suppliers/image-cache'

export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * GET - List supplier products with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '25')
    const supplierId = searchParams.get('supplier_id')
    const manufacturer = searchParams.get('manufacturer')
    const category = searchParams.get('category')
    const inStock = searchParams.get('in_stock')
    const isActive = searchParams.get('is_active')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by') || 'name_asc'

    // Build query
    let query = supabase
      .from('supplier_products')
      .select(`
        *,
        supplier:suppliers(id, name, code)
      `, { count: 'exact' })

    // Apply filters
    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    }

    if (manufacturer) {
      query = query.eq('manufacturer', manufacturer)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (inStock !== null && inStock !== undefined) {
      query = query.eq('in_stock', inStock === 'true')
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (minPrice) {
      query = query.gte('cost_price', parseFloat(minPrice))
    }

    if (maxPrice) {
      query = query.lte('cost_price', parseFloat(maxPrice))
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%,manufacturer.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sortBy) {
      case 'name_asc':
        query = query.order('name', { ascending: true })
        break
      case 'name_desc':
        query = query.order('name', { ascending: false })
        break
      case 'price_asc':
        query = query.order('cost_price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('cost_price', { ascending: false })
        break
      case 'stock_desc':
        query = query.order('stock_total', { ascending: false })
        break
      case 'updated_desc':
        query = query.order('updated_at', { ascending: false })
        break
      case 'sku_asc':
        query = query.order('sku', { ascending: true })
        break
      default:
        query = query.order('name', { ascending: true })
    }

    // Apply pagination
    const start = (page - 1) * perPage
    const end = start + perPage - 1
    query = query.range(start, end)

    const { data: products, error, count } = await query

    if (error) {
      console.error('[Supplier Products API] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      )
    }

    // Add cached image URLs
    const productsWithUrls = (products || []).map(product => ({
      ...product,
      image_url: getCachedImageUrl(product.cached_image_path) || product.source_image_url,
    }))

    const totalPages = Math.ceil((count || 0) / perPage)

    return NextResponse.json({
      success: true,
      data: productsWithUrls,
      pagination: {
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: totalPages,
        has_more: page < totalPages,
      },
    })
  } catch (error) {
    console.error('[Supplier Products API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get unique manufacturers for filter dropdown
 */
export async function OPTIONS(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplier_id')

    // Get unique manufacturers
    let manufacturersQuery = supabase
      .from('supplier_products')
      .select('manufacturer')
      .eq('is_active', true)
      .not('manufacturer', 'is', null)

    if (supplierId) {
      manufacturersQuery = manufacturersQuery.eq('supplier_id', supplierId)
    }

    const { data: manufacturerRows } = await manufacturersQuery

    const manufacturers = [...new Set(manufacturerRows?.map(r => r.manufacturer).filter(Boolean))]

    // Get unique categories
    let categoriesQuery = supabase
      .from('supplier_products')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)

    if (supplierId) {
      categoriesQuery = categoriesQuery.eq('supplier_id', supplierId)
    }

    const { data: categoryRows } = await categoriesQuery

    const categories = [...new Set(categoryRows?.map(r => r.category).filter(Boolean))]

    return NextResponse.json({
      success: true,
      data: {
        manufacturers: manufacturers.sort(),
        categories: categories.sort(),
      },
    })
  } catch (error) {
    console.error('[Supplier Products API] Options error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
