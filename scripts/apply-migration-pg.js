/**
 * Apply SQL Migration using PostgreSQL Client
 * Usage: node scripts/apply-migration-pg.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

console.log('============================================');
console.log('  SQL Migration Application (pg Client)');
console.log('============================================\n');

if (!DB_PASSWORD) {
  console.error('❌ ERROR: SUPABASE_DB_PASSWORD not found in .env.local');
  process.exit(1);
}

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

// PostgreSQL connection configuration
const connectionConfig = {
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,  // Use port 5432 instead of 6543
  database: 'postgres',
  user: 'postgres.agyjovdugmtopasyvlng',
  password: DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  query_timeout: 30000
};

async function applyMigration() {
  const client = new Client(connectionConfig);

  try {
    console.log('[2/3] Connecting to database...');
    console.log(`  Host: ${connectionConfig.host}:${connectionConfig.port}`);
    console.log(`  Database: ${connectionConfig.database}`);
    console.log(`  User: ${connectionConfig.user}\n`);

    await client.connect();
    console.log('✓ Connected successfully\n');

    console.log('[3/3] Executing SQL migration...');
    console.log('  Creating/replacing update_provider_health_metrics function...\n');

    const result = await client.query(sqlContent);

    console.log('✅ SQL executed successfully\n');

    console.log('============================================');
    console.log('  Migration Applied Successfully! ✓');
    console.log('============================================\n');

    if (result.rows && result.rows.length > 0) {
      console.log('Result:');
      console.log(JSON.stringify(result.rows, null, 2));
    }

    console.log('Function update_provider_health_metrics has been recreated');
    console.log('with fixed variable naming (v_health_status)\n');

    return true;
  } catch (error) {
    console.error('\n❌ ERROR: Migration failed\n');
    console.error('Error message:', error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    if (error.detail) {
      console.error('Details:', error.detail);
    }

    if (error.hint) {
      console.error('Hint:', error.hint);
    }

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    return false;
  } finally {
    await client.end();
    console.log('Database connection closed\n');
  }
}

applyMigration().then(success => {
  if (success) {
    console.log('✨ Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Run tests: node scripts/comprehensive-mtn-integration-test.ts\n');
  }
  process.exit(success ? 0 : 1);
});
