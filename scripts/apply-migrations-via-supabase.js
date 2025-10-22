/**
 * Apply Pending Migrations via Supabase Client Library
 * Executes SQL using Supabase JS client with service role key
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

/**
 * Split SQL into individual statements (handles DO blocks)
 */
function splitSQL(sql) {
  // Remove comments
  let cleaned = sql.replace(/--.*$/gm, '');

  // Split by semicolons, but preserve DO blocks
  const statements = [];
  let current = '';
  let inDoBlock = false;
  let dollarQuoteCount = 0;

  const lines = cleaned.split('\n');

  for (const line of lines) {
    current += line + '\n';

    // Check for DO blocks
    if (line.trim().match(/^DO\s+\$\$/i)) {
      inDoBlock = true;
      dollarQuoteCount = 1;
    }

    // Count $$ pairs
    const dollarSigns = (line.match(/\$\$/g) || []).length;
    if (inDoBlock && dollarSigns > 0) {
      dollarQuoteCount += dollarSigns;
      if (dollarQuoteCount >= 2) {
        inDoBlock = false;
        dollarQuoteCount = 0;
      }
    }

    // Check for statement end
    if (!inDoBlock && line.trim().endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0);
}

/**
 * Execute SQL statements one by one
 */
async function executeSQL(sql) {
  // For complex migrations, we need to use the SQL RPC endpoint
  const statements = splitSQL(sql);

  console.log(`Executing ${statements.length} SQL statements...`);

  const results = [];
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      // Try using a custom RPC if available, otherwise use direct query
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // If exec_sql doesn't exist, try alternative approach
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('  Note: exec_sql RPC not available, trying alternative method...');

          // For table operations, we can use the REST API
          // But complex DDL requires PostgreSQL direct connection
          throw new Error('Complex migrations require direct PostgreSQL connection or Supabase Dashboard');
        }
        throw error;
      }

      results.push({ success: true, statement: preview });
      console.log('  ✓ Success');
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      results.push({ success: false, statement: preview, error: error.message });

      // Continue with other statements (some errors are OK in idempotent migrations)
      if (!error.message.includes('already exists') &&
          !error.message.includes('does not exist') &&
          !error.message.includes('duplicate key')) {
        throw error;
      }
    }
  }

  return results;
}

/**
 * Main migration execution
 */
async function applyMigrations() {
  console.log('Starting Migration Process via Supabase Client...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using Service Role Key for admin access\n');

  console.log('⚠️  Note: This script requires either:');
  console.log('   1. A custom exec_sql() PostgreSQL function in Supabase');
  console.log('   2. Direct PostgreSQL connection with password');
  console.log('   3. Supabase Dashboard SQL Editor (recommended)\n');

  console.log('Attempting to execute migrations...\n');

  // Migration files to apply
  const migrations = [
    {
      name: '20251021000006_cleanup_and_migrate',
      file: 'supabase/migrations/20251021000006_cleanup_and_migrate.sql'
    },
    {
      name: '20251021000007_add_mtn_products',
      file: 'supabase/migrations/20251021000007_add_mtn_products.sql'
    }
  ];

  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, '..', migration.file);

    console.log(`${'='.repeat(60)}`);
    console.log(`Migration: ${migration.name}`);
    console.log(`${'='.repeat(60)}\n`);

    // Check if file exists
    if (!fs.existsSync(migrationPath)) {
      console.error(`✗ Migration file not found: ${migrationPath}\n`);
      continue;
    }

    // Read migration SQL
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    try {
      const results = await executeSQL(sqlContent);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(`\n✓ Migration completed: ${successCount} successful, ${failCount} errors\n`);
    } catch (error) {
      console.error(`\n✗ Migration failed: ${error.message}\n`);
      console.error('Please use Supabase Dashboard SQL Editor to apply migrations manually.\n');
      throw error;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Migration Process Complete!');
  console.log('='.repeat(60) + '\n');
}

// Run migrations
if (require.main === module) {
  applyMigrations().catch(error => {
    console.error('\n' + '='.repeat(60));
    console.error('MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error('\nRecommended approach:');
    console.error('1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql');
    console.error('2. Copy contents of: supabase/migrations/20251021000006_cleanup_and_migrate.sql');
    console.error('3. Paste and run in SQL Editor');
    console.error('4. Repeat for: supabase/migrations/20251021000007_add_mtn_products.sql\n');
    process.exit(1);
  });
}

module.exports = { applyMigrations };
