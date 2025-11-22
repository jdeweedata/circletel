/**
 * Resend approval email to Jarryd Jackson
 * Generates new temporary password and sends welcome email
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function generateStrongPassword(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function resendApprovalEmail() {
  console.log('🔄 Resending approval email to Jarryd Jackson...\n');

  try {
    const userId = '74363853-54cf-4bff-bccf-3020417f4e5d';
    const userEmail = 'jarrydj@intelliview.co.za';

    // 1. Get user details from database
    console.log('1. Fetching user details...');
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select(`
        *,
        role_template:role_templates!admin_users_role_template_id_fkey(*)
      `)
      .eq('id', userId)
      .single();

    if (fetchError || !adminUser) {
      console.error('   ❌ Error fetching user:', fetchError);
      throw new Error('User not found');
    }

    console.log('   ✅ User found:', adminUser.full_name);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role_template_id);
    console.log('   Role Name:', adminUser.role_template?.name);

    // 2. Generate new temporary password
    console.log('\n2. Generating new temporary password...');
    const tempPassword = generateStrongPassword(16);
    console.log('   ✅ Password generated (length: 16 characters)');

    // 3. Update user's password in Supabase Auth
    console.log('\n3. Updating password in Supabase Auth...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: tempPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('   ❌ Error updating password:', updateError);
      throw updateError;
    }
    console.log('   ✅ Password updated successfully');

    // 4. Send approval email
    console.log('\n4. Sending approval email...');

    // Use fetch to call our API endpoint that sends emails
    const emailResponse = await fetch(`${supabaseUrl.replace('.supabase.co', '')}/api/admin/send-approval-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: adminUser.full_name,
        email: adminUser.email,
        role: adminUser.role_template_id,
        roleName: adminUser.role_template?.name,
        tempPassword: tempPassword,
        loginUrl: 'https://www.circletel.co.za/admin/login',
        notes: 'Your password has been reset. This is a resend of your approval email.',
      })
    });

    // Since we don't have the API endpoint, let's send directly
    console.log('   📧 Sending email via Resend API...');

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error('   ⚠️  RESEND_API_KEY not found, cannot send email');
      console.log('\n📋 EMAIL DETAILS (Manual send required):');
      console.log('   To:', adminUser.email);
      console.log('   Subject: ✅ Your CircleTel Admin Access Has Been Approved!');
      console.log('   Temp Password:', tempPassword);
      console.log('   Login URL: https://www.circletel.co.za/admin/login');
      return;
    }

    // Import the email sending function
    const { sendAdminApprovalEmail } = require('../lib/emails/templates/admin-templates');

    const emailResult = await sendAdminApprovalEmail({
      fullName: adminUser.full_name,
      email: adminUser.email,
      role: adminUser.role_template_id,
      roleName: adminUser.role_template?.name,
      tempPassword: tempPassword,
      loginUrl: 'https://www.circletel.co.za/admin/login',
      notes: 'Your password has been reset. This is a resend of your approval email.',
    });

    if (!emailResult.success) {
      console.error('   ❌ Failed to send email:', emailResult.error);
      throw new Error(emailResult.error);
    }

    console.log('   ✅ Email sent successfully!');
    console.log('   Email ID:', emailResult.emailId);

    // 5. Log the action
    console.log('\n5. Logging action...');
    await supabase.from('admin_audit_logs').insert({
      user_id: userId,
      action: 'RESEND_APPROVAL_EMAIL',
      entity_type: 'admin_users',
      entity_id: userId,
      changes: {
        email_resent_to: adminUser.email,
        reason: 'Manual resend - original email not received',
      },
      timestamp: new Date().toISOString(),
    });
    console.log('   ✅ Action logged');

    console.log('\n✅ SUCCESS!');
    console.log('\n📧 Email Details:');
    console.log('   Sent to:', adminUser.email);
    console.log('   Recipient:', adminUser.full_name);
    console.log('   Role:', adminUser.role_template?.name);
    console.log('   Login URL: https://www.circletel.co.za/admin/login');
    console.log('\n⚠️  IMPORTANT: The temporary password is:', tempPassword);
    console.log('   (Share this securely with Jarryd)');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

resendApprovalEmail();
