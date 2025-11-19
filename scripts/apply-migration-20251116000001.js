/**
 * Script to apply migration: 20251116000001_enhance_product_integrations_tracking
 *
 * Usage: node scripts/apply-migration-20251116000001.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Applying Migration: enhance_product_integrations_tracking');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251116000001_enhance_product_integrations_tracking.sql');
  console.log(`Reading migration from: ${migrationPath}`);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(`✅ Migration file loaded (${migrationSQL.length} bytes)`);
  console.log();

  // Execute migration
  console.log('Executing migration...');
  console.log();

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('exec_sql RPC not found, trying direct query...');

      const { error: queryError } = await supabase.rpc('query', {
        query_text: migrationSQL
      });

      if (queryError) {
        console.error('❌ Migration failed:', queryError.message);
        console.error();
        console.error('Details:', queryError);
        process.exit(1);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log();
    console.log('New columns added:');
    console.log('  - zoho_crm_sync_status');
    console.log('  - zoho_crm_last_synced_at');
    console.log('  - zoho_crm_last_sync_error');
    console.log('  - zoho_billing_sync_status');
    console.log('  - zoho_billing_last_synced_at');
    console.log('  - zoho_billing_last_sync_error');
    console.log('  - zoho_billing_hardware_item_id');
    console.log('  - rate_limit_hits');
    console.log('  - last_rate_limit_at');
    console.log();
    console.log('Functions created:');
    console.log('  - record_rate_limit_hit(service_package_id, api_type, error_message)');
    console.log('  - get_sync_candidates(max_limit)');
    console.log();
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Migration failed with exception:', error.message);
    console.error();
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

applyMigration();
