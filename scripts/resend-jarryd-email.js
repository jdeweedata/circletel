/**
 * Resend approval email to Jarryd Jackson with new temporary password
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateStrongPassword(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function resendEmail() {
  console.log('🔄 Resending approval email to Jarryd Jackson...\n');

  try {
    const userId = '74363853-54cf-4bff-bccf-3020417f4e5d';

    // 1. Get user details
    console.log('1. Fetching user details from database...');
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, role_template_id')
      .eq('id', userId)
      .single();

    if (fetchError || !adminUser) {
      console.error('   ❌ Error:', fetchError?.message || 'User not found');
      process.exit(1);
    }

    console.log('   ✅ Found:', adminUser.full_name, `(${adminUser.email})`);
    console.log('   Role Template ID:', adminUser.role_template_id);

    // Get role template details
    const { data: roleTemplate } = await supabase
      .from('role_templates')
      .select('name, description')
      .eq('id', adminUser.role_template_id)
      .single();

    console.log('   Role Name:', roleTemplate?.name || 'Unknown');

    // 2. Generate new password
    console.log('\n2. Generating new temporary password...');
    const tempPassword = generateStrongPassword(16);
    console.log('   ✅ Generated:', tempPassword);

    // 3. Update password in Supabase Auth
    console.log('\n3. Updating password in Supabase Auth...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: tempPassword, email_confirm: true }
    );

    if (updateError) {
      console.error('   ❌ Error updating password:', updateError.message);
      process.exit(1);
    }
    console.log('   ✅ Password updated successfully');

    // 4. Send email via Resend API
    console.log('\n4. Sending email via Resend...');

    if (!resendApiKey) {
      console.log('   ⚠️  No RESEND_API_KEY found');
      console.log('\n📧 EMAIL DETAILS TO SEND MANUALLY:');
      console.log('   To:', adminUser.email);
      console.log('   Subject: ✅ Your CircleTel Admin Access Has Been Approved!');
      console.log('   Temp Password:', tempPassword);
      console.log('   Login: https://www.circletel.co.za/admin/login');
      process.exit(0);
    }

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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to CircleTel Admin! ✅</h1>
    </div>
    <div class="content">
      <h2>Hi ${adminUser.full_name},</h2>
      <p>Your request for admin access has been approved! 🎉</p>

      <div class="credentials">
        <h3>Your Login Credentials</h3>
        <p><strong>Email:</strong> ${adminUser.email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${tempPassword}</code></p>
        <p><strong>Role:</strong> ${roleTemplate?.name || adminUser.role_template_id}</p>
      </div>

      <p><strong>⚠️ Important Security Instructions:</strong></p>
      <ul>
        <li>This is a temporary password - please change it after your first login</li>
        <li>Do not share this password with anyone</li>
        <li>Keep your credentials secure</li>
      </ul>

      <p style="text-align: center;">
        <a href="https://www.circletel.co.za/admin/login" class="button">Login to Admin Panel</a>
      </p>

      <p>If you have any questions or need assistance, please contact your system administrator.</p>
    </div>
    <div class="footer">
      <p>This email was sent from CircleTel Admin System</p>
      <p>&copy; ${new Date().getFullYear()} CircleTel - Reliable Tech Solutions</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel Admin <noreply@circletel.co.za>',
        to: [adminUser.email],
        subject: '✅ Your CircleTel Admin Access Has Been Approved!',
        html: emailHtml,
      }),
    });

    const emailResult = await response.json();

    if (!response.ok) {
      console.error('   ❌ Resend API error:', emailResult);
      throw new Error(emailResult.message || 'Failed to send email');
    }

    console.log('   ✅ Email sent successfully!');
    console.log('   Email ID:', emailResult.id);

    // 5. Log the action
    await supabase.from('admin_audit_logs').insert({
      user_id: userId,
      action: 'RESEND_APPROVAL_EMAIL',
      entity_type: 'admin_users',
      entity_id: userId,
      changes: {
        email_resent_to: adminUser.email,
        reason: 'Manual resend - original email not received',
        email_id: emailResult.id,
      },
    });

    console.log('\n✅ SUCCESS!');
    console.log('\n📧 Email sent to:', adminUser.email);
    console.log('👤 Recipient:', adminUser.full_name);
    console.log('🔐 Temporary Password:', tempPassword);
    console.log('🔗 Login URL: https://www.circletel.co.za/admin/login');
    console.log('\n⚠️  Please share the temporary password securely with Jarryd');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

resendEmail();
