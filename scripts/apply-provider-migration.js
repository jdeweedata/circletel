const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection details - try direct connection
const client = new Client({
  host: 'db.agyjovdugmtopasyvlng.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '3BVHkEN4AD4sQQRz',
  ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('\nReading migration file...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251018000001_create_provider_management_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Loaded migration (${sql.length} characters)`);

    console.log('\nExecuting migration...');
    console.log('This may take 10-15 seconds...\n');

    await client.query(sql);

    console.log('✅ Migration applied successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Created Tables:');
    console.log('  ✓ provider_api_logs');
    console.log('  ✓ provider_configuration');
    console.log('');
    console.log('Enhanced Table:');
    console.log('  ✓ fttb_network_providers (added api_config, sso_config, health columns)');
    console.log('');
    console.log('Created Functions:');
    console.log('  ✓ calculate_provider_success_rate_24h()');
    console.log('  ✓ calculate_provider_avg_response_time_24h()');
    console.log('  ✓ update_provider_health_metrics()');
    console.log('');
    console.log('Inserted Data:');
    console.log('  ✓ MTN Wholesale (MNS) configuration');
    console.log('  ✓ MTN Business (WMS) configuration');
    console.log('  ✓ MTN Consumer configuration');
    console.log('  ✓ Default system configuration settings');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

applyMigration();
