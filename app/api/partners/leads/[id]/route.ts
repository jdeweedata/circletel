import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger } from '@/lib/logging'

/**
 * GET /api/partners/leads/[id]
 *
 * Fetches a single lead's details with activities
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

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

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .select('*')
      .eq('id', id)
      .eq('assigned_partner_id', partner.id) // Ensure lead is assigned to this partner
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Fetch activities for this lead
    const { data: activities, error: activitiesError } = await supabase
      .from('partner_lead_activities')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })

    if (activitiesError) {
      apiLogger.error('Error fetching activities', { error: activitiesError })
    }

    return NextResponse.json({
      success: true,
      lead,
      activities: activities || [],
    })
  } catch (error) {
    apiLogger.error('Error in lead detail API', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/partners/leads/[id]
 *
 * Updates lead notes or status by partner
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const supabase = await createClient()

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
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    if (partner.status !== 'approved') {
      return NextResponse.json(
        { error: 'Partner not approved yet' },
        { status: 403 }
      )
    }

    // Verify lead is assigned to this partner
    const { data: existingLead, error: verifyError } = await supabase
      .from('coverage_leads')
      .select('id')
      .eq('id', id)
      .eq('assigned_partner_id', partner.id)
      .single()

    if (verifyError || !existingLead) {
      return NextResponse.json(
        { error: 'Lead not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Update lead
    const updates: any = {}
    if (body.partner_notes !== undefined) updates.partner_notes = body.partner_notes
    if (body.status !== undefined) updates.status = body.status
    if (body.next_follow_up_at !== undefined) updates.next_follow_up_at = body.next_follow_up_at

    // Always update last contact time
    updates.partner_last_contact = new Date().toISOString()

    const { data: updatedLead, error: updateError } = await supabase
      .from('coverage_leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      apiLogger.error('Error updating lead', { error: updateError })
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    })
  } catch (error) {
    apiLogger.error('Error in lead update API', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
