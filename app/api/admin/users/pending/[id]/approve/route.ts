import { NextRequest, NextResponse } from 'next/server'
import { createClientWithSession, createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { apiLogger } from '@/lib/logging/logger'

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

    // Always perform approval inline (more reliable than Edge Function)
    if (true) {
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
          apiLogger.error('Dev inline approval: error fetching pending request', {
            id,
            error: fetchError,
          })
          return NextResponse.json(
            { error: 'Request not found or already processed', details: fetchError?.message },
            { status: 400 }
          )
        }

        pendingRequest = data
      }

      // Create or get existing auth user
      let authUserId: string;
      let authUser: any;

      // First, try to create the user
      const { data: createdUser, error: authError } = await supabase.auth.admin.createUser({
        email: pendingRequest.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: pendingRequest.full_name,
        },
      })

      if (authError) {
        // Check if user already exists
        if (authError.message?.includes('already been registered') || authError.message?.includes('User already registered')) {
          apiLogger.info('Auth user already exists, looking up existing user...')


          // Get the existing user by email
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()

          if (listError) {
            apiLogger.error('Error listing users', { error: listError })
            return NextResponse.json(
              { error: 'Failed to find existing auth user' },
              { status: 500 }
            )
          }

          const existingUser = existingUsers.users.find(u => u.email === pendingRequest.email)

          if (!existingUser) {
            apiLogger.error('User exists but could not be found')
            return NextResponse.json(
              { error: 'Auth user exists but could not be located' },
              { status: 500 }
            )
          }

          // Update the existing user's password and confirm email
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              password: tempPassword,
              email_confirm: true  // Ensure email is confirmed
            }
          )

          if (updateError) {
            apiLogger.error('Error updating password for existing user', { error: updateError })
          } else {
            apiLogger.info('Password updated and email confirmed for existing user')
          }

          authUserId = existingUser.id
          authUser = { user: existingUser }
          apiLogger.info('Using existing auth user', { authUserId })
        } else {
          apiLogger.error('Error creating auth user', { error: authError })
          return NextResponse.json(
            { error: authError.message || 'Failed to create auth user' },
            { status: 500 }
          )
        }
      } else if (!createdUser?.user) {
        apiLogger.error('No user returned from createUser')
        return NextResponse.json(
          { error: 'Failed to create auth user' },
          { status: 500 }
        )
      } else {
        authUserId = createdUser.user.id
        authUser = createdUser
        apiLogger.info('Created new auth user', { authUserId })
      }

      const roleTemplateId = pendingRequest.requested_role_template_id || pendingRequest.requested_role

      // Create admin_users record
      const { data: devAdminUser, error: adminInsertError } = await supabase
        .from('admin_users')
        .insert({
          id: authUserId,
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
        apiLogger.error('Error creating admin user (dev inline approval)', { error: adminInsertError })


        // Only rollback if we just created the auth user (not if it already existed)
        if (authUser && createdUser) {
          await supabase.auth.admin.deleteUser(authUserId)
        }

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
        apiLogger.error('Error updating pending request (dev inline approval)', { error: updateError })
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

      // Send welcome email notification using React Email template
      try {
        const { sendAdminApprovalEmail } = await import('@/lib/emails/templates/admin-templates');

        const emailResult = await sendAdminApprovalEmail({
          fullName: pendingRequest.full_name,
          email: pendingRequest.email,
          role: roleTemplateId,
          roleName: pendingRequest.role_template?.name,
          tempPassword: tempPassword,
          loginUrl: 'https://www.circletel.co.za/admin/login',
          notes: notes,
        });

        if (!emailResult.success) {
          apiLogger.error('Failed to send approval email', { error: emailResult.error });
        } else {
          apiLogger.info('Approval email sent successfully', { email: pendingRequest.email, emailId: emailResult.emailId });
        }
      } catch (emailError) {
        apiLogger.error('Error sending notification email', { error: emailError });
        // Don't fail the approval if email fails
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
  } catch (error) {
    apiLogger.error('Error in POST /api/admin/users/pending/[id]/approve', { error });
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
