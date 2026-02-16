/**
 * Send Admin Welcome Email
 * Usage: npx ts-node scripts/send-admin-welcome-email.ts
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in .env.local');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function sendAdminWelcomeEmail() {
  const recipient = {
    email: 'watkins.ashwyn@gmail.com',
    name: 'Ashwyn Watkins',
    role: 'Product Manager',
  };

  const adminPortalUrl = 'https://circletel.co.za/admin';

  console.log(`📧 Sending welcome email to ${recipient.email}...`);

  try {
    const { data, error } = await resend.emails.send({
      from: 'CircleTel <noreply@notify.circletel.co.za>',
      to: [recipient.email],
      subject: 'Welcome to CircleTel Admin Portal - Product Manager Access',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #F5831F; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">CircleTel</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Digital Service Provider</p>
            </div>

            <div style="background-color: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #1F2937; margin-top: 0;">Welcome, ${recipient.name}! 🎉</h2>

              <p style="font-size: 16px; color: #4B5563;">
                You've been added as a <strong style="color: #F5831F;">${recipient.role}</strong> on the CircleTel Admin Portal.
              </p>

              <div style="background-color: #FFF7ED; border-left: 4px solid #F5831F; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #1F2937;">Your Permissions Include:</p>
                <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
                  <li>View, create, edit, and delete products</li>
                  <li>Manage product pricing and costs</li>
                  <li>Approve and publish products</li>
                  <li>View cost breakdowns and margins</li>
                  <li>Access dashboard analytics</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${adminPortalUrl}" 
                   style="display: inline-block; background-color: #F5831F; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(245,131,31,0.3);">
                  Access Admin Portal
                </a>
              </div>

              <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #1F2937;">How to Login:</p>
                <ol style="margin: 0; padding-left: 20px; color: #4B5563;">
                  <li>Click the button above or go to <a href="${adminPortalUrl}" style="color: #F5831F;">${adminPortalUrl}</a></li>
                  <li>Click <strong>"Sign in with Google"</strong></li>
                  <li>Use your <strong>${recipient.email}</strong> account</li>
                </ol>
              </div>

              <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400E;">
                  <strong>📝 Note:</strong> All pricing changes require a change reason for audit purposes. This ensures transparency and accountability.
                </p>
              </div>

              <p style="font-size: 14px; color: #6B7280;">
                If you have any questions or need assistance, please contact the admin team.
              </p>

              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

              <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
                © ${new Date().getFullYear()} CircleTel (Pty) Ltd. All rights reserved.<br>
                West House, 7 Autumn Road, Rivonia, Johannesburg, 2128<br>
                <a href="mailto:contactus@circletel.co.za" style="color: #F5831F; text-decoration: none;">contactus@circletel.co.za</a> |
                <a href="https://wa.me/27824873900" style="color: #F5831F; text-decoration: none;">082 487 3900</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data?.id);
    console.log(`📧 Recipient: ${recipient.name} <${recipient.email}>`);
    console.log(`🔑 Role: ${recipient.role}`);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

sendAdminWelcomeEmail();
