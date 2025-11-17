/**
 * Script: Apply Integration Management System Migrations
 * Purpose: Manually apply migrations to Supabase database
 *
 * Usage: node scripts/apply-migrations-integration-management.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(migrationFile) {
  console.log(`\n📄 Reading migration: ${path.basename(migrationFile)}`);

  const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

  console.log(`⚙️  Applying migration (${migrationSQL.length} characters)...`);

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      console.log('⚠️  exec_sql function not found, trying direct execution...');

      // Split SQL into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        console.log(`   Executing statement ${i + 1}/${statements.length}...`);

        const { error: stmtError } = await supabase.rpc('exec', {
          query: statement + ';'
        });

        if (stmtError) {
          throw stmtError;
        }
      }
    }

    console.log(`✅ Migration applied successfully: ${path.basename(migrationFile)}`);
    return true;

  } catch (err) {
    console.error(`❌ Failed to apply migration: ${err.message}`);
    console.error('   Error details:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Integration Management System Migration\n');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Using service role key: ${supabaseServiceKey?.slice(0, 20)}...`);

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  const migrationFiles = [
    path.join(migrationsDir, '20251116120000_create_integration_management_system.sql'),
    path.join(migrationsDir, '20251116120001_migrate_zoho_tokens_to_integration_oauth.sql')
  ];

  // Verify files exist
  for (const file of migrationFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Migration file not found: ${file}`);
      process.exit(1);
    }
  }

  let success = true;

  // Apply each migration
  for (const migrationFile of migrationFiles) {
    const result = await applyMigration(migrationFile);
    if (!result) {
      success = false;
      break;
    }
  }

  if (success) {
    console.log('\n✅ All migrations applied successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Verify tables created: SELECT tablename FROM pg_tables WHERE schemaname = \'public\' AND tablename LIKE \'integration%\';');
    console.log('   2. Verify integrations seeded: SELECT * FROM integration_registry;');
    console.log('   3. Insert Zoho OAuth tokens using the INSERT statements in migration file');
    process.exit(0);
  } else {
    console.log('\n❌ Migration failed. Please review errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
