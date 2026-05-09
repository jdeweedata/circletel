import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { apiLogger } from '@/lib/logging/logger'

/**
 * POST /api/admin/users/pending/[id]/reject
 * Reject a pending admin access request
 * Requires: Super Admin permission
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const authResult = await authenticateAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = await createClient()

    // Call the database function to reject the request
    const { data: result, error: rejectError } = await supabase
      .rpc('reject_admin_access_request', {
        p_request_id: id,
        p_reason: reason
      })

    if (rejectError) {
      apiLogger.error('Error rejecting user request', { error: rejectError })
      return NextResponse.json(
        { error: 'Failed to reject request' },
        { status: 500 }
      )
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || 'Failed to reject request' },
        { status: 400 }
      )
    }

    // Send rejection notification email
    const { data: rejectedRequest } = await supabase
      .from('pending_admin_users')
      .select('email, full_name')
      .eq('id', id)
      .single()

    if (rejectedRequest) {
      // Call email notification function
      await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'rejection',
          email: rejectedRequest.email,
          full_name: rejectedRequest.full_name,
          reason
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Request rejected successfully'
    })
  } catch (error) {
    apiLogger.error('Error in POST /api/admin/users/pending/[id]/reject', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

