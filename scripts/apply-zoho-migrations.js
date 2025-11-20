/**
 * Apply ZOHO Billing Integration Migrations
 *
 * Applies all 4 ZOHO Billing database migrations to production
 * Usage: node scripts/apply-zoho-migrations.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migrations = [
  '20250120000010_add_zoho_billing_fields_to_customers.sql',
  '20250120000011_add_zoho_billing_fields_to_customer_services.sql',
  '20250120000012_add_zoho_billing_fields_to_customer_invoices.sql',
  '20250120000013_add_zoho_billing_fields_to_payment_transactions.sql'
];

async function applyMigrations() {
  console.log('\n=== Applying ZOHO Billing Migrations ===\n');

  for (const migrationFile of migrations) {
    try {
      console.log(`\n📄 Applying: ${migrationFile}`);

      // Read migration file
      const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);
      const sql = readFileSync(migrationPath, 'utf-8');

      // Execute migration
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        // Try direct execution if RPC doesn't exist
        console.log('   RPC not available, trying direct execution...');

        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            const { error: execError } = await supabase.rpc('exec_sql', {
              sql_query: statement + ';'
            });

            if (execError) {
              console.error('   ❌ Error:', execError.message);
              // Continue with next statement (some errors like "already exists" are okay)
              if (!execError.message.includes('already exists')) {
                throw execError;
              } else {
                console.log('   ⚠️  Already exists, skipping...');
              }
            }
          }
        }
      }

      console.log('   ✅ Applied successfully');

      // Record migration in schema_migrations table
      const migrationName = migrationFile.replace('.sql', '');
      const { error: recordError } = await supabase
        .from('schema_migrations')
        .upsert({
          version: migrationName,
          statements: [sql],
          applied_at: new Date().toISOString()
        }, {
          onConflict: 'version'
        });

      if (recordError && !recordError.message.includes('does not exist')) {
        console.log('   ⚠️  Could not record migration:', recordError.message);
      }

    } catch (error) {
      console.error(`\n❌ Failed to apply ${migrationFile}`);
      console.error('   Error:', error.message);

      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('   ⚠️  Some changes already applied, continuing...');
      } else {
        console.error('\n❌ Migration failed. Stopping.');
        process.exit(1);
      }
    }
  }

  console.log('\n=== All Migrations Applied Successfully ===\n');
}

// Alternative: Manual SQL execution
async function applyMigrationsManual() {
  console.log('\n=== Manual Migration Application ===');
  console.log('If RPC method fails, copy these SQL statements to Supabase SQL Editor:\n');

  for (const migrationFile of migrations) {
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log(`\n--- ${migrationFile} ---`);
    console.log(sql);
    console.log(`\n--- End of ${migrationFile} ---\n`);
  }
}

// Run migrations
const mode = process.argv[2];

if (mode === '--manual') {
  applyMigrationsManual();
} else {
  applyMigrations()
    .then(() => {
      console.log('\n💡 If migrations failed, run with --manual flag to get SQL for manual execution');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal Error:', error);
      console.log('\n💡 Run with --manual flag to get SQL for manual execution');
      process.exit(1);
    });
}
