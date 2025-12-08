/**
 * Admin Suppliers API Route
 * GET /api/admin/suppliers - List all suppliers with stats
 * POST /api/admin/suppliers - Create a new supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupplierInsert } from '@/lib/suppliers/types'

export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * GET - List all suppliers with aggregated stats
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get suppliers with product stats using the view
    const { data: suppliers, error } = await supabase
      .from('v_supplier_summary')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[Suppliers API] Error fetching suppliers:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch suppliers', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: suppliers || [],
      total: suppliers?.length || 0,
    })
  } catch (error) {
    console.error('[Suppliers API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Prepare insert data
    const insertData: SupplierInsert = {
      name: body.name,
      code: body.code.toUpperCase(),
      website_url: body.website_url || null,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      account_number: body.account_number || null,
      payment_terms: body.payment_terms || null,
      feed_url: body.feed_url || null,
      feed_type: body.feed_type || 'manual',
      is_active: body.is_active ?? true,
      notes: body.notes || null,
    }

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[Suppliers API] Error creating supplier:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'A supplier with this code already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create supplier', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('[Suppliers API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
