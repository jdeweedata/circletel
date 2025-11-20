/**
 * Apply the admin_users role constraint fix to production
 * This removes the outdated CHECK constraint that only allowed 4 legacy role values
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying admin_users role constraint fix...\n');

  try {
    // Drop the constraint
    console.log('1. Dropping admin_users_role_check constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;'
    });

    if (dropError) {
      console.error('   ❌ Error dropping constraint:', dropError);
      throw dropError;
    }
    console.log('   ✅ Constraint dropped successfully');

    // Add comment
    console.log('\n2. Adding column comment...');
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `COMMENT ON COLUMN admin_users.role IS 'Legacy role column - use role_template_id for RBAC system. This column can store any role template ID for backward compatibility.';`
    });

    if (commentError) {
      console.error('   ⚠️  Warning: Could not add comment:', commentError.message);
    } else {
      console.log('   ✅ Comment added successfully');
    }

    // Verify existing users
    console.log('\n3. Verifying existing admin users...');
    const { data, error: queryError } = await supabase
      .from('admin_users')
      .select('id, email, role, role_template_id')
      .neq('role', null)
      .neq('role_template_id', null);

    if (queryError) {
      console.error('   ⚠️  Warning: Could not verify users:', queryError.message);
    } else {
      const mismatched = data.filter(u => u.role !== u.role_template_id);
      if (mismatched.length > 0) {
        console.log(`   ⚠️  Found ${mismatched.length} users with mismatched role and role_template_id:`);
        mismatched.forEach(u => {
          console.log(`      - ${u.email}: role='${u.role}', role_template_id='${u.role_template_id}'`);
        });
      } else {
        console.log(`   ✅ All ${data.length} admin users have matching role and role_template_id`);
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\nYou can now approve admin access requests with any role template.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
