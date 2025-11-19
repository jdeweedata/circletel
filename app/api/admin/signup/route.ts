import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/signup
 * Submit an admin access request
 * Public endpoint - no authentication required
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, full_name, requested_role_template_id, reason } = body

    // Validate required fields
    if (!email || !full_name || !requested_role_template_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, full name, and requested role are required'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if email already exists in admin_users
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    // Only return error if it's a real database error, not "no rows found"
    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.error('Error checking existing admin:', adminCheckError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error'
        },
        { status: 500 }
      )
    }

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'An admin account with this email already exists'
        },
        { status: 409 }
      )
    }

    // Check if pending request already exists
    const { data: existingRequest, error: requestCheckError } = await supabase
      .from('pending_admin_users')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    // Only return error if it's a real database error, not "no rows found"
    if (requestCheckError && requestCheckError.code !== 'PGRST116') {
      console.error('Error checking existing request:', requestCheckError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error'
        },
        { status: 500 }
      )
    }

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          {
            success: false,
            error: 'A pending access request already exists for this email'
          },
          { status: 409 }
        )
      } else if (existingRequest.status === 'rejected') {
        // Allow resubmission after rejection
        const { error: deleteError } = await supabase
          .from('pending_admin_users')
          .delete()
          .eq('id', existingRequest.id)

        if (deleteError) {
          console.error('Error deleting rejected request:', deleteError)
        }
      }
    }

    // Create pending admin user request
    const { data: pendingUser, error: insertError } = await supabase
      .from('pending_admin_users')
      .insert({
        email,
        full_name,
        requested_role: requested_role_template_id, // Legacy field
        requested_role_template_id,
        reason: reason || null,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating pending user:', JSON.stringify(insertError, null, 2))
      console.error('Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to submit access request',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    // TODO: Send notification email to super admins about new access request
    // This can be implemented later when email service is set up

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully. You will be notified once reviewed.',
      request_id: pendingUser.id
    })
  } catch (error) {
    console.error('Admin signup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
