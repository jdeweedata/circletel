/**
 * Simple Schema Checker for Business Quotes
 * Uses direct SQL queries to check what exists
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Checking existing business quotes schema...\n');

async function checkTables() {
  const tables = [
    'business_quotes',
    'business_quote_items',
    'business_quote_versions',
    'business_quote_signatures',
    'business_quote_terms'
  ];

  console.log('TABLES:');
  const existingTables = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(0);

      if (!error) {
        existingTables.push(table);
        console.log(`  ✅ ${table} - EXISTS`);
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - NOT FOUND`);
    }
  }

  return existingTables;
}

async function generateDropScript(existingTables) {
  if (existingTables.length === 0) {
    console.log('\n✅ No existing tables found. Safe to run full migration.');
    return null;
  }

  console.log(`\n⚠️  Found ${existingTables.length} existing table(s).`);
  console.log('\nGenerating DROP script to clean up before migration...\n');

  let dropScript = `-- Clean up existing business quotes schema
-- Run this FIRST, then run the full migration

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS business_quote_signatures CASCADE;
DROP TABLE IF EXISTS business_quote_versions CASCADE;
DROP TABLE IF EXISTS business_quote_items CASCADE;
DROP TABLE IF EXISTS business_quote_terms CASCADE;
DROP TABLE IF EXISTS business_quotes CASCADE;

-- Drop types
DROP TYPE IF EXISTS quote_item_type CASCADE;
DROP TYPE IF EXISTS quote_status CASCADE;

-- Verification query (should return empty after cleanup)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%quote%';
`;

  const dropFile = 'supabase/migrations/20251028000000_drop_business_quotes.sql';
  fs.writeFileSync(dropFile, dropScript);

  console.log(`✅ DROP script saved to: ${dropFile}`);
  console.log('\nTo start fresh:');
  console.log('1. Run the DROP script in Supabase SQL Editor');
  console.log('2. Then run the full migration script');

  return dropScript;
}

async function main() {
  const existingTables = await checkTables();
  await generateDropScript(existingTables);

  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDATION:');
  console.log('='.repeat(70));

  if (existingTables.length > 0) {
    console.log('\n⚠️  Existing tables found. Choose one option:');
    console.log('\nOption 1 (Clean Start):');
    console.log('  - Run: supabase/migrations/20251028000000_drop_business_quotes.sql');
    console.log('  - Then: supabase/migrations/20251028000001_create_business_quotes_schema.sql');
    console.log('\nOption 2 (Keep existing):');
    console.log('  - Remove the DROP TYPE statements from the migration');
    console.log('  - Only run CREATE TABLE IF NOT EXISTS statements');
  } else {
    console.log('\n✅ No conflicts. Safe to run:');
    console.log('  supabase/migrations/20251028000001_create_business_quotes_schema.sql');
  }

  console.log('');
}

main().catch(console.error);
