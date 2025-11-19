const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production.local' });

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Connected to Supabase');
  console.log('Applying migration: fix_pending_admin_users_role_constraint');

  try {
    // Drop the outdated check constraint
    console.log('\n1. Dropping outdated check constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE pending_admin_users DROP CONSTRAINT IF EXISTS pending_admin_users_requested_role_check;'
    });

    if (dropError) {
      console.error('Error dropping constraint:', dropError);
      // Continue anyway in case the constraint doesn't exist
    } else {
      console.log('   ✓ Constraint dropped successfully');
    }

    // Add foreign key constraint
    console.log('\n2. Adding foreign key constraint...');
    const { error: fkError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE pending_admin_users
            ADD CONSTRAINT pending_admin_users_requested_role_template_fkey
            FOREIGN KEY (requested_role_template_id)
            REFERENCES role_templates(id);`
    });

    if (fkError) {
      // Check if constraint already exists
      if (fkError.message && fkError.message.includes('already exists')) {
        console.log('   ✓ Foreign key constraint already exists');
      } else {
        console.error('Error adding foreign key:', fkError);
        throw fkError;
      }
    } else {
      console.log('   ✓ Foreign key constraint added successfully');
    }

    // Add index
    console.log('\n3. Adding index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_pending_admin_users_requested_role_template
            ON pending_admin_users(requested_role_template_id);`
    });

    if (indexError) {
      console.error('Error adding index:', indexError);
      // Continue anyway
    } else {
      console.log('   ✓ Index created successfully');
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\nYou can now submit admin access requests with any role template.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
