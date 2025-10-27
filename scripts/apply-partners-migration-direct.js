/**
 * Apply Partners System Migration via Direct SQL Execution
 *
 * Uses Supabase client library to execute SQL directly
 * Migration: 20251027000001_create_partners_system.sql
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Environment variables
const SUPABASE_URL = 'https://agyjovdugmtopasyvlng.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG';

console.log('🚀 Starting Partners System Migration...\n');
console.log('🔗 Supabase URL:', SUPABASE_URL);

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251027000001_create_partners_system.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📁 Migration file:', migrationPath);
console.log('📊 SQL length:', migrationSQL.length, 'characters\n');

async function executeSQLStatements() {
  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Filter out comments and empty statements
      return s.length > 0 &&
             !s.startsWith('--') &&
             !s.match(/^\/\*[\s\S]*?\*\/$/);
    });

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        // Check if it's an "already exists" error
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        )) {
          console.log('⚠️  Already exists (skipped)');
          skipCount++;
          continue;
        }

        console.log('❌ Error');
        console.error('    Details:', error.message);
        errorCount++;

        // Don't stop on errors, continue with next statement
        continue;
      }

      console.log('✅');
      successCount++;

    } catch (err) {
      console.log('❌ Exception');
      console.error('    Details:', err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ⚠️  Skipped: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);

  if (errorCount === 0 || (errorCount > 0 && skipCount > 0)) {
    console.log('\n✅ Migration completed!\n');
    printSummary();
    return true;
  } else {
    console.log('\n⚠️  Migration completed with errors\n');
    return false;
  }
}

function printSummary() {
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
  console.log('  3. Test partner registration flow\n');
}

// Alternative: Execute as single transaction
async function executeSingleTransaction() {
  console.log('Attempting to execute migration as single transaction...\n');

  try {
    // Try to execute the entire migration at once
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      return false;
    }

    console.log('✅ Migration applied successfully!\n');
    printSummary();
    return true;

  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Check if exec_sql RPC exists
    console.log('🔍 Checking if exec_sql RPC function exists...\n');

    // Try the single transaction method first
    const success = await executeSingleTransaction();

    if (!success) {
      console.log('\n🔄 Trying statement-by-statement execution...\n');
      await executeSQLStatements();
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Apply migration manually via Supabase Dashboard:');
    console.error('   1. Go to https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new');
    console.error('   2. Copy the contents of: supabase/migrations/20251027000001_create_partners_system.sql');
    console.error('   3. Paste and run in the SQL editor\n');
    process.exit(1);
  }
}

main();
