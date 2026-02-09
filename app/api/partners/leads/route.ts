import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger } from '@/lib/logging/logger'

/**
 * GET /api/partners/leads
 *
 * Fetches leads assigned to the authenticated partner
 * Supports filtering, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get current user's partner ID
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get partner record
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, business_name, status')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Check if partner is approved
    if (partner.status !== 'approved') {
      return NextResponse.json(
        { error: 'Partner not approved yet' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('coverage_leads')
      .select('*', { count: 'exact' })
      .eq('assigned_partner_id', partner.id)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter (name, email, phone, or address)
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`
      )
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: leads, error: leadsError, count } = await query

    if (leadsError) {
      apiLogger.error('Error fetching leads', { error: leadsError });
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      leads: leads || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    apiLogger.error('Error in partners leads API', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

