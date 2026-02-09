import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger } from '@/lib/logging'

/**
 * POST /api/admin/signup
 * Submit an admin access request
 * Public endpoint - no authentication required
 */
export async function POST(request: NextRequest) {
  try {
    apiLogger.info('[Admin Signup] Processing request...')

    const body = await request.json()
    const { email, full_name, requested_role_template_id, reason } = body

    apiLogger.info('[Admin Signup] Request data:', { email, full_name, requested_role_template_id })

    // Validate required fields
    if (!email || !full_name || !requested_role_template_id) {
      apiLogger.info('[Admin Signup] Validation failed: missing required fields')
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
      apiLogger.info('[Admin Signup] Validation failed: invalid email format')
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    apiLogger.info('[Admin Signup] Creating Supabase client...')
    const supabase = await createClient()
    apiLogger.info('[Admin Signup] Supabase client created successfully')

    // Check if email already exists in admin_users
    apiLogger.info('[Admin Signup] Checking for existing admin...')
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    // Only return error if it's a real database error, not "no rows found"
    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      apiLogger.error('[Admin Signup] Error checking existing admin:', adminCheckError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error checking existing admin',
          details: adminCheckError.message
        },
        { status: 500 }
      )
    }
    apiLogger.info('[Admin Signup] Existing admin check complete:', { exists: !!existingAdmin })

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
    apiLogger.info('[Admin Signup] Checking for existing pending request...')
    const { data: existingRequest, error: requestCheckError } = await supabase
      .from('pending_admin_users')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    // Only return error if it's a real database error, not "no rows found"
    if (requestCheckError && requestCheckError.code !== 'PGRST116') {
      apiLogger.error('[Admin Signup] Error checking existing request:', requestCheckError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error checking pending requests',
          details: requestCheckError.message
        },
        { status: 500 }
      )
    }
    apiLogger.info('[Admin Signup] Pending request check complete:', { exists: !!existingRequest, status: existingRequest?.status })

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
          apiLogger.error('Error deleting rejected request:', deleteError)
        }
      }
    }

    // Create pending admin user request
    apiLogger.info('[Admin Signup] Creating pending request...')
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
      apiLogger.error('[Admin Signup] Error creating pending user:', JSON.stringify(insertError, null, 2))
      apiLogger.error('[Admin Signup] Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to submit access request',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      )
    }
    apiLogger.info('[Admin Signup] Pending request created successfully:', pendingUser.id)

    // TODO: Send notification email to super admins about new access request
    // This can be implemented later when email service is set up

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully. You will be notified once reviewed.',
      request_id: pendingUser.id
    })
  } catch (error) {
    apiLogger.error('[Admin Signup] Uncaught error:', error)
    apiLogger.error('[Admin Signup] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
