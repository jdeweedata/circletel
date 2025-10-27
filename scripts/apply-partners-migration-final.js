/**
 * Apply Partners System Migration
 * Based on project's existing migration pattern
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://agyjovdugmtopasyvlng.supabase.co';
const supabaseServiceKey = 'sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG';

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 CircleTel Partners System Migration');
console.log('=' .repeat(60));
console.log('');

/**
 * Execute migration using PostgreSQL extensions directly
 */
async function applyMigration() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251027000001_create_partners_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📁 Migration file:', migrationPath);
  console.log('📊 SQL size:', migrationSQL.length, 'characters\n');

  // Since direct SQL execution via Supabase client isn't available,
  // we'll create tables using the REST API and execute the migration via Dashboard

  console.log('⚠️  Note: This migration requires manual application via Supabase Dashboard\n');
  console.log('📋 Please follow these steps:\n');
  console.log('1. Open Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new\n');
  console.log('2. Copy the migration file contents:');
  console.log('   supabase/migrations/20251027000001_create_partners_system.sql\n');
  console.log('3. Paste into SQL Editor and click "Run"\n');
  console.log('4. Verify the migration succeeded (green success message)\n');

  console.log('📦 What will be created:');
  console.log('  ✓ partners table (33 columns)');
  console.log('  ✓ partner_kyc_documents table (12 columns)');
  console.log('  ✓ partner_lead_activities table (9 columns)');
  console.log('  ✓ coverage_leads extensions (4 new columns)');
  console.log('  ✓ 13 RLS policies across all tables');
  console.log('  ✓ 10 performance indexes');
  console.log('  ✓ 2 triggers for auto-updates\n');

  console.log('🔍 Alternative: Check if migration is already applied...\n');

  try {
    // Check if partners table exists
    const { data, error } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ Partners table already exists!');
      console.log('   Migration appears to be already applied.\n');
      await verifyMigration();
      return true;
    } else if (error.code === '42P01') {
      // Table doesn't exist - need to apply migration
      console.log('❌ Partners table not found');
      console.log('   Migration needs to be applied manually (see instructions above)\n');
      return false;
    } else {
      console.log('⚠️  Error checking table:', error.message, '\n');
      return false;
    }
  } catch (err) {
    console.log('⚠️  Could not verify migration status:', err.message, '\n');
    return false;
  }
}

/**
 * Verify migration was applied correctly
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  const checks = [
    { name: 'partners table', table: 'partners' },
    { name: 'partner_kyc_documents table', table: 'partner_kyc_documents' },
    { name: 'partner_lead_activities table', table: 'partner_lead_activities' },
  ];

  for (const check of checks) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = empty result, which is fine
        console.log(`  ❌ ${check.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${check.name}`);
      }
    } catch (err) {
      console.log(`  ❌ ${check.name}: ${err.message}`);
    }
  }

  // Check for new columns in coverage_leads
  try {
    const { data, error } = await supabase
      .from('coverage_leads')
      .select('assigned_partner_id')
      .limit(1);

    if (error && error.message.includes('assigned_partner_id')) {
      console.log('  ❌ coverage_leads extensions: column not found');
    } else {
      console.log('  ✅ coverage_leads extensions');
    }
  } catch (err) {
    console.log('  ⚠️  coverage_leads extensions: could not verify');
  }

  console.log('\n📝 Next steps:');
  console.log('  1. Create Supabase Storage bucket: partner-kyc-documents');
  console.log('  2. Apply storage RLS policies (see docs/implementation/SUPABASE_STORAGE_SETUP.md)');
  console.log('  3. Test partner registration at: http://localhost:3000/partners');
  console.log('');
}

// Run the migration check
applyMigration().then(success => {
  if (success) {
    console.log('✅ Migration verification complete!\n');
  } else {
    console.log('⚠️  Please apply migration manually (see instructions above)\n');
  }
}).catch(error => {
  console.error('❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});
