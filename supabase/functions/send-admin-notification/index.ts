import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface NotificationRequest {
  type: 'approval' | 'rejection'
  email: string
  full_name: string
  role_name?: string
  temporary_password?: string
  reason?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const body = await req.json() as NotificationRequest

      if (!body.email || !body.full_name || !body.type) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email, full name, and notification type are required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      let subject: string
      let html: string

      if (body.type === 'approval') {
        subject = '✅ Your CircleTel Admin Access Has Been Approved!'
        html = `
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
              <p style="font-size: 16px;">Hi <strong>${body.full_name}</strong>,</p>

              <p style="font-size: 16px;">Great news! Your request for admin access has been approved. 🎉</p>

              <div style="background: #f8f9fa; border-left: 4px solid #F5831F; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Role Assigned:</strong> ${body.role_name || 'Admin'}</p>
              </div>

              <h3 style="color: #F5831F; font-size: 18px; margin-top: 25px;">Your Login Credentials</h3>

              <div style="background: #fff3e0; border: 1px dashed #F5831F; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${body.email}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${body.temporary_password}</code></p>
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
        `
      } else {
        // Rejection notification
        subject = '❌ CircleTel Admin Access Request Update'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Access Request Update</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Access Request Update</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Hi <strong>${body.full_name}</strong>,</p>

              <p style="font-size: 16px;">Thank you for your interest in joining the CircleTel Admin team.</p>

              <p style="font-size: 16px;">After careful review, we regret to inform you that your admin access request has not been approved at this time.</p>

              ${body.reason ? `
                <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;"><strong>Reason:</strong></p>
                  <p style="margin: 10px 0 0 0; font-size: 14px;">${body.reason}</p>
                </div>
              ` : ''}

              <p style="font-size: 14px; margin-top: 25px;">If you believe this decision was made in error or if you have additional information to provide, please contact your supervisor or reach out to our HR department.</p>

              <p style="font-size: 14px;">You're welcome to submit a new access request in the future if your role or responsibilities change.</p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">

              <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
                This is an automated message from CircleTel Admin System.<br>
                © ${new Date().getFullYear()} CircleTel. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `
      }

      // Send email via Resend
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'CircleTel Admin <noreply@circletel.co.za>',
          to: [body.email],
          subject,
          html
        })
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Resend API error:', errorText)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to send email'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const emailData = await emailResponse.json()

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notification sent successfully',
          email_id: emailData.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Send notification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
