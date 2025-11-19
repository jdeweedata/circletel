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
          console.log('Auth user already exists, looking up existing user...')

          // Get the existing user by email
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()

          if (listError) {
            console.error('Error listing users:', listError)
            return NextResponse.json(
              { error: 'Failed to find existing auth user' },
              { status: 500 }
            )
          }

          const existingUser = existingUsers.users.find(u => u.email === pendingRequest.email)

          if (!existingUser) {
            console.error('User exists but could not be found')
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
            console.error('Error updating password for existing user:', updateError)
          } else {
            console.log('Password updated and email confirmed for existing user')
          }

          authUserId = existingUser.id
          authUser = { user: existingUser }
          console.log('Using existing auth user:', authUserId)
        } else {
          console.error('Error creating auth user:', authError)
          return NextResponse.json(
            { error: authError.message || 'Failed to create auth user' },
            { status: 500 }
          )
        }
      } else if (!createdUser?.user) {
        console.error('No user returned from createUser')
        return NextResponse.json(
          { error: 'Failed to create auth user' },
          { status: 500 }
        )
      } else {
        authUserId = createdUser.user.id
        authUser = createdUser
        console.log('Created new auth user:', authUserId)
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
        console.error('Error creating admin user (dev inline approval):', adminInsertError)

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

      // Send welcome email notification directly via Resend API
      try {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Admin Access Approved</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #F5831F 0%, #E67510 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CircleTel Admin!</h1>
              </div>

              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hi <strong>${pendingRequest.full_name}</strong>,</p>

                <p style="font-size: 16px;">Great news! Your request for admin access has been approved. 🎉</p>

                <div style="background: #f8f9fa; border-left: 4px solid #F5831F; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;"><strong>Role Assigned:</strong> ${pendingRequest.role_template?.name || roleTemplateId}</p>
                </div>

                <h3 style="color: #F5831F; font-size: 18px; margin-top: 25px;">Your Login Credentials</h3>

                <div style="background: #fff3e0; border: 1px dashed #F5831F; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${pendingRequest.email}</p>
                  <p style="margin: 5px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
                </div>

                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 13px; color: #856404;">
                    <strong>⚠️ Important:</strong> Please change your password immediately after your first login for security purposes.
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://www.circletel.co.za/admin/login"
                     style="display: inline-block; background: #F5831F; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    Login to Admin Panel
                  </a>
                </div>

                <h3 style="color: #F5831F; font-size: 16px; margin-top: 25px;">Next Steps</h3>
                <ol style="padding-left: 20px; font-size: 14px;">
                  <li>Log in using the credentials above</li>
                  <li>Change your password in Profile Settings</li>
                  <li>Familiarize yourself with the admin dashboard</li>
                  <li>Review the documentation for your role</li>
                </ol>

                <p style="font-size: 14px; margin-top: 25px;">If you have any questions or need assistance, please contact your administrator or our support team.</p>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">

                <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
                  This is an automated message from CircleTel Admin System.<br>
                  © ${new Date().getFullYear()} CircleTel. All rights reserved.
                </p>
              </div>
            </body>
            </html>
          `;

          // Use configured email or fallback to Resend's onboarding address for testing
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [pendingRequest.email],
              subject: '✅ Your CircleTel Admin Access Has Been Approved!',
              html: emailHtml
            })
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Failed to send approval email:', errorText);
          } else {
            console.log('Approval email sent successfully to:', pendingRequest.email);
          }
        } else {
          console.warn('RESEND_API_KEY not configured, skipping email notification');
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
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
