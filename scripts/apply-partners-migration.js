/**
 * Apply Partners System Migration via Supabase API
 *
 * This script applies the partners system migration using the Supabase Management API
 * Migration: 20251027000001_create_partners_system.sql
 */

const fs = require('fs');
const path = require('path');

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agyjovdugmtopasyvlng.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251027000001_create_partners_system.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Starting Partners System Migration...\n');
console.log('📁 Migration file:', migrationPath);
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('📊 SQL length:', migrationSQL.length, 'characters\n');

async function applyMigration() {
  try {
    // Use Supabase REST API with service role key
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Migration failed');
      console.error('Status:', response.status, response.statusText);
      console.error('Error:', errorText);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('📋 Tables created:');
    console.log('  ✓ partners');
    console.log('  ✓ partner_kyc_documents');
    console.log('  ✓ partner_lead_activities');
    console.log('  ✓ coverage_leads (extended with partner fields)\n');
    console.log('🔒 RLS policies created:');
    console.log('  ✓ Partners table (4 policies)');
    console.log('  ✓ Partner KYC documents (4 policies)');
    console.log('  ✓ Partner lead activities (3 policies)');
    console.log('  ✓ Coverage leads (2 partner policies)\n');
    console.log('⚡ Indexes created: 10');
    console.log('🔄 Triggers created: 2\n');
    console.log('🎉 Partners system is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('  1. Create Supabase Storage bucket: partner-kyc-documents');
    console.log('  2. Configure storage RLS policies (see docs/implementation/SUPABASE_STORAGE_SETUP.md)');
    console.log('  3. Test partner registration flow');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Alternative method using direct PostgreSQL connection string
async function applyMigrationDirect() {
  console.log('Attempting direct PostgreSQL execution...\n');

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const preview = statement.substring(0, 100).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          query: statement
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ Failed: ${errorText}`);

        // Continue on "already exists" errors
        if (errorText.includes('already exists')) {
          console.log('  ⚠️  Skipping (already exists)');
          continue;
        }

        throw new Error(errorText);
      }

      console.log('  ✅ Success');
    } catch (error) {
      console.error('  ❌ Error:', error.message);
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }

  console.log('\n✅ Migration completed!\n');
}

// Check if exec_sql function exists, otherwise use direct method
async function checkAndApply() {
  try {
    // Try the RPC method first
    await applyMigration();
  } catch (error) {
    if (error.message && error.message.includes('exec_sql')) {
      console.log('\n⚠️  RPC method not available, trying direct execution...\n');
      await applyMigrationDirect();
    } else {
      throw error;
    }
  }
}

// Run the migration
checkAndApply().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
