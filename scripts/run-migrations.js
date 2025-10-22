/**
 * Apply Pending Migrations to Supabase
 * Direct PostgreSQL connection with credentials
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection configuration
// Alternative: use connection string format
const connectionString = `postgresql://postgres:3BVHkEN4AD4sQQRz@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres`;

const config = {
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
};

/**
 * Execute SQL migration file
 */
async function executeMigration(client, migrationName, sqlContent) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  Applying Migration: ${migrationName}`);
  console.log(`${'='.repeat(70)}\n`);

  try {
    // Execute the migration SQL
    await client.query(sqlContent);
    console.log('✓ Migration applied successfully\n');
    return { success: true };
  } catch (error) {
    console.error('✗ Migration failed:',error.message);
    if (error.detail) console.error('  Detail:', error.detail);
    if (error.hint) console.error('  Hint:', error.hint);
    console.log();
    return { success: false, error: error.message };
  }
}

/**
 * Main migration execution
 */
async function applyMigrations() {
  const client = new Client(config);

  try {
    console.log('\n' + '='.repeat(70));
    console.log('  CircleTel Multi-Provider Migration');
    console.log('='.repeat(70) + '\n');

    console.log('Connecting to Supabase PostgreSQL...');
    console.log(`Host: ${config.host}`);
    console.log(`Database: ${config.database}\n`);

    await client.connect();
    console.log('✓ Connected successfully\n');

    // Migration files to apply
    const migrations = [
      {
        name: '20251021000006_cleanup_and_migrate',
        file: 'supabase/migrations/20251021000006_cleanup_and_migrate.sql',
        description: 'Multi-Provider Architecture Setup'
      },
      {
        name: '20251021000007_add_mtn_products',
        file: 'supabase/migrations/20251021000007_add_mtn_products.sql',
        description: 'Add 13 MTN Products'
      }
    ];

    const results = [];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, '..', migration.file);

      console.log(`📄 ${migration.description}`);
      console.log(`   File: ${migration.file}`);

      // Check if file exists
      if (!fs.existsSync(migrationPath)) {
        console.error(`\n✗ Migration file not found: ${migrationPath}\n`);
        results.push({ name: migration.name, success: false, error: 'File not found' });
        continue;
      }

      // Read migration SQL
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

      // Execute migration
      const result = await executeMigration(client, migration.name, sqlContent);
      results.push({ name: migration.name, description: migration.description, ...result });

      // Wait a bit between migrations
      if (migration !== migrations[migrations.length - 1]) {
        console.log('Waiting 2 seconds before next migration...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Summary
    console.log('='.repeat(70));
    console.log('  Migration Summary');
    console.log('='.repeat(70) + '\n');

    results.forEach(result => {
      const status = result.success ? '✓ SUCCESS' : '✗ FAILED';
      console.log(`${status}: ${result.description}`);
      if (!result.success && result.error) {
        console.log(`         Error: ${result.error}`);
      }
    });

    // Only run verification if all migrations succeeded
    const allSuccess = results.every(r => r.success);
    if (!allSuccess) {
      console.log('\n⚠️  Some migrations failed. Skipping verification.\n');
      return;
    }

    // Verification queries
    console.log('\n' + '='.repeat(70));
    console.log('  Verification');
    console.log('='.repeat(70) + '\n');

    // Check provider_product_mappings table
    console.log('1. Checking provider_product_mappings table...');
    const mappingsResult = await client.query('SELECT COUNT(*) FROM provider_product_mappings');
    console.log(`   ✓ Table exists (${mappingsResult.rows[0].count} rows)\n`);

    // Check MTN provider
    console.log('2. Checking MTN provider...');
    const mtnResult = await client.query(`
      SELECT id, name, provider_code, service_offerings, coverage_source
      FROM fttb_network_providers
      WHERE provider_code = 'mtn'
    `);

    if (mtnResult.rows.length > 0) {
      const mtn = mtnResult.rows[0];
      console.log('   ✓ MTN provider configured:');
      console.log(`      - Name: ${mtn.name}`);
      console.log(`      - Code: ${mtn.provider_code}`);
      console.log(`      - Services: ${JSON.stringify(mtn.service_offerings)}`);
      console.log(`      - Source: ${mtn.coverage_source}\n`);
    } else {
      console.log('   ✗ No MTN provider found\n');
    }

    // Check placeholder providers
    console.log('3. Checking placeholder providers...');
    const placeholdersResult = await client.query(`
      SELECT provider_code, display_name, active
      FROM fttb_network_providers
      WHERE provider_code IN ('metrofibre', 'openserve', 'dfa', 'vumatel')
      ORDER BY provider_code
    `);

    if (placeholdersResult.rows.length > 0) {
      console.log(`   ✓ Found ${placeholdersResult.rows.length} placeholder providers:`);
      placeholdersResult.rows.forEach(p => {
        const status = p.active ? 'enabled' : 'disabled';
        console.log(`      - ${p.provider_code.padEnd(12)}: ${p.display_name.padEnd(20)} [${status}]`);
      });
      console.log();
    }

    // Check MTN products
    console.log('4. Checking MTN products...');
    const productsResult = await client.query(`
      SELECT product_category, COUNT(*) as count
      FROM service_packages
      WHERE 'mtn' = ANY(compatible_providers)
      GROUP BY product_category
      ORDER BY product_category
    `);

    if (productsResult.rows.length > 0) {
      const totalProducts = productsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
      console.log(`   ✓ Found ${totalProducts} MTN products:`);
      productsResult.rows.forEach(row => {
        console.log(`      - ${row.product_category.padEnd(25)}: ${row.count} products`);
      });

      if (totalProducts === 13) {
        console.log(`\n   ✓✓✓ All 13 MTN products successfully added!\n`);
      } else {
        console.log(`\n   ⚠️  Expected 13 MTN products, found ${totalProducts}\n`);
      }
    } else {
      console.log('   ✗ No MTN products found\n');
    }

    // Check views
    console.log('5. Checking database views...');
    const viewsResult = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE viewname IN ('v_active_providers', 'v_products_with_providers')
      ORDER BY viewname
    `);

    if (viewsResult.rows.length > 0) {
      console.log(`   ✓ Found ${viewsResult.rows.length} views:`);
      viewsResult.rows.forEach(view => {
        console.log(`      - ${view.viewname}`);
      });
      console.log();
    }

    console.log('='.repeat(70));
    console.log('  🎉 Migration Process Complete!');
    console.log('='.repeat(70) + '\n');

    console.log('Next Steps:');
    console.log('  1. Test coverage checker at /coverage');
    console.log('  2. Verify admin providers page at /admin/coverage/providers');
    console.log('  3. Check products page for MTN offerings\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('  ❌ FATAL ERROR');
    console.error('='.repeat(70));
    console.error('\nError:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error();
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed.\n');
  }
}

// Run migrations
if (require.main === module) {
  applyMigrations().catch(error => {
    process.exit(1);
  });
}

module.exports = { applyMigrations };
