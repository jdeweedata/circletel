import { NextRequest, NextResponse } from 'next/server'
import { createClientWithSession, createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * POST /api/admin/users/pending/[id]/approve
 * Approve a pending admin access request
 * Requires: Super Admin permission
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { notes, request: requestPayload } = body

    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession()

    // Get current user
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Service-role client for privileged checks and function invocation
    const supabase = await createClient()

    // Check if user is a super admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role_template_id, role')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser || (adminUser.role !== 'super_admin' && adminUser.role_template_id !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      )
    }

    // In development, perform approval inline instead of calling the Edge Function
    if (process.env.NODE_ENV !== 'production') {
      const tempPassword = generateStrongPassword(16)

      // Prefer request payload (from the client) and fall back to DB fetch only if missing
      let pendingRequest: any = requestPayload

      if (!pendingRequest) {
        const { data, error: fetchError } = await supabase
          .from('pending_admin_users')
          .select(`
            *,
            role_template:role_templates!pending_admin_users_requested_role_template_id_fkey(*)
          `)
          .eq('id', id)
          .single()

        if (fetchError || !data) {
          console.error('Dev inline approval: error fetching pending request', {
            id,
            fetchError,
          })
          return NextResponse.json(
            { error: 'Request not found or already processed', details: fetchError?.message },
            { status: 400 }
          )
        }

        pendingRequest = data
      }

      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: pendingRequest.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: pendingRequest.full_name,
        },
      })

      if (authError || !authUser?.user) {
        console.error('Error creating auth user (dev inline approval):', authError)
        return NextResponse.json(
          { error: authError?.message || 'Failed to create auth user' },
          { status: 500 }
        )
      }

      const roleTemplateId = pendingRequest.requested_role_template_id || pendingRequest.requested_role

      // Create admin_users record
      const { data: devAdminUser, error: adminInsertError } = await supabase
        .from('admin_users')
        .insert({
          id: authUser.user.id,
          email: pendingRequest.email,
          full_name: pendingRequest.full_name,
          role: roleTemplateId,
          role_template_id: roleTemplateId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (adminInsertError) {
        console.error('Error creating admin user (dev inline approval):', adminInsertError)
        // Rollback auth user
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return NextResponse.json(
          { error: adminInsertError.message || 'Failed to create admin user' },
          { status: 500 }
        )
      }

      // Update pending request status
      const { error: updateError } = await supabase
        .from('pending_admin_users')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error updating pending request (dev inline approval):', updateError)
      }

      // Log audit trail
      await supabase.from('admin_audit_logs').insert({
        user_id: user.id,
        action: 'APPROVE_ADMIN_USER',
        entity_type: 'admin_users',
        entity_id: devAdminUser.id,
        changes: {
          request_id: id,
          approved_user_email: pendingRequest.email,
          role: roleTemplateId,
          notes,
        },
        timestamp: new Date().toISOString(),
      })

      // Send welcome email notification (best effort)
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'approval',
            email: pendingRequest.email,
            full_name: pendingRequest.full_name,
            role_name: pendingRequest.role_template?.name || roleTemplateId,
            temporary_password: tempPassword,
          },
        })
      } catch (emailError) {
        console.error('Error sending notification email (dev inline approval):', emailError)
      }

      return NextResponse.json({
        success: true,
        message: 'User approved successfully',
        data: {
          user_id: devAdminUser.id,
          email: devAdminUser.email,
          role: roleTemplateId,
        },
      })
    }

    // In production, delegate to the Edge Function
    const { data: result, error: approvalError } = await supabase.functions.invoke('approve-admin-user', {
      body: {
        request_id: id,
        reviewer_id: user.id,
        notes,
      },
    })

    if (approvalError) {
      console.error('Error approving user via Edge Function:', approvalError)
      return NextResponse.json(
        { error: approvalError.message || 'Failed to approve user' },
        { status: 500 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to approve user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User approved successfully',
      data: result.data,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/users/pending/[id]/approve:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateStrongPassword(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
  const bytes = crypto.randomBytes(length)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
}
