import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/partners/commissions
 *
 * Fetches commission transactions for the authenticated partner
 * Supports filtering by status and pagination
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
      .select('id, business_name, status, total_commission_earned, pending_commission, commission_rate, tier')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build transactions query
    let query = supabase
      .from('partner_commission_transactions')
      .select('*, coverage_leads(first_name, last_name, email)', { count: 'exact' })
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: transactions, error: transactionsError, count } = await query

    if (transactionsError) {
      console.error('Error fetching commissions:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch commissions' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const { data: summaryData, error: summaryError } = await supabase
      .from('partner_commission_transactions')
      .select('status, amount')
      .eq('partner_id', partner.id)

    let summary = {
      total_earned: partner.total_commission_earned || 0,
      pending_approval: 0,
      pending_payment: 0,
      total_transactions: count || 0,
    }

    if (!summaryError && summaryData) {
      summaryData.forEach((t: any) => {
        if (t.status === 'pending') {
          summary.pending_approval += parseFloat(t.amount)
        } else if (t.status === 'approved') {
          summary.pending_payment += parseFloat(t.amount)
        }
      })
    }

    return NextResponse.json({
      success: true,
      partner: {
        business_name: partner.business_name,
        commission_rate: partner.commission_rate,
        tier: partner.tier,
      },
      summary,
      transactions: transactions || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in commissions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
