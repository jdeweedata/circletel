/**
 * Send Jarryd's credentials to admin for forwarding
 */

require('dotenv').config({ path: '.env.local' });

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('❌ Missing RESEND_API_KEY');
  process.exit(1);
}

const tempPassword = 'f0LG&@zAwUNfU2Qk'; // Password already set in Supabase Auth

async function sendEmail() {
  console.log('📧 Sending Jarryd\'s credentials to admin for forwarding...\n');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .admin-notice { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; }
    .header { background: linear-gradient(135deg, #F5831F 0%, #FF6B35 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .credentials { background: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; margin: 20px 0; }
    .forward-instructions { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
    .button { display: inline-block; background: #F5831F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    code { background: #f5f5f5; padding: 3px 8px; border-radius: 3px; font-family: 'Courier New', monospace; border: 1px solid #ddd; }
    .copy-box { background: #f5f5f5; padding: 15px; border: 2px dashed #ccc; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="admin-notice">
      <strong>⚠️ ADMIN ACTION REQUIRED</strong><br>
      Please forward the credentials below to Jarryd Jackson at <strong>jarrydj@intelliview.co.za</strong>
    </div>

    <div class="header">
      <h1>🎉 Admin Access Approved</h1>
      <p>Service Delivery Manager Role</p>
    </div>

    <div class="content">
      <h2>📋 User Details</h2>
      <div class="credentials">
        <p><strong>👤 Full Name:</strong> Jarryd Jackson</p>
        <p><strong>📧 Email:</strong> jarrydj@intelliview.co.za</p>
        <p><strong>🎯 Role:</strong> Service Delivery Manager</p>
        <p><strong>🔐 Temporary Password:</strong> <code style="font-size: 16px; background: #fff; padding: 8px 12px;">${tempPassword}</code></p>
        <p><strong>🔗 Login URL:</strong> <a href="https://www.circletel.co.za/admin/login">https://www.circletel.co.za/admin/login</a></p>
        <p><strong>📅 Account Activated:</strong> November 20, 2025</p>
      </div>

      <div class="forward-instructions">
        <h3>📧 Forwarding Instructions</h3>
        <p>Please copy the message below and send it to Jarryd at <strong>jarrydj@intelliview.co.za</strong>:</p>
      </div>

      <div class="copy-box">
        <p><strong>Subject:</strong> ✅ Your CircleTel Admin Access - Service Delivery Manager</p>
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
        <p>Hi Jarryd,</p>

        <p>Great news! Your request for CircleTel admin access has been approved. 🎉</p>

        <p><strong>Your Login Credentials:</strong></p>
        <ul>
          <li><strong>Email:</strong> jarrydj@intelliview.co.za</li>
          <li><strong>Temporary Password:</strong> ${tempPassword}</li>
          <li><strong>Role:</strong> Service Delivery Manager</li>
          <li><strong>Login URL:</strong> https://www.circletel.co.za/admin/login</li>
        </ul>

        <p><strong>🔐 Important Security Steps:</strong></p>
        <ol>
          <li>Log in using your email and the temporary password above</li>
          <li><strong>Change your password immediately</strong> after first login</li>
          <li>Do not share your credentials with anyone</li>
          <li>Enable two-factor authentication if prompted</li>
        </ol>

        <p><strong>👥 Your Access Level:</strong></p>
        <p>As a Service Delivery Manager, you'll have access to:</p>
        <ul>
          <li>Service delivery workflows and scheduling</li>
          <li>Installation tracking and logistics</li>
          <li>Inventory management</li>
          <li>Customer service management</li>
          <li>Team coordination tools</li>
        </ul>

        <p>If you have any questions or issues logging in, please let me know.</p>

        <p>Welcome to the team!</p>

        <p>Best regards,<br>
        CircleTel Admin Team</p>
      </div>

      <h3>✅ System Status</h3>
      <ul>
        <li>✅ Supabase Auth account created (ID: 74363853-54cf-4bff-bccf-3020417f4e5d)</li>
        <li>✅ Admin user record created in database</li>
        <li>✅ Password set and email confirmed</li>
        <li>✅ Role template assigned: service_delivery_manager</li>
        <li>⏳ <strong>Pending:</strong> User needs to be notified of credentials</li>
      </ul>

      <h3>🔧 Technical Details</h3>
      <p><small>
        <strong>User ID:</strong> 74363853-54cf-4bff-bccf-3020417f4e5d<br>
        <strong>Role Template ID:</strong> service_delivery_manager<br>
        <strong>Created:</strong> 2025-11-20 09:29:40<br>
        <strong>Password Last Updated:</strong> Just now (via resend script)
      </small></p>

      <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <p><strong>⚠️ Note:</strong> The temporary password above is already active in Supabase Auth. Jarryd can log in as soon as you send him the credentials.</p>
      </div>
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
        from: 'CircleTel Admin <onboarding@resend.dev>',
        to: ['jeffrey.de.wee@circletel.co.za'],
        subject: '⚠️ ACTION REQUIRED: Forward Admin Credentials to Jarryd Jackson',
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully to your inbox!');
    console.log('\n📧 Email Details:');
    console.log('   Email ID:', result.id);
    console.log('   Sent to: jeffrey.de.wee@circletel.co.za');
    console.log('   Subject: ACTION REQUIRED: Forward Admin Credentials to Jarryd Jackson');
    console.log('\n📋 Credentials to Forward:');
    console.log('   Recipient: jarrydj@intelliview.co.za');
    console.log('   Name: Jarryd Jackson');
    console.log('   Role: Service Delivery Manager');
    console.log('   Temporary Password:', tempPassword);
    console.log('   Login URL: https://www.circletel.co.za/admin/login');
    console.log('\n✅ Please check your email and forward the credentials to Jarryd!');

  } catch (error) {
    console.error('\n❌ Error sending email:', error.message);
    process.exit(1);
  }
}

sendEmail();
