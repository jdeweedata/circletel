/**
 * Apply CMS Page Builder Migration
 * Run with: node -r dotenv/config scripts/apply-cms-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'agyjovdugmtopasyvlng';

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('CMS Page Builder Migration');
  console.log('='.repeat(60));
  console.log('');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251125000001_cms_page_builder.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Migration file:', migrationPath);
  console.log('');

  // Execute using the SQL API
  console.log('Executing migration...');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: migrationSql })
  });

  if (!response.ok) {
    console.log('Direct RPC not available, testing table access...');
  }

  // Test if tables exist by trying to query them
  console.log('\nChecking for existing CMS tables...');

  const tables = ['cms_pages', 'cms_templates', 'cms_ai_usage', 'cms_media', 'cms_page_versions'];
  const results = {};

  for (const table of tables) {
    try {
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        }
      });

      if (checkResponse.ok) {
        results[table] = '✅ EXISTS';
      } else {
        const errorData = await checkResponse.json();
        if (errorData.code === '42P01') {
          results[table] = '❌ NOT FOUND';
        } else {
          results[table] = `⚠️ ${errorData.message || 'Unknown error'}`;
        }
      }
    } catch (err) {
      results[table] = `❌ ${err.message}`;
    }
  }

  console.log('\nTable Status:');
  console.log('-'.repeat(40));
  for (const [table, status] of Object.entries(results)) {
    console.log(`  ${table.padEnd(25)} ${status}`);
  }

  const missingTables = Object.entries(results).filter(([_, status]) => status.includes('NOT FOUND'));

  if (missingTables.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('MANUAL ACTION REQUIRED');
    console.log('='.repeat(60));
    console.log('\nSome CMS tables do not exist. Please run the migration SQL');
    console.log('directly in the Supabase SQL Editor:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
    console.log('2. Copy the contents of:');
    console.log('   supabase/migrations/20251125000001_cms_page_builder.sql');
    console.log('3. Paste and run in the SQL Editor');
    console.log('');
  } else {
    console.log('\n✅ All CMS tables exist!');

    // Check if templates were seeded
    const templatesResponse = await fetch(`${supabaseUrl}/rest/v1/cms_templates?select=id,name&limit=10`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });

    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log(`\nDefault templates: ${templates.length} found`);
      templates.forEach(t => console.log(`  - ${t.name}`));
    }
  }
}

applyMigration().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
