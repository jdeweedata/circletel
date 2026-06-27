/**
 * Invite Admin User: Tumelo Manganyi (Financial Accountant)
 *
 * Creates a Supabase Auth login + matching admin_users row so Tumelo can log in
 * at /admin/login with the "accountant" RBAC role (least-privilege Finance scope).
 *
 * Idempotent: re-running updates the password + admin_users row rather than failing.
 * Does NOT send email/SMS — prints the temp password for manual relay.
 *
 * Run with:
 *   set -a && source .env.local && set +a && npx tsx scripts/invite-admin-tumelo.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const ADMIN_USER = {
  firstName: 'Tumelo',
  lastName: 'Manganyi',
  email: 'tumelom@circletel.co.za',
  role: 'accountant', // legacy role column (free text — no CHECK constraint)
  roleTemplateId: 'accountant', // FK -> role_templates(id), verified to exist
  department: 'Finance',
  jobTitle: 'Financial Accountant',
};

// Flat-shape permissions object mirroring the "accountant" role_template.permissions
// array. permission-checker.ts reads user.permissions?.["resource:action"] === true.
const PERMISSIONS: Record<string, boolean> = {
  'dashboard:view': true,
  'billing:view': true,
  'billing:manage_invoices': true,
  'billing:process_payments': true,
  'billing:export_reports': true,
  'finance:view_all': true,
  'customers:view': true,
  'orders:view': true,
  'products:view': true,
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  for (let i = 0; i < 2; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
    console.error('Run with: set -a && source .env.local && set +a && npx tsx scripts/invite-admin-tumelo.ts');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('=============================================');
  console.log('Admin User Invitation: Tumelo Manganyi');
  console.log('=============================================');
  console.log(`Name:  ${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`);
  console.log(`Email: ${ADMIN_USER.email}`);
  console.log(`Role:  ${ADMIN_USER.role} (template: ${ADMIN_USER.roleTemplateId})`);

  const tempPassword = generateTempPassword();

  // --- Step 1: Create or update the Supabase Auth user ---
  console.log('\n=== Step 1: Supabase Auth user ===');
  let userId: string | undefined;

  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === ADMIN_USER.email.toLowerCase()
  );

  if (existingUser) {
    console.log('Auth user already exists — updating password + confirming email.');
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`,
        role: ADMIN_USER.role,
      },
    });
    if (updateError) {
      console.error('Failed to update auth user:', updateError.message);
      process.exit(1);
    }
    userId = existingUser.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_USER.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`,
        role: ADMIN_USER.role,
      },
    });
    if (error || !data.user) {
      console.error('Failed to create auth user:', error?.message);
      process.exit(1);
    }
    userId = data.user.id;
  }
  console.log('Auth user ID:', userId);

  // --- Step 2: Upsert the admin_users row (id MUST equal auth.users.id for RLS) ---
  console.log('\n=== Step 2: admin_users row ===');
  const { error: upsertError } = await supabase
    .from('admin_users')
    .upsert(
      {
        id: userId,
        email: ADMIN_USER.email,
        full_name: `${ADMIN_USER.firstName} ${ADMIN_USER.lastName}`,
        role: ADMIN_USER.role,
        role_template_id: ADMIN_USER.roleTemplateId,
        department: ADMIN_USER.department,
        job_title: ADMIN_USER.jobTitle,
        permissions: PERMISSIONS,
        custom_permissions: [],
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (upsertError) {
    console.error('Failed to upsert admin_users row:', upsertError.message);
    process.exit(1);
  }

  // --- Step 3: Verify ---
  console.log('\n=== Step 3: Verify ===');
  const { data: verifyRow, error: verifyError } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, role_template_id, department, job_title, is_active, permissions')
    .eq('id', userId)
    .single();

  if (verifyError || !verifyRow) {
    console.error('Verification read failed:', verifyError?.message);
    process.exit(1);
  }
  console.log(JSON.stringify(verifyRow, null, 2));

  console.log('\n=============================================');
  console.log('SUCCESS — relay these credentials to Tumelo:');
  console.log('=============================================');
  console.log(`Login URL: https://www.circletel.co.za/admin/login`);
  console.log(`Email:     ${ADMIN_USER.email}`);
  console.log(`Password:  ${tempPassword}`);
  console.log('\n(He should change his password after first login.)');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
