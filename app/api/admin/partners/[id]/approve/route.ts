/**
 * Admin Partner Approval/Rejection API
 * POST /api/admin/partners/[id]/approve
 *
 * Approves or rejects a partner application:
 * - On approval: Assigns partner number, sets status to 'approved', sends notification
 * - On rejection: Sets status to 'rejected', sends rejection notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assignPartnerNumber } from '@/lib/partners/partner-number'
import { EmailNotificationService } from '@/lib/notifications/notification-service'
import { z } from 'zod'

// Request body schema
const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional(),
  approval_notes: z.string().optional(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional().default('bronze'),
  commission_rate: z.number().min(0).max(100).optional(),
})

// Default commission rates by tier
const DEFAULT_COMMISSION_RATES: Record<string, number> = {
  bronze: 5,
  silver: 7.5,
  gold: 10,
  platinum: 15,
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: partnerId } = await context.params

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = approvalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { action, rejection_reason, approval_notes, tier, commission_rate } = validation.data

    // Get the partner record
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Check if partner is in a valid state for approval/rejection
    if (!['pending', 'under_review'].includes(partner.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot ${action} partner with status: ${partner.status}` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Generate and assign partner number
      const partnerNumberResult = await assignPartnerNumber(partnerId)

      if (!partnerNumberResult.success || !partnerNumberResult.partnerNumber) {
        return NextResponse.json(
          { success: false, error: partnerNumberResult.error || 'Failed to generate partner number' },
          { status: 500 }
        )
      }

      // Calculate commission rate
      const finalCommissionRate = commission_rate ?? DEFAULT_COMMISSION_RATES[tier] ?? 5

      // Update partner record
      const { error: updateError } = await supabase
        .from('partners')
        .update({
          status: 'approved',
          tier,
          commission_rate: finalCommissionRate,
          approval_notes,
          approved_by: adminUser.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: `Failed to update partner: ${updateError.message}` },
          { status: 500 }
        )
      }

      // Send approval notification
      await EmailNotificationService.sendPartnerApproval({
        email: partner.email,
        contact_person: partner.contact_person,
        business_name: partner.business_name,
        partner_number: partnerNumberResult.partnerNumber,
        tier,
        commission_rate: finalCommissionRate,
      })

      return NextResponse.json({
        success: true,
        message: 'Partner approved successfully',
        partner_number: partnerNumberResult.partnerNumber,
        tier,
        commission_rate: finalCommissionRate,
      })

    } else if (action === 'reject') {
      // Validate rejection reason
      if (!rejection_reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        )
      }

      // Update partner record
      const { error: updateError } = await supabase
        .from('partners')
        .update({
          status: 'rejected',
          approval_notes: rejection_reason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: `Failed to update partner: ${updateError.message}` },
          { status: 500 }
        )
      }

      // Send rejection notification
      await EmailNotificationService.sendPartnerRejection({
        email: partner.email,
        contact_person: partner.contact_person,
        business_name: partner.business_name,
        rejection_reason,
      })

      return NextResponse.json({
        success: true,
        message: 'Partner application rejected',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing partner approval:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
