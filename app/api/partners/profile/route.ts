import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/partners/profile
 *
 * Fetches the authenticated partner's profile
 */
export async function GET(request: NextRequest) {
  try {
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
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Sanitize sensitive data before sending
    const sanitizedPartner = {
      ...partner,
      account_number: partner.account_number ? '****' + partner.account_number.slice(-4) : null,
    }

    return NextResponse.json({
      success: true,
      partner: sanitizedPartner,
    })
  } catch (error) {
    console.error('Error in profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/partners/profile
 *
 * Updates the authenticated partner's profile
 * Only allows updating non-sensitive fields when status is 'pending'
 */
export async function PATCH(request: NextRequest) {
  try {
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
    const { data: existingPartner, error: partnerError } = await supabase
      .from('partners')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !existingPartner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Only allow updates if status is 'pending' (prevent changes after approval)
    if (existingPartner.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Profile cannot be edited after approval. Please contact support for changes.',
        },
        { status: 403 }
      )
    }

    // Build update object with allowed fields only
    const allowedFields = [
      'contact_person',
      'email',
      'phone',
      'alternative_phone',
      'street_address',
      'suburb',
      'city',
      'province',
      'postal_code',
    ]

    const updates: any = {}
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    })

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update partner
    const { data: updatedPartner, error: updateError } = await supabase
      .from('partners')
      .update(updates)
      .eq('id', existingPartner.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      partner: updatedPartner,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error in profile update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
