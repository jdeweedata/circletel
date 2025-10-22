/**
 * Apply Pending Migrations to Supabase via Direct PostgreSQL Connection
 * Uses pg library to execute migrations
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection string for Supabase
// Format: postgresql://postgres:[YOUR-PASSWORD]@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres
const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres.agyjovdugmtopasyvlng:Totsiens@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres';

/**
 * Execute SQL migration file
 */
async function executeMigration(client, migrationName, sqlContent) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Applying Migration: ${migrationName}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Execute the migration SQL
    await client.query(sqlContent);
    console.log('✓ Migration applied successfully');
    return { success: true };
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Error details:', error.detail || error.hint || '');
    return { success: false, error: error.message };
  }
}

/**
 * Main migration execution
 */
async function applyMigrations() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✓ Connected successfully\n');

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

    const results = [];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, '..', migration.file);

      // Check if file exists
      if (!fs.existsSync(migrationPath)) {
        console.error(`✗ Migration file not found: ${migrationPath}`);
        results.push({ name: migration.name, success: false, error: 'File not found' });
        continue;
      }

      // Read migration SQL
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');

      // Execute migration
      const result = await executeMigration(client, migration.name, sqlContent);
      results.push({ name: migration.name, ...result });

      // Wait a bit between migrations
      if (migration !== migrations[migrations.length - 1]) {
        console.log('\nWaiting 2 seconds before next migration...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60) + '\n');

    results.forEach(result => {
      const status = result.success ? '✓ SUCCESS' : '✗ FAILED';
      console.log(`${status}: ${result.name}`);
      if (!result.success && result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    // Verification queries
    console.log('\n' + '='.repeat(60));
    console.log('Verification Queries');
    console.log('='.repeat(60) + '\n');

    // Check provider_product_mappings table
    console.log('Checking provider_product_mappings table...');
    const mappingsResult = await client.query('SELECT COUNT(*) FROM provider_product_mappings');
    console.log(`✓ provider_product_mappings table exists (${mappingsResult.rows[0].count} rows)`);

    // Check MTN provider
    console.log('\nChecking MTN provider...');
    const mtnResult = await client.query(`
      SELECT id, name, provider_code, service_offerings, coverage_source
      FROM fttb_network_providers
      WHERE provider_code = 'mtn'
    `);

    if (mtnResult.rows.length > 0) {
      const mtn = mtnResult.rows[0];
      console.log('✓ MTN provider found:');
      console.log(`  - Name: ${mtn.name}`);
      console.log(`  - Code: ${mtn.provider_code}`);
      console.log(`  - Service Offerings: ${JSON.stringify(mtn.service_offerings)}`);
      console.log(`  - Coverage Source: ${mtn.coverage_source}`);
    } else {
      console.log('✗ No MTN provider found');
    }

    // Check placeholder providers
    console.log('\nChecking placeholder providers...');
    const placeholdersResult = await client.query(`
      SELECT provider_code, display_name, active
      FROM fttb_network_providers
      WHERE provider_code IN ('metrofibre', 'openserve', 'dfa', 'vumatel')
      ORDER BY provider_code
    `);

    if (placeholdersResult.rows.length > 0) {
      console.log(`✓ Found ${placeholdersResult.rows.length} placeholder providers:`);
      placeholdersResult.rows.forEach(p => {
        console.log(`  - ${p.provider_code}: ${p.display_name} (${p.active ? 'active' : 'disabled'})`);
      });
    }

    // Check MTN products
    console.log('\nChecking MTN products...');
    const productsResult = await client.query(`
      SELECT product_category, COUNT(*) as count
      FROM service_packages
      WHERE 'mtn' = ANY(compatible_providers)
      GROUP BY product_category
      ORDER BY product_category
    `);

    if (productsResult.rows.length > 0) {
      const totalProducts = productsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
      console.log(`✓ Found ${totalProducts} MTN products:`);
      productsResult.rows.forEach(row => {
        console.log(`  - ${row.product_category}: ${row.count} products`);
      });

      if (totalProducts === 13) {
        console.log('\n✓✓✓ All 13 MTN products successfully added!');
      } else {
        console.log(`\n⚠ Expected 13 MTN products, found ${totalProducts}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Process Complete!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\nFatal error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run migrations
if (require.main === module) {
  applyMigrations().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { applyMigrations };
