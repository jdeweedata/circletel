/**
 * Send email to Jarryd using verified Resend domain
 */

require('dotenv').config({ path: '.env.local' });

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('❌ Missing RESEND_API_KEY');
  process.exit(1);
}

const tempPassword = 'f0LG&@zAwUNfU2Qk'; // Password that was already set in Supabase Auth

async function sendEmail() {
  console.log('📧 Sending approval email to Jarryd Jackson...\n');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F5831F 0%, #FF6B35 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .credentials { background: #f5f5f5; padding: 20px; border-left: 4px solid #F5831F; margin: 20px 0; }
    .button { display: inline-block; background: #F5831F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    code { background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 14px; font-family: 'Courier New', monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to CircleTel Admin!</h1>
    </div>
    <div class="content">
      <h2>Hi Jarryd Jackson,</h2>
      <p>Your request for admin access has been <strong>approved</strong>! 🎉</p>

      <div class="credentials">
        <h3>📋 Your Login Credentials</h3>
        <p><strong>Email:</strong> jarrydj@intelliview.co.za</p>
        <p><strong>Temporary Password:</strong><br><code>${tempPassword}</code></p>
        <p><strong>Role:</strong> Service Delivery Manager</p>
      </div>

      <h3>🔐 Security Instructions</h3>
      <ul>
        <li><strong>Change your password immediately</strong> after your first login</li>
        <li>Do not share this password with anyone</li>
        <li>Keep your credentials secure</li>
        <li>If you didn't request this access, contact your administrator immediately</li>
      </ul>

      <h3>🚀 What's Next?</h3>
      <ol>
        <li>Click the button below to access the admin panel</li>
        <li>Log in with your email and temporary password</li>
        <li>You'll be prompted to set a new secure password</li>
        <li>Explore your Service Delivery Manager dashboard</li>
      </ol>

      <p style="text-align: center;">
        <a href="https://www.circletel.co.za/admin/login" class="button">🔗 Login to Admin Panel</a>
      </p>

      <h3>👥 Your Permissions</h3>
      <p>As a <strong>Service Delivery Manager</strong>, you have access to:</p>
      <ul>
        <li>Service delivery workflows and scheduling</li>
        <li>Installation tracking and logistics</li>
        <li>Inventory management</li>
        <li>Customer service management</li>
        <li>Team coordination tools</li>
      </ul>

      <p>If you have any questions or need assistance, please contact your system administrator or the IT team.</p>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <small><strong>Note:</strong> This email was resent because the original notification was not received. Your account was activated on November 20, 2025.</small>
      </p>
    </div>
    <div class="footer">
      <p><strong>CircleTel Admin System</strong></p>
      <p>Reliable Tech Solutions</p>
      <p>&copy; ${new Date().getFullYear()} CircleTel. All rights reserved.</p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        🤖 This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel Admin <onboarding@resend.dev>', // Use verified Resend domain
        to: ['jarrydj@intelliview.co.za'],
        subject: '✅ Your CircleTel Admin Access Has Been Approved - Service Delivery Manager',
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully!');
    console.log('\n📧 Email Details:');
    console.log('   Email ID:', result.id);
    console.log('   To:', 'jarrydj@intelliview.co.za');
    console.log('   Recipient:', 'Jarryd Jackson');
    console.log('   Role:', 'Service Delivery Manager');
    console.log('   Temporary Password:', tempPassword);
    console.log('   Login URL:', 'https://www.circletel.co.za/admin/login');
    console.log('\n✅ Jarryd should receive the email shortly!');
    console.log('⚠️  The password is already active in Supabase Auth');

  } catch (error) {
    console.error('\n❌ Error sending email:', error.message);
    console.log('\n📋 MANUAL EMAIL DETAILS:');
    console.log('   To: jarrydj@intelliview.co.za');
    console.log('   Subject: ✅ Your CircleTel Admin Access Has Been Approved');
    console.log('   Temporary Password:', tempPassword);
    console.log('   Login: https://www.circletel.co.za/admin/login');
    process.exit(1);
  }
}

sendEmail();
