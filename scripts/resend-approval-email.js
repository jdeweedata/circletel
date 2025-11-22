const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production.local' });
const crypto = require('crypto');

function generateStrongPassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function resendApprovalEmail() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const email = 'jdewee@live.com';

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Looking up user:', email);

  // Get admin user info
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select(`
      id,
      email,
      full_name,
      role,
      role_template_id,
      role_template:role_templates!admin_users_role_template_id_fkey(name)
    `)
    .eq('email', email)
    .single();

  if (adminError || !adminUser) {
    console.error('User not found:', adminError);
    process.exit(1);
  }

  console.log('Found user:', adminUser.full_name);
  console.log('Role:', adminUser.role_template?.name || adminUser.role);

  // Generate new temporary password
  const tempPassword = generateStrongPassword(16);
  console.log('\nGenerated new temporary password:', tempPassword);

  // Update password in Supabase Auth
  console.log('\nUpdating password in Supabase Auth...');
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    { password: tempPassword }
  );

  if (updateError) {
    console.error('Failed to update password:', updateError);
    process.exit(1);
  }

  console.log('Password updated successfully');

  // Send email
  console.log('\nSending approval email...');

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
        <p style="font-size: 16px;">Hi <strong>${adminUser.full_name}</strong>,</p>

        <p style="font-size: 16px;">Great news! Your request for admin access has been approved. 🎉</p>

        <div style="background: #f8f9fa; border-left: 4px solid #F5831F; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Role Assigned:</strong> ${adminUser.role_template?.name || adminUser.role}</p>
        </div>

        <h3 style="color: #F5831F; font-size: 18px; margin-top: 25px;">Your Login Credentials</h3>

        <div style="background: #fff3e0; border: 1px dashed #F5831F; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${adminUser.email}</p>
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

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`
    },
    body: JSON.stringify({
      from: 'CircleTel Admin <noreply@circletel.co.za>',
      to: [adminUser.email],
      subject: '✅ Your CircleTel Admin Access Has Been Approved!',
      html: emailHtml
    })
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error('Failed to send email:', errorText);
    process.exit(1);
  }

  const emailData = await emailResponse.json();
  console.log('\n✅ Email sent successfully!');
  console.log('Email ID:', emailData.id);
  console.log('\nRecipient:', adminUser.email);
  console.log('Temporary Password:', tempPassword);
  console.log('\nThe user can now login at: https://www.circletel.co.za/admin/login');
}

resendApprovalEmail().catch(console.error);
