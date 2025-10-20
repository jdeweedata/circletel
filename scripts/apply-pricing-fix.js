#!/usr/bin/env node

/**
 * Apply SkyFibre Pricing Fix Migration
 *
 * This script connects directly to the Supabase PostgreSQL database
 * and executes the pricing fix migration.
 *
 * Migration: supabase/migrations/20250120000001_fix_skyfibre_pricing.sql
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Read database password from environment
require('dotenv').config({ path: '.env.local' });

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const PROJECT_REF = 'agyjovdugmtopasyvlng';

if (!DB_PASSWORD) {
  console.error('❌ Error: SUPABASE_DB_PASSWORD not found in .env.local');
  process.exit(1);
}

// Direct connection string (for migrations)
const connectionString = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:5432/postgres`;

async function applyMigration() {
  console.log('🔷 CircleTel - SkyFibre Pricing Fix Migration');
  console.log('================================================\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250120000001_fix_skyfibre_pricing.sql');
    console.log('📄 Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Execute migration
    console.log('⚙️  Executing migration...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const result = await client.query(migrationSQL);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Migration executed successfully!\n');

    // Verify results
    console.log('🔍 Verifying migration results...\n');

    const verifyQuery = `
      SELECT
        COUNT(*) FILTER (WHERE active = true) as active_count,
        COUNT(*) FILTER (WHERE active = false) as inactive_count
      FROM service_packages
      WHERE service_type = 'SkyFibre'
    `;

    const verifyResult = await client.query(verifyQuery);
    const { active_count, inactive_count } = verifyResult.rows[0];

    console.log('📊 SkyFibre Products Summary:');
    console.log(`   Active products:   ${active_count}`);
    console.log(`   Inactive products: ${inactive_count}\n`);

    if (active_count === '7' && inactive_count === '4') {
      console.log('✅ Verification PASSED - Expected 7 active, 4 inactive products\n');
    } else {
      console.log('⚠️  Verification WARNING - Expected 7 active and 4 inactive products\n');
    }

    // Display active products
    console.log('📋 Active SkyFibre Products:\n');
    const productsQuery = `
      SELECT name, price, speed_down, speed_up
      FROM service_packages
      WHERE service_type = 'SkyFibre' AND active = true
      ORDER BY
        CASE WHEN name LIKE '%SME%' THEN 2 ELSE 1 END,
        price
    `;

    const products = await client.query(productsQuery);

    console.log('┌────────────────────────────────────┬─────────┬────────────┐');
    console.log('│ Product Name                       │ Price   │ Speed      │');
    console.log('├────────────────────────────────────┼─────────┼────────────┤');

    products.rows.forEach(p => {
      const name = p.name.padEnd(34);
      const price = `R${p.price}`.padEnd(7);
      const speed = `${p.speed_down}/${p.speed_up}Mbps`.padEnd(10);
      console.log(`│ ${name} │ ${price} │ ${speed} │`);
    });

    console.log('└────────────────────────────────────┴─────────┴────────────┘\n');

    console.log('✅ MIGRATION COMPLETE!\n');
    console.log('📌 Next Steps:');
    console.log('   1. Test coverage API: npm run test:coverage');
    console.log('   2. Verify on staging: https://circletel-staging.vercel.app');
    console.log('   3. Check browser: Enter test address and verify pricing\n');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('\nError details:');
    console.error(error.message);

    if (error.code) {
      console.error(`\nError code: ${error.code}`);
    }

    if (error.detail) {
      console.error(`\nDetail: ${error.detail}`);
    }

    console.error('\n📚 Troubleshooting:');
    console.error('   - Check database password in .env.local');
    console.error('   - Verify network connection to Supabase');
    console.error('   - Review migration SQL for syntax errors');
    console.error('   - Check Supabase logs in dashboard\n');

    process.exit(1);
  } finally {
    await client.end();
    console.log('📡 Database connection closed\n');
  }
}

// Run migration
applyMigration();
