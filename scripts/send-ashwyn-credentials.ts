/**
 * Send credentials to Ashwyn via Email and SMS
 * Uses verified Resend domain
 *
 * Run with: npx tsx scripts/send-ashwyn-credentials.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ASHWYN = {
  firstName: 'Ashwyn',
  lastName: 'Watkins',
  email: 'ashwynw@newgengroup.co.za',
  phone: '0713511820',
  role: 'Product Manager',
  tempPassword: 'MQH5KUKf#fw',
};

const TEST_PHONE = '0737288016'; // User's test phone

async function sendSMS(phone: string, isTest: boolean = false) {
  console.log(`\n=== Sending SMS to ${phone} ${isTest ? '(TEST)' : ''} ===`);

  const apiKey = process.env.CLICKATELL_API_KEY;
  if (!apiKey) {
    console.error('CLICKATELL_API_KEY not configured');
    return false;
  }

  // Format phone to international
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '27' + formattedPhone.substring(1);
  }

  const smsMessage = `Hi ${ASHWYN.firstName}, welcome to CircleTel Admin! Login: ${ASHWYN.email} | Temp Password: ${ASHWYN.tempPassword} | URL: https://www.circletel.co.za/admin/login - Please change your password after first login.`;

  console.log(`To: ${formattedPhone}`);
  console.log(`Message length: ${smsMessage.length} chars`);

  try {
    const response = await fetch('https://platform.clickatell.com/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        messages: [{
          channel: 'sms',
          to: formattedPhone,
          content: smsMessage,
        }]
      }),
    });

    const data = await response.json();

    if (!response.ok || data.messages?.[0]?.error) {
      console.error('SMS failed:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log('SMS sent successfully!');
    console.log('Message ID:', data.messages?.[0]?.apiMessageId);
    return true;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}

async function sendEmail() {
  console.log('\n=== Sending Email ===');

  // Use the correct API key and domain
  const apiKey = 're_6iZ9mzS5_F4mjSkQYHyYP6teateSeknUV';
  const fromEmail = 'noreply@notify.circletel.co.za';

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #F5831F 0%, #e06b0a 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; background: #ffffff; }
    .credentials-box { background: #f8f9fa; border: 2px solid #F5831F; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #666; display: block; font-size: 12px; text-transform: uppercase; }
    .credential-value { font-size: 16px; color: #333; font-family: monospace; background: #fff; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    .button { display: inline-block; background: #F5831F; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; border-radius: 4px; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f8f9fa; }
    .role-badge { display: inline-block; background: #1E4B85; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to CircleTel Admin</h1>
    </div>
    <div class="content">
      <p>Hi ${ASHWYN.firstName},</p>

      <p>Your CircleTel Admin account has been created. You now have access to the admin portal as a <span class="role-badge">${ASHWYN.role}</span>.</p>

      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #F5831F;">Your Login Credentials</h3>

        <div class="credential-item">
          <span class="credential-label">Email / Username</span>
          <span class="credential-value">${ASHWYN.email}</span>
        </div>

        <div class="credential-item">
          <span class="credential-label">Temporary Password</span>
          <span class="credential-value">${ASHWYN.tempPassword}</span>
        </div>

        <div class="credential-item">
          <span class="credential-label">Login URL</span>
          <span class="credential-value">https://www.circletel.co.za/admin/login</span>
        </div>
      </div>

      <p><a href="https://www.circletel.co.za/admin/login" class="button">Login to Admin Portal</a></p>

      <div class="warning">
        <strong>Important:</strong> Please change your password after your first login for security purposes.
      </div>

      <h3>What You Can Do as Product Manager:</h3>
      <ul>
        <li>Update pricing on service packages</li>
        <li>Manage package configurations and features</li>
        <li>View and edit the product catalog</li>
        <li>Review product performance metrics</li>
      </ul>

      <p>If you have any questions or need assistance, please contact the IT team.</p>

      <p>Best regards,<br>
      <strong>CircleTel Admin Team</strong></p>
    </div>
    <div class="footer">
      <p>CircleTel (Pty) Ltd | www.circletel.co.za</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  console.log(`To: ${ASHWYN.email}`);
  console.log(`From: CircleTel <${fromEmail}>`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `CircleTel <${fromEmail}>`,
        to: [ASHWYN.email],
        reply_to: 'support@circletel.co.za',
        subject: 'Welcome to CircleTel Admin - Your Login Credentials',
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email failed:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log('Email sent successfully!');
    console.log('Message ID:', data.id);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

async function main() {
  console.log('=============================================');
  console.log('Sending Credentials to Ashwyn Watkins');
  console.log('=============================================');
  console.log(`Name: ${ASHWYN.firstName} ${ASHWYN.lastName}`);
  console.log(`Email: ${ASHWYN.email}`);
  console.log(`Phone: ${ASHWYN.phone}`);
  console.log(`Role: ${ASHWYN.role}`);
  console.log(`Temp Password: ${ASHWYN.tempPassword}`);

  // Send test SMS to user first
  const testSmsResult = await sendSMS(TEST_PHONE, true);

  // Send email to Ashwyn
  const emailResult = await sendEmail();

  console.log('\n=== Summary ===');
  console.log(`Test SMS (to ${TEST_PHONE}): ${testSmsResult ? '✅ Sent' : '❌ Failed'}`);
  console.log(`Email to Ashwyn: ${emailResult ? '✅ Sent' : '❌ Failed'}`);

  if (testSmsResult && emailResult) {
    console.log('\n✅ All notifications sent successfully!');
  } else {
    console.log('\n⚠️ Some notifications failed. Check logs above.');
  }
}

main().catch(console.error);
