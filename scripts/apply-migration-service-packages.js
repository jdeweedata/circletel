const fs = require('fs');
const path = require('path');

// Read migration file
const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251030193000_enhance_service_packages.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Use Supabase Management API or direct connection
async function applyMigration() {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      db: {
        schema: 'public'
      }
    }
  );

  console.log('🚀 Applying service_packages enhancement migration...\n');

  try {
    // Since we can't execute DDL via Supabase JS, we'll need to apply this via Supabase Dashboard SQL Editor
    // or use psql command line tool

    console.log('⚠️  This migration needs to be applied via Supabase Dashboard SQL Editor');
    console.log('📋 Migration file location:', sqlPath);
    console.log('\n📝 Steps to apply:');
    console.log('   1. Go to https://app.supabase.com/project/agyjovdugmtopasyvlng/sql');
    console.log('   2. Open the SQL Editor');
    console.log('   3. Copy the contents of:', sqlPath);
    console.log('   4. Paste into SQL Editor');
    console.log('   5. Click "Run"');
    console.log('\nOr run this command:');
    console.log(`   psql "${process.env.DB_URL || 'DB_URL_NOT_SET'}" < "${sqlPath}"`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();
