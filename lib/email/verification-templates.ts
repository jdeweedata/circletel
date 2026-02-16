/**
 * CircleTel Email Verification Templates
 *
 * Custom branded email templates for Supabase auth emails
 */

interface EmailTemplateParams {
  email: string;
  confirmationUrl: string;
  firstName?: string;
  lastName?: string;
}

export const getVerificationEmailHTML = (params: EmailTemplateParams): string => {
  const { email, confirmationUrl, firstName } = params;
  const currentYear = new Date().getFullYear();
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your CircleTel Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">

          <!-- CircleTel Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F5831F 0%, #E67516 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">
                CircleTel
              </h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">
                High-Speed Connectivity for South Africa
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1F2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">
                ${greeting}, Welcome to CircleTel! 🎉
              </h2>

              <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're thrilled to have you join our community of thousands of satisfied customers enjoying lightning-fast internet across South Africa.
              </p>

              <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                To get started and secure your account, please verify your email address by clicking the button below:
              </p>

              <!-- Verification Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${confirmationUrl}"
                       style="display: inline-block; background-color: #F5831F; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 6px rgba(245,131,31,0.3); transition: all 0.3s ease;">
                      ✓ Verify My Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; margin: 0 0 30px 0;">
                <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0; font-weight: 600;">
                  Button not working? Copy and paste this link:
                </p>
                <p style="color: #F5831F; font-size: 13px; word-break: break-all; margin: 0; font-family: 'Courier New', monospace;">
                  ${confirmationUrl}
                </p>
              </div>

              <!-- Info Box -->
              <div style="border-left: 4px solid #3B82F6; background-color: #EFF6FF; padding: 16px 20px; border-radius: 4px; margin: 0 0 20px 0;">
                <p style="color: #1E40AF; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⏰ This link expires in 24 hours.</strong><br>
                  If you didn't create a CircleTel account, you can safely ignore this email.
                </p>
              </div>

              <!-- What's Next -->
              <h3 style="color: #1F2937; margin: 30px 0 16px 0; font-size: 18px; font-weight: 700;">
                What happens next?
              </h3>

              <ul style="color: #4B5563; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 24px;">
                <li>Verify your email address (click the button above)</li>
                <li>Complete your order and select your package</li>
                <li>Our team will schedule your installation</li>
                <li>Start enjoying high-speed connectivity!</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #E5E7EB;">
              <!-- Contact Info -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0; font-weight: 600;">
                      Need help? We're here for you!
                    </p>
                    <p style="color: #4B5563; font-size: 14px; margin: 0 0 8px 0;">
                      📧 Email: <a href="mailto:contactus@circletel.co.za" style="color: #F5831F; text-decoration: none; font-weight: 600;">contactus@circletel.co.za</a>
                    </p>
                    <p style="color: #4B5563; font-size: 14px; margin: 0 0 20px 0;">
                      💬 WhatsApp: <a href="https://wa.me/27824873900" style="color: #F5831F; text-decoration: none; font-weight: 600;">082 487 3900</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Social Links (Optional) -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0; border-top: 1px solid #E5E7EB;">
                    <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6; margin: 0;">
                      © ${currentYear} CircleTel. All rights reserved.<br>
                      Connecting South Africa, one home at a time.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const getPasswordResetEmailHTML = (params: EmailTemplateParams): string => {
  const { email, confirmationUrl, firstName } = params;
  const currentYear = new Date().getFullYear();
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your CircleTel Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">

          <!-- CircleTel Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F5831F 0%, #E67516 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800;">
                CircleTel
              </h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">
                High-Speed Connectivity for South Africa
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1F2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">
                ${greeting}, Reset Your Password
              </h2>

              <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset the password for your CircleTel account associated with <strong>${email}</strong>.
              </p>

              <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to set a new password:
              </p>

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${confirmationUrl}"
                       style="display: inline-block; background-color: #F5831F; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 6px rgba(245,131,31,0.3);">
                      🔑 Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; margin: 0 0 30px 0;">
                <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0; font-weight: 600;">
                  Button not working? Copy and paste this link:
                </p>
                <p style="color: #F5831F; font-size: 13px; word-break: break-all; margin: 0; font-family: 'Courier New', monospace;">
                  ${confirmationUrl}
                </p>
              </div>

              <!-- Security Warning -->
              <div style="border-left: 4px solid #EF4444; background-color: #FEF2F2; padding: 16px 20px; border-radius: 4px;">
                <p style="color: #991B1B; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⚠️ Didn't request this?</strong><br>
                  If you didn't request a password reset, please ignore this email. Your password will remain unchanged. This link expires in 1 hour.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #E5E7EB;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #6B7280; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                      Need help? Contact CircleTel Support
                    </p>
                    <p style="color: #4B5563; font-size: 14px; margin: 0 0 8px 0;">
                      📧 <a href="mailto:contactus@circletel.co.za" style="color: #F5831F; text-decoration: none;">contactus@circletel.co.za</a>
                    </p>
                    <p style="color: #4B5563; font-size: 14px; margin: 0 0 20px 0;">
                      📞 <a href="https://wa.me/27824873900" style="color: #F5831F; text-decoration: none;">082 487 3900</a>
                    </p>
                    <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                      © ${currentYear} CircleTel. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Plain text versions for email clients that don't support HTML
export const getVerificationEmailText = (params: EmailTemplateParams): string => {
  const { email, confirmationUrl, firstName } = params;
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  return `
${greeting}, Welcome to CircleTel!

We're thrilled to have you join our community. To get started and secure your account, please verify your email address.

Verify your email by clicking this link:
${confirmationUrl}

This link will expire in 24 hours.

If you didn't create a CircleTel account, you can safely ignore this email.

What happens next?
- Verify your email address
- Complete your order and select your package
- Our team will schedule your installation
- Start enjoying high-speed connectivity!

Need help? Contact us:
Email: contactus@circletel.co.za
WhatsApp: 082 487 3900

© ${new Date().getFullYear()} CircleTel. All rights reserved.
Connecting South Africa, one home at a time.
  `.trim();
};

export const getPasswordResetEmailText = (params: EmailTemplateParams): string => {
  const { email, confirmationUrl, firstName } = params;
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  return `
${greeting},

We received a request to reset the password for your CircleTel account (${email}).

Reset your password by clicking this link:
${confirmationUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Need help? Contact CircleTel Support:
Email: contactus@circletel.co.za
WhatsApp: 082 487 3900

© ${new Date().getFullYear()} CircleTel. All rights reserved.
  `.trim();
};
