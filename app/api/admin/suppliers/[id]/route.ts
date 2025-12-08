/**
 * Admin Supplier Detail API Route
 * GET /api/admin/suppliers/[id] - Get supplier details
 * PUT /api/admin/suppliers/[id] - Update supplier
 * DELETE /api/admin/suppliers/[id] - Delete supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupplierUpdate } from '@/lib/suppliers/types'

export const runtime = 'nodejs'
export const maxDuration = 15

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET - Get supplier details with recent sync logs
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Get supplier details
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Supplier not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch supplier', details: error.message },
        { status: 500 }
      )
    }

    // Get recent sync logs
    const { data: syncLogs } = await supabase
      .from('supplier_sync_logs')
      .select('*')
      .eq('supplier_id', id)
      .order('started_at', { ascending: false })
      .limit(10)

    // Get product count stats
    const { count: totalProducts } = await supabase
      .from('supplier_products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)

    const { count: activeProducts } = await supabase
      .from('supplier_products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)
      .eq('is_active', true)

    const { count: inStockProducts } = await supabase
      .from('supplier_products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)
      .eq('in_stock', true)

    return NextResponse.json({
      success: true,
      data: {
        ...supplier,
        stats: {
          total_products: totalProducts || 0,
          active_products: activeProducts || 0,
          in_stock_products: inStockProducts || 0,
        },
        recent_sync_logs: syncLogs || [],
      },
    })
  } catch (error) {
    console.error('[Supplier Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update supplier
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const body = await request.json()

    // Prepare update data
    const updateData: SupplierUpdate = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.code !== undefined) updateData.code = body.code.toUpperCase()
    if (body.website_url !== undefined) updateData.website_url = body.website_url
    if (body.contact_email !== undefined) updateData.contact_email = body.contact_email
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone
    if (body.account_number !== undefined) updateData.account_number = body.account_number
    if (body.payment_terms !== undefined) updateData.payment_terms = body.payment_terms
    if (body.feed_url !== undefined) updateData.feed_url = body.feed_url
    if (body.feed_type !== undefined) updateData.feed_type = body.feed_type
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Supplier not found' },
          { status: 404 }
        )
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'A supplier with this code already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update supplier', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    })
  } catch (error) {
    console.error('[Supplier Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete supplier (soft delete by setting is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Check for force delete parameter
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'

    if (forceDelete) {
      // Hard delete - this will cascade delete products and logs
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete supplier', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Supplier permanently deleted',
      })
    } else {
      // Soft delete
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Supplier not found' },
            { status: 404 }
          )
        }
        return NextResponse.json(
          { success: false, error: 'Failed to deactivate supplier', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: supplier,
        message: 'Supplier deactivated successfully',
      })
    }
  } catch (error) {
    console.error('[Supplier Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
