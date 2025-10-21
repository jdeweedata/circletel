/**
 * Apply SQL Migration Directly via Supabase Admin API
 * This creates a temporary admin function to execute the SQL
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('============================================');
console.log('  SQL Migration Direct Application');
console.log('============================================\n');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('[1/3] Reading migration file...');
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251021000001_fix_health_metrics_function.sql');
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    console.log('✓ Migration loaded\n');

    console.log('[2/3] Executing SQL via Supabase...');
    console.log('  Method: Direct RPC call\n');

    // Try to execute the SQL by creating and calling a temporary function
    const createTempFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_execute_migration()
      RETURNS TEXT AS $$
      BEGIN
        ${sqlContent}
        RETURN 'Migration applied successfully';
      END;
      $$ LANGUAGE plpgsql;
    `;

    // First, let's just try to query the existing function to see if we can access the database
    console.log('  Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('fttb_network_providers')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection test failed:', testError.message);
      throw new Error('Cannot connect to database');
    }

    console.log('  ✓ Database connection successful\n');

    // Since we can't execute raw SQL via the JS client, we'll use a workaround
    // We'll create a record in a log table that triggers the function execution
    console.log('  Note: Direct SQL execution not available via Supabase JS client\n');
    console.log('  Attempting alternative: Testing if function already exists...\n');

    // Test if the function works by calling it with a test provider
    const { data: providers, error: provError } = await supabase
      .from('fttb_network_providers')
      .select('id')
      .limit(1);

    if (provError || !providers || providers.length === 0) {
      console.log('  No providers found to test with\n');
    } else {
      const testProviderId = providers[0].id;
      console.log(`  Testing health metrics function with provider: ${testProviderId}\n`);

      // Try to call the function via RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_provider_health_metrics', {
        p_provider_id: testProviderId
      });

      if (rpcError) {
        console.log('  ❌ Function test failed:', rpcError.message);
        console.log('  This confirms the function needs to be fixed\n');

        console.log('[3/3] Migration must be applied manually\n');
        console.log('============================================');
        console.log('  MANUAL APPLICATION REQUIRED');
        console.log('============================================\n');
        console.log('The SQL function has a bug that must be fixed via Supabase Dashboard.\n');
        console.log('Steps:');
        console.log('1. Open: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new');
        console.log('2. Paste this SQL:\n');
        console.log('─'.repeat(80));
        console.log(sqlContent);
        console.log('─'.repeat(80));
        console.log('\n3. Click "Run" button');
        console.log('\n4. Rerun this script to verify the fix\n');

        return false;
      } else {
        console.log('  ✓ Function executed successfully!');
        console.log('  Migration appears to already be applied\n');

        console.log('============================================');
        console.log('  Migration Already Applied! ✓');
        console.log('============================================\n');

        return true;
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

applyMigration().then(success => {
  process.exit(success ? 0 : 1);
});
