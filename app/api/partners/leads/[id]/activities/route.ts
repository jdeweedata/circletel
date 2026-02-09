import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger } from '@/lib/logging/logger'

/**
 * POST /api/partners/leads/[id]/activities
 *
 * Creates a new activity for a lead
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await context.params
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
    const { data: lead, error: verifyError } = await supabase
      .from('coverage_leads')
      .select('id, assigned_partner_id')
      .eq('id', leadId)
      .single()

    if (verifyError || !lead || lead.assigned_partner_id !== partner.id) {
      return NextResponse.json(
        { error: 'Lead not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.activity_type || !body.description) {
      return NextResponse.json(
        { error: 'Activity type and description are required' },
        { status: 400 }
      )
    }

    // Create activity
    const { data: activity, error: activityError } = await supabase
      .from('partner_lead_activities')
      .insert({
        lead_id: leadId,
        partner_id: partner.id,
        activity_type: body.activity_type,
        subject: body.subject,
        description: body.description,
        outcome: body.outcome,
        next_action: body.next_action,
        next_action_date: body.next_action_date,
      })
      .select()
      .single()

    if (activityError) {
      apiLogger.error('Error creating activity', { error: activityError })
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    // Update lead's last contact time
    await supabase
      .from('coverage_leads')
      .update({
        partner_last_contact: new Date().toISOString(),
        follow_up_count: body.activity_type === 'follow_up' ? lead.follow_up_count + 1 : undefined,
      })
      .eq('id', leadId)

    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    apiLogger.error('Error in create activity API', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

