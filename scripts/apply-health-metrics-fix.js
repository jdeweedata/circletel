/**
 * Apply Health Metrics Function Fix Migration
 * Usage: node scripts/apply-health-metrics-fix.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('============================================');
console.log('  Health Metrics Function Fix Migration');
console.log('============================================\n');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read migration file
const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251021000001_fix_health_metrics_function.sql');

console.log('[1/3] Reading migration file...');
if (!fs.existsSync(migrationFile)) {
  console.error(`❌ ERROR: Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationFile, 'utf8');
console.log(`✓ Migration file loaded`);
console.log(`  File: ${path.basename(migrationFile)}\n`);

// Execute SQL migration
async function applyMigration() {
  try {
    console.log('[2/3] Executing SQL migration...');
    console.log('  Creating/replacing update_provider_health_metrics function...\n');

    // Execute the SQL directly using RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try alternative approach
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('  exec_sql RPC not available, using direct query method...\n');

        // Split SQL into individual statements and execute them
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            console.log('  Executing function creation...');

            // Use Supabase's query method
            const { error: queryError } = await supabase
              .from('_supabase')
              .select('*')
              .limit(0); // This just tests connection

            if (queryError) {
              console.error('❌ Connection test failed:', queryError.message);
              throw queryError;
            }

            console.log('\n⚠️  Direct SQL execution via Supabase JS client is limited.');
            console.log('   Please use one of these methods instead:\n');
            console.log('   Method 1: Supabase Dashboard SQL Editor');
            console.log('   -----------------------------------------');
            console.log('   1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new');
            console.log('   2. Copy the SQL from: supabase/migrations/20251021000001_fix_health_metrics_function.sql');
            console.log('   3. Click "Run" to execute\n');
            console.log('   Method 2: PostgreSQL Client (psql)');
            console.log('   -----------------------------------------');
            console.log('   Run: psql "postgresql://postgres.agyjovdugmtopasyvlng:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/20251021000001_fix_health_metrics_function.sql\n');

            console.log('   SQL to execute:');
            console.log('   ' + '='.repeat(80));
            console.log(sqlContent);
            console.log('   ' + '='.repeat(80) + '\n');

            process.exit(1);
          }
        }
      } else {
        throw error;
      }
    }

    console.log('\n============================================');
    console.log('  Migration Applied Successfully! ✓');
    console.log('============================================\n');

    return true;
  } catch (error) {
    console.error('\n❌ ERROR: Migration failed');
    console.error(`   ${error.message}`);
    if (error.hint) {
      console.error(`   Hint: ${error.hint}`);
    }
    if (error.details) {
      console.error(`   Details: ${error.details}`);
    }
    return false;
  } finally {
    console.log('[3/3] Cleanup completed\n');
  }
}

applyMigration().then(success => {
  if (!success) {
    console.log('💡 Tip: For direct database access, install PostgreSQL client tools');
    console.log('   Windows: https://www.postgresql.org/download/windows/');
    console.log('   Or use: winget install PostgreSQL.PostgreSQL\n');
  }
  process.exit(success ? 0 : 1);
});
