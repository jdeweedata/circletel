const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
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

async function createAntonAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = 'noreply@notifications.circletelsa.co.za';

  const antonEmail = 'antong@newgenmc.co.za';
  const antonFullName = 'Anton Gibbons';
  const jeffreyEmail = 'jeffrey.de.wee@circletel.co.za';

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔍 Checking for Super Admin role template...\n');

  // Get Super Admin role template
  const { data: superAdminRole, error: roleError } = await supabase
    .from('role_templates')
    .select('id, name, description, permissions')
    .eq('id', 'super_admin')
    .single();

  if (roleError || !superAdminRole) {
    console.error('❌ Super Admin role template not found');
    process.exit(1);
  }

  console.log(`✅ Using role: ${superAdminRole.name} (${superAdminRole.id})\n`);

  // Step 1: Get existing auth user
  console.log('📝 Step 1: Looking up existing auth user...');
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Failed to list users:', listError);
    process.exit(1);
  }

  const authUser = users.find(u => u.email === antonEmail);

  if (!authUser) {
    console.error('❌ Auth user not found. This is unexpected.');
    process.exit(1);
  }

  console.log('✅ Found existing auth user:', authUser.id);

  // Generate new temporary password
  const tempPassword = generateStrongPassword(16);
  console.log('\n🔑 Generated new temporary password:', tempPassword);

  // Step 2: Update password
  console.log('\n📝 Step 2: Updating password...');
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { password: tempPassword }
  );

  if (updateError) {
    console.error('❌ Failed to update password:', updateError);
    process.exit(1);
  }

  console.log('✅ Password updated');

  // Step 3: Create or update Admin User Record
  console.log('\n📝 Step 3: Creating admin_users record...');

  // Check if admin_users record exists
  const { data: existingAdmin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  let adminUser;

  if (existingAdmin) {
    // Update existing
    console.log('Updating existing admin_users record...');
    const { data: updated, error: updateAdminError } = await supabase
      .from('admin_users')
      .update({
        full_name: antonFullName,
        role: superAdminRole.id,
        role_template_id: superAdminRole.id,
        permissions: superAdminRole.permissions || {},
        is_active: true
      })
      .eq('id', authUser.id)
      .select(`
        id,
        email,
        full_name,
        role,
        role_template_id,
        role_template:role_templates!admin_users_role_template_id_fkey(name, description)
      `)
      .single();

    if (updateAdminError) {
      console.error('❌ Failed to update admin_users record:', updateAdminError);
      process.exit(1);
    }
    adminUser = updated;
  } else {
    // Create new
    console.log('Creating new admin_users record...');
    const { data: created, error: createAdminError } = await supabase
      .from('admin_users')
      .insert({
        id: authUser.id,
        email: antonEmail,
        full_name: antonFullName,
        role: superAdminRole.id,
        role_template_id: superAdminRole.id,
        permissions: superAdminRole.permissions || {},
        custom_permissions: [],
        is_active: true
      })
      .select(`
        id,
        email,
        full_name,
        role,
        role_template_id,
        role_template:role_templates!admin_users_role_template_id_fkey(name, description)
      `)
      .single();

    if (createAdminError) {
      console.error('❌ Failed to create admin_users record:', createAdminError);
      process.exit(1);
    }
    adminUser = created;
  }

  console.log('✅ Admin user record ready');

  // Step 4: Send Welcome Email
  console.log('\n📧 Step 4: Sending credentials email...');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CircleTel Admin Portal - Login Credentials</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #F5831F 0%, #E67510 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CircleTel Admin Portal</h1>
      </div>

      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi <strong>${adminUser.full_name}</strong>,</p>

        <p style="font-size: 16px;">Your Super Admin account has been created and is ready to use! Below are your login credentials for the CircleTel Admin Portal.</p>

        <div style="background: #f8f9fa; border-left: 4px solid #F5831F; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Role:</strong> ${adminUser.role_template?.name || adminUser.role}</p>
          ${adminUser.role_template?.description ? `<p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">${adminUser.role_template.description}</p>` : ''}
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #d32f2f; font-weight: bold;">⭐ Full administrative access granted</p>
        </div>

        <h3 style="color: #F5831F; font-size: 18px; margin-top: 25px;">Your Login Credentials</h3>

        <div style="background: #fff3e0; border: 1px dashed #F5831F; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${adminUser.email}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 13px;">${tempPassword}</code></p>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #856404;">
            <strong>⚠️ Important Security Notice:</strong> Please change your password immediately after your first login. This temporary password will work until you set a new one.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.circletel.co.za/admin/login"
             style="display: inline-block; background: #F5831F; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Login to Admin Portal
          </a>
        </div>

        <h3 style="color: #F5831F; font-size: 16px; margin-top: 25px;">Getting Started</h3>
        <ol style="padding-left: 20px; font-size: 14px;">
          <li>Click the button above or visit <a href="https://www.circletel.co.za/admin/login" style="color: #F5831F;">https://www.circletel.co.za/admin/login</a></li>
          <li>Log in using your email and the temporary password above</li>
          <li>You'll be prompted to change your password - choose a strong, unique password</li>
          <li>Explore the admin dashboard and familiarize yourself with your permissions</li>
        </ol>

        <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #b71c1c;">
            <strong>🔒 Super Admin Access:</strong> You have full administrative privileges. Please use this access responsibly and follow all security best practices.
          </p>
        </div>

        <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #014361;">
            <strong>💡 Need Help?</strong> If you encounter any issues or have questions about your role and permissions, please contact your system administrator.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">

        <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
          This is an automated message from the CircleTel Admin System.<br>
          For security reasons, please do not share your login credentials with anyone.<br>
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
      from: `CircleTel Admin <${fromEmail}>`,
      to: [antonEmail],
      cc: [jeffreyEmail],
      subject: 'CircleTel Admin Portal - Your Super Admin Credentials',
      html: emailHtml,
      reply_to: 'contactus@circletel.co.za'
    })
  });

  const responseText = await emailResponse.text();

  if (!emailResponse.ok) {
    console.error('❌ Failed to send email');
    console.error('   Status:', emailResponse.status);
    console.error('   Error:', responseText);
    console.log('\n⚠️ Account created but email failed. Credentials:');
    console.log('   Email:', antonEmail);
    console.log('   Temporary Password:', tempPassword);
    process.exit(1);
  }

  const emailData = JSON.parse(responseText);

  console.log('✅ Email sent successfully!');
  console.log('   Email ID:', emailData.id);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎉 SUPER ADMIN ACCOUNT CREATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 Account Details:');
  console.log('   User ID:', adminUser.id);
  console.log('   Full Name:', adminUser.full_name);
  console.log('   Email:', adminUser.email);
  console.log('   Role:', adminUser.role_template?.name || adminUser.role);
  console.log('\n🔐 Credentials:');
  console.log('   Temporary Password:', tempPassword);
  console.log('   Login URL: https://www.circletel.co.za/admin/login');
  console.log('\n📬 Email Recipients:');
  console.log('   To:', antonEmail);
  console.log('   CC:', jeffreyEmail);
  console.log('\n✨ Email should arrive within 10-30 seconds');
  console.log('═══════════════════════════════════════════════════════\n');
}

createAntonAdmin().catch(console.error);
