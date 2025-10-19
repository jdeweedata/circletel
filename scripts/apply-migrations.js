#!/usr/bin/env node
/**
 * Apply Supabase Migrations Script
 * Applies pending migrations to the CircleTel database
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection using service role JWT as password
// The password format for Supabase is the service_role JWT token
const SERVICE_ROLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjA2ODQzNiwiZXhwIjoyMDU3NjQ0NDM2fQ.c32hg_G2Tu9Y84Pf6r34BADW4DiDIFld0B-stmqNk-4';
const DB_URL = `postgresql://postgres.agyjovdugmtopasyvlng:${SERVICE_ROLE_JWT}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

const MIGRATIONS = [
  {
    name: 'RBAC System',
    file: 'supabase/migrations/20250201000005_create_rbac_system.sql',
    description: 'Creates role templates and RBAC permission system'
  },
  {
    name: 'Provider Management Enhancement',
    file: 'supabase/migrations/20251019000001_enhance_provider_management_system.sql',
    description: 'Adds provider health monitoring and API logging'
  }
];

async function applyMigration(pool, migration) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Applying: ${migration.name}`);
  console.log(`📄 File: ${migration.file}`);
  console.log(`📝 Description: ${migration.description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Read migration file
    const sqlPath = path.join(__dirname, '..', migration.file);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📖 Read ${sql.length} characters from ${migration.file}`);
    console.log(`⏳ Executing migration...`);

    // Execute migration
    const startTime = Date.now();
    await pool.query(sql);
    const duration = Date.now() - startTime;

    console.log(`✅ Migration applied successfully in ${duration}ms`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying migration: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    return false;
  }
}

async function verifyMigration(pool, migrationName) {
  console.log(`\n🔍 Verifying ${migrationName}...`);

  try {
    if (migrationName === 'RBAC System') {
      // Check role_templates table
      const roleCount = await pool.query('SELECT COUNT(*) FROM role_templates');
      console.log(`  ✓ role_templates table: ${roleCount.rows[0].count} roles`);

      // Check admin_users columns
      const columns = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'admin_users'
        AND column_name IN ('role_template_id', 'custom_permissions', 'department', 'job_title')
      `);
      console.log(`  ✓ admin_users RBAC columns: ${columns.rows.length}/4`);

      // Test permission function
      await pool.query("SELECT get_user_permissions('00000000-0000-0000-0000-000000000000'::uuid)");
      console.log(`  ✓ get_user_permissions() function works`);
    } else if (migrationName === 'Provider Management Enhancement') {
      // Check provider_api_logs table
      const apiLogCount = await pool.query('SELECT COUNT(*) FROM provider_api_logs');
      console.log(`  ✓ provider_api_logs table: ${apiLogCount.rows[0].count} logs`);

      // Check fttb_network_providers columns
      const columns = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers'
        AND column_name IN ('last_health_check', 'health_status', 'success_rate_24h', 'avg_response_time_24h', 'sso_config', 'priority')
      `);
      console.log(`  ✓ fttb_network_providers health columns: ${columns.rows.length}/6`);

      // Check MTN providers
      const mtnProviders = await pool.query(`
        SELECT name, display_name, priority
        FROM fttb_network_providers
        WHERE name IN ('mtn_wholesale', 'mtn_business_wms', 'mtn_consumer')
      `);
      console.log(`  ✓ MTN providers configured: ${mtnProviders.rows.length}/3`);
    }

    console.log(`✅ ${migrationName} verification passed\n`);
    return true;
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       CircleTel Supabase Migration Application            ║
║                                                            ║
║  Applying 2 critical migrations:                          ║
║  1. RBAC System (Role Templates & Permissions)            ║
║  2. Provider Management Enhancement                       ║
╚════════════════════════════════════════════════════════════╝
`);

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const versionResult = await pool.query('SELECT version()');
    console.log(`✅ Connected to: ${versionResult.rows[0].version.split(',')[0]}\n`);

    let successCount = 0;
    let failCount = 0;

    // Apply each migration
    for (const migration of MIGRATIONS) {
      const success = await applyMigration(pool, migration);
      if (success) {
        successCount++;
        await verifyMigration(pool, migration.name);
      } else {
        failCount++;
        console.log(`⚠️  Skipping verification for failed migration\n`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Migration Summary`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Successful: ${successCount}/${MIGRATIONS.length}`);
    console.log(`❌ Failed: ${failCount}/${MIGRATIONS.length}`);
    console.log(`${'='.repeat(60)}\n`);

    if (successCount === MIGRATIONS.length) {
      console.log(`🎉 All migrations applied successfully!`);
      console.log(`\n📋 Next steps:`);
      console.log(`  1. Test RBAC features in admin dashboard`);
      console.log(`  2. Test provider management UI at /admin/coverage/providers`);
      console.log(`  3. Verify MTN configs are loaded from database`);
      console.log(`  4. Run coverage checks to populate provider_api_logs\n`);
      process.exit(0);
    } else {
      console.log(`⚠️  Some migrations failed. Please review errors above.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
