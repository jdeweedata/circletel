/**
 * Invite Admin User: Ashwyn Watkins
 * Creates Supabase Auth account and sends credentials via Email and SMS
 *
 * Run with: npx tsx scripts/invite-admin-ashwyn.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

// Ashwyn's details
const ADMIN_USER = {
  firstName: 'Ashwyn',
  lastName: 'Watkins',
  email: 'ashwynw@newgengroup.co.za',
  phone: '0713511820',
  role: 'product_manager',
};

// Generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%';
  let password = '';

  // 8 alphanumeric chars
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Add a special char
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  // Add 2 more chars
  for (let i = 0; i < 2; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

async function createSupabaseAuthUser(email: string, password: string) {
  console.log('\n=== Creating Supabase Auth User ===');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not configured');
    return { success: false, error: 'Missing Supabase credentials' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('User already exists in Supabase Auth, updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('Failed to update password:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Password updated successfully!');
      return { success: true, userId: existingUser.id };
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: `${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`,
        role: ADMIN_USER.role,
      },
    });

    if (error) {
      console.error('Failed to create user:', error);
      return { success: false, error: error.message };
    }

    console.log('Supabase Auth user created successfully!');
    console.log('User ID:', data.user?.id);
    return { success: true, userId: data.user?.id };

  } catch (error) {
    console.error('Error creating Supabase Auth user:', error);
    return { success: false, error: String(error) };
  }
}

async function sendSMS(tempPassword: string) {
  console.log('\n=== Sending SMS ===');

  const apiKey = process.env.CLICKATELL_API_KEY;
  if (!apiKey) {
    console.error('CLICKATELL_API_KEY not configured');
    return false;
  }

  // Format phone to international
  let phone = ADMIN_USER.phone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '27' + phone.substring(1);
  }

  const smsMessage = `Hi ${ADMIN_USER.firstName}, welcome to CircleTel Admin! Login: ${ADMIN_USER.email} | Temp Password: ${tempPassword} | URL: https://www.circletel.co.za/admin/login - Please change your password after first login.`;

  console.log(`To: ${phone}`);
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
          to: phone,
          content: smsMessage,
        }]
      }),
    });

    const data = await response.json();

    if (!response.ok || data.messages?.[0]?.error) {
      console.error('SMS failed:', data);
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

async function sendEmail(tempPassword: string) {
  console.log('\n=== Sending Email ===');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

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
    .button:hover { background: #e06b0a; }
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
      <p>Hi ${ADMIN_USER.firstName},</p>

      <p>Your CircleTel Admin account has been created. You now have access to the admin portal as a <span class="role-badge">Product Manager</span>.</p>

      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #F5831F;">Your Login Credentials</h3>

        <div class="credential-item">
          <span class="credential-label">Email / Username</span>
          <span class="credential-value">${ADMIN_USER.email}</span>
        </div>

        <div class="credential-item">
          <span class="credential-label">Temporary Password</span>
          <span class="credential-value">${tempPassword}</span>
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

  const textVersion = `
Hi ${ADMIN_USER.firstName},

Your CircleTel Admin account has been created. You now have access to the admin portal as a Product Manager.

YOUR LOGIN CREDENTIALS:
- Email: ${ADMIN_USER.email}
- Temporary Password: ${tempPassword}
- Login URL: https://www.circletel.co.za/admin/login

IMPORTANT: Please change your password after your first login for security purposes.

What You Can Do as Product Manager:
- Update pricing on service packages
- Manage package configurations and features
- View and edit the product catalog
- Review product performance metrics

If you have any questions, please contact the IT team.

Best regards,
CircleTel Admin Team
  `;

  console.log(`To: ${ADMIN_USER.email}`);
  console.log(`Subject: Welcome to CircleTel Admin - Your Login Credentials`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'CircleTel Admin <noreply@notifications.circletelsa.co.za>',
        to: [ADMIN_USER.email],
        subject: `Welcome to CircleTel Admin - Your Login Credentials`,
        html: emailHtml,
        text: textVersion,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email failed:', data);
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
  console.log('Admin User Invitation: Ashwyn Watkins');
  console.log('=============================================');
  console.log(`Name: ${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`);
  console.log(`Email: ${ADMIN_USER.email}`);
  console.log(`Phone: ${ADMIN_USER.phone}`);
  console.log(`Role: ${ADMIN_USER.role}`);

  // Generate temporary password
  const tempPassword = generateTempPassword();
  console.log(`\nGenerated temporary password: ${tempPassword}`);

  // Step 1: Create Supabase Auth user
  const authResult = await createSupabaseAuthUser(ADMIN_USER.email, tempPassword);
  if (!authResult.success) {
    console.error('\n Failed to create Supabase Auth user. Aborting.');
    console.error('Error:', authResult.error);
    process.exit(1);
  }

  // Step 2: Send notifications
  const smsResult = await sendSMS(tempPassword);
  const emailResult = await sendEmail(tempPassword);

  console.log('\n=== Summary ===');
  console.log(`Supabase Auth User: ${authResult.success ? 'Created' : 'Failed'}`);
  console.log(`SMS: ${smsResult ? 'Sent' : 'Failed'}`);
  console.log(`Email: ${emailResult ? 'Sent' : 'Failed'}`);

  if (authResult.success && smsResult && emailResult) {
    console.log('\n All steps completed successfully!');
    console.log(`\nAshwyn can now login at: https://www.circletel.co.za/admin/login`);
    console.log(`Email: ${ADMIN_USER.email}`);
    console.log(`Temporary Password: ${tempPassword}`);
  } else {
    console.log('\n Some steps failed. Check logs above.');
  }
}

main().catch(console.error);
