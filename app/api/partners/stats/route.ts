import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger } from '@/lib/logging/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the partner record
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, total_leads, converted_leads, pending_commission, status, business_name, tier')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner account not found' },
        { status: 404 }
      )
    }

    // Get count of active leads (leads with status in progress)
    const activeStatuses = ['new', 'contacted', 'interested', 'follow_up_scheduled']
    const { count: activeLeadsCount, error: activeLeadsError } = await supabase
      .from('coverage_leads')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_partner_id', partner.id)
      .in('status', activeStatuses)

    // Get count of converted leads this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const { count: convertedThisMonth, error: convertedError } = await supabase
      .from('coverage_leads')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_partner_id', partner.id)
      .eq('status', 'converted_to_order')
      .gte('updated_at', startOfMonth.toISOString())

    // Get pending commission from commission transactions
    const { data: pendingCommissions, error: commissionError } = await supabase
      .from('partner_commission_transactions')
      .select('amount')
      .eq('partner_id', partner.id)
      .in('status', ['pending', 'approved'])

    const pendingCommissionTotal = pendingCommissions?.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    ) || partner.pending_commission || 0

    const stats = {
      totalLeads: partner.total_leads || 0,
      activeLeads: activeLeadsCount || 0,
      convertedThisMonth: convertedThisMonth || 0,
      pendingCommission: pendingCommissionTotal,
      partnerStatus: partner.status,
      businessName: partner.business_name,
      tier: partner.tier,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    apiLogger.error('Error fetching partner stats', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partner stats' },
      { status: 500 }
    )
  }
}

