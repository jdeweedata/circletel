/**
 * Apply Pending Migrations to Supabase
 * Applies the multi-provider architecture and MTN products migrations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://agyjovdugmtopasyvlng.supabase.co';
const supabaseServiceKey = 'sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Execute SQL migration file
 */
async function executeMigration(migrationName, sqlContent) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Applying Migration: ${migrationName}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Use the Supabase REST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✓ Migration applied successfully');
    if (result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    return { success: true, result };
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Execute SQL using PostgreSQL REST API
 */
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('SQL execution error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration execution
 */
async function applyMigrations() {
  console.log('Starting Migration Process...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using Service Role Key for admin access\n');

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
    const result = await executeMigration(migration.name, sqlContent);
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
  const { data: mappingsCount } = await supabase
    .from('provider_product_mappings')
    .select('*', { count: 'exact', head: true });
  console.log(`✓ provider_product_mappings table exists`);

  // Check MTN provider
  console.log('\nChecking MTN provider...');
  const { data: mtnProvider, error: mtnError } = await supabase
    .from('fttb_network_providers')
    .select('id, name, provider_code, service_offerings, coverage_source')
    .eq('provider_code', 'mtn')
    .single();

  if (mtnError) {
    console.error('✗ Error fetching MTN provider:', mtnError.message);
  } else if (mtnProvider) {
    console.log('✓ MTN provider found:');
    console.log(`  - Name: ${mtnProvider.name}`);
    console.log(`  - Code: ${mtnProvider.provider_code}`);
    console.log(`  - Service Offerings: ${JSON.stringify(mtnProvider.service_offerings)}`);
    console.log(`  - Coverage Source: ${mtnProvider.coverage_source}`);
  }

  // Check placeholder providers
  console.log('\nChecking placeholder providers...');
  const { data: placeholders } = await supabase
    .from('fttb_network_providers')
    .select('provider_code, display_name, active')
    .in('provider_code', ['metrofibre', 'openserve', 'dfa', 'vumatel']);

  if (placeholders && placeholders.length > 0) {
    console.log(`✓ Found ${placeholders.length} placeholder providers:`);
    placeholders.forEach(p => {
      console.log(`  - ${p.provider_code}: ${p.display_name} (${p.active ? 'active' : 'disabled'})`);
    });
  }

  // Check MTN products
  console.log('\nChecking MTN products...');
  const { data: mtnProducts } = await supabase
    .from('service_packages')
    .select('product_category, name')
    .contains('compatible_providers', ['mtn']);

  if (mtnProducts && mtnProducts.length > 0) {
    console.log(`✓ Found ${mtnProducts.length} MTN products`);

    // Group by category
    const categories = {};
    mtnProducts.forEach(p => {
      if (!categories[p.product_category]) {
        categories[p.product_category] = [];
      }
      categories[p.product_category].push(p.name);
    });

    Object.keys(categories).forEach(category => {
      console.log(`  - ${category}: ${categories[category].length} products`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Migration Process Complete!');
  console.log('='.repeat(60) + '\n');
}

// Run migrations
applyMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
