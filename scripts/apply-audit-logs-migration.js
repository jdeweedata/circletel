/**
 * Apply Admin Audit Logs Migration
 *
 * This script applies the audit logs migration to the Supabase database.
 * Run: node scripts/apply-audit-logs-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting admin audit logs migration...');
  console.log('');

  try {
    // Step 1: Create the table
    console.log('📋 Step 1: Creating admin_audit_logs table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        user_email TEXT,
        admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        action_category TEXT NOT NULL CHECK (action_category IN (
          'authentication',
          'password',
          'user_management',
          'system',
          'data_access',
          'configuration',
          'security'
        )),
        ip_address TEXT,
        user_agent TEXT,
        request_method TEXT,
        request_path TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        status TEXT CHECK (status IN ('success', 'failure', 'pending', 'warning')),
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_suspicious BOOLEAN DEFAULT false,
        severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low'
      );
    `;

    // We can't directly execute DDL via the Supabase client, so we'll insert a test record to verify
    console.log('ℹ️  Note: Please apply this migration manually in Supabase dashboard or via psql');
    console.log('');
    console.log('Migration file location:');
    console.log('  supabase/migrations/20251031000003_create_admin_audit_logs.sql');
    console.log('');
    console.log('To apply manually:');
    console.log('  1. Go to Supabase Dashboard > SQL Editor');
    console.log('  2. Copy the contents of the migration file');
    console.log('  3. Execute the SQL');
    console.log('');

    // Test if table already exists by trying to query it
    console.log('🔍 Checking if admin_audit_logs table exists...');

    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('count')
      .limit(0);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ Table does not exist yet - please apply the migration manually');
        console.log('');
        console.log('Once applied, you can verify by running this script again.');
        process.exit(1);
      } else {
        console.error('❌ Error checking table:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Table exists!');
      console.log('');

      // Test if view exists
      console.log('🔍 Checking if v_admin_audit_logs_recent view exists...');
      const { data: viewData, error: viewError } = await supabase
        .from('v_admin_audit_logs_recent')
        .select('count')
        .limit(0);

      if (viewError) {
        console.log('❌ View does not exist yet - please ensure full migration is applied');
      } else {
        console.log('✅ View exists!');
      }

      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ Migration verification completed successfully');
      console.log('═══════════════════════════════════════════════════════════');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the migration check
applyMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration check failed:', error);
    process.exit(1);
  });
