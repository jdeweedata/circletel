/**
 * API Route: /api/admin/pppoe/credentials/[id]/notify
 *
 * POST: Send PPPoE credentials via SMS and/or Email
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { PPPoECredentialService } from '@/lib/pppoe'
import { clickatellService } from '@/lib/integrations/clickatell/sms-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/pppoe/credentials/[id]/notify
 *
 * Body:
 * - methods: ('sms' | 'email')[] - Notification methods to use
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { methods } = body as { methods: ('sms' | 'email')[] }

    if (!methods || methods.length === 0) {
      return NextResponse.json(
        { error: 'At least one notification method is required' },
        { status: 400 }
      )
    }

    // Create auth client
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    const supabaseAdmin = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get credential with customer details
    const credential = await PPPoECredentialService.getByIdWithDetails(id)

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    if (!credential.customer) {
      return NextResponse.json({ error: 'Customer not found for this credential' }, { status: 404 })
    }

    // Reveal password for notification
    const revealResult = await PPPoECredentialService.revealPassword(
      id,
      user.id,
      'admin'
    )

    if (!revealResult.success || !revealResult.password) {
      return NextResponse.json(
        { error: 'Failed to retrieve password for notification' },
        { status: 500 }
      )
    }

    const results: { method: string; success: boolean; error?: string }[] = []

    // Send SMS if requested
    if (methods.includes('sms')) {
      if (!credential.customer.phone) {
        results.push({ method: 'sms', success: false, error: 'Customer has no phone number' })
      } else {
        try {
          const message = formatSMSMessage(
            credential.pppoeUsername,
            revealResult.password
          )

          const smsResult = await clickatellService.sendSMS({
            to: credential.customer.phone,
            text: message,
          })

          if (!smsResult.success) {
            throw new Error(smsResult.error || 'SMS sending failed')
          }
          await PPPoECredentialService.updateNotificationStatus(id, 'sms')
          results.push({ method: 'sms', success: true })
        } catch (error) {
          console.error('Failed to send SMS:', error)
          results.push({
            method: 'sms',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    // Send Email if requested
    if (methods.includes('email')) {
      if (!credential.customer.email) {
        results.push({ method: 'email', success: false, error: 'Customer has no email address' })
      } else {
        try {
          // TODO: Implement email sending with Resend
          // For now, we'll mark this as pending implementation
          await sendCredentialsEmail(
            credential.customer.email,
            credential.customer.firstName,
            credential.pppoeUsername,
            revealResult.password
          )
          await PPPoECredentialService.updateNotificationStatus(id, 'email')
          results.push({ method: 'email', success: true })
        } catch (error) {
          console.error('Failed to send email:', error)
          results.push({
            method: 'email',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    const allSucceeded = results.every((r) => r.success)
    const anySucceeded = results.some((r) => r.success)

    return NextResponse.json({
      results,
      success: anySucceeded,
      message: allSucceeded
        ? 'Credentials sent successfully'
        : anySucceeded
          ? 'Some notifications sent successfully'
          : 'Failed to send notifications',
    })
  } catch (error) {
    console.error('PPPoE notify error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Format SMS message for PPPoE credentials
 */
function formatSMSMessage(username: string, password: string): string {
  return `CircleTel PPPoE Credentials

Username: ${username}
Password: ${password}

Enter these in your router's PPPoE settings.
Support: 0860 247 253`
}

/**
 * Send credentials email using Resend
 * TODO: Move to proper email template system
 */
async function sendCredentialsEmail(
  email: string,
  firstName: string,
  username: string,
  password: string
): Promise<void> {
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Email service not configured')
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'CircleTel <noreply@circletel.co.za>',
    to: email,
    subject: 'Your CircleTel Internet Connection Details',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F5831F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e0e0e0; }
          .credential-row { display: flex; margin: 10px 0; }
          .label { font-weight: bold; width: 100px; color: #666; }
          .value { font-family: monospace; font-size: 16px; background: #f0f0f0; padding: 5px 10px; border-radius: 4px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .steps { margin: 20px 0; }
          .step { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CircleTel Internet</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Your CircleTel internet service credentials are ready. Use these details to configure your router.</p>

            <div class="credentials">
              <h3 style="margin-top: 0;">Your PPPoE Credentials</h3>
              <div class="credential-row">
                <span class="label">Username:</span>
                <span class="value">${username}</span>
              </div>
              <div class="credential-row">
                <span class="label">Password:</span>
                <span class="value">${password}</span>
              </div>
            </div>

            <div class="steps">
              <h3>Setup Instructions</h3>
              <div class="step">1. Log into your router's admin panel</div>
              <div class="step">2. Navigate to WAN/Internet settings</div>
              <div class="step">3. Select PPPoE as the connection type</div>
              <div class="step">4. Enter your username and password above</div>
              <div class="step">5. Save and restart your router</div>
            </div>

            <p>Need help? Contact our support team at <strong>0860 247 253</strong> or email <a href="mailto:support@circletel.co.za">support@circletel.co.za</a></p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd | www.circletel.co.za</p>
            <p>This email contains sensitive information. Please keep your credentials secure.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
