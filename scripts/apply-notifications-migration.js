/**
 * Apply Notifications Migration
 *
 * Applies the notification system migration to Supabase database
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  console.log('\n' + '='.repeat(60));
  console.log('  Apply Notifications Migration');
  console.log('='.repeat(60) + '\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251024150316_create_notifications_system.sql');
  console.log('📄 Reading migration file...');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('✓ Migration loaded\n');

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const { data, error: testError } = await supabase.from('admin_users').select('count').limit(1);
    if (testError) throw testError;
    console.log('✓ Database connection successful\n');

    // Check if tables already exist
    console.log('🔍 Checking if migration already applied...');
    const { data: existingTable, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✓ Migration already applied - notifications table exists\n');
      console.log('='.repeat(60));
      console.log('  Migration Status: Already Applied ✓');
      console.log('='.repeat(60) + '\n');
      return;
    }

    // Apply migration using RPC (if available)
    console.log('⚙️  Applying migration...');
    console.log('   Note: You may need to apply this migration manually in Supabase SQL Editor\n');

    console.log('📋 Migration SQL (copy to Supabase SQL Editor):');
    console.log('─'.repeat(60));
    console.log(sql.substring(0, 500) + '...');
    console.log('─'.repeat(60) + '\n');

    console.log('💡 To apply manually:');
    console.log('   1. Go to https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new');
    console.log('   2. Paste the SQL from: supabase/migrations/20251024150316_create_notifications_system.sql');
    console.log('   3. Click "Run"\n');

    console.log('='.repeat(60));
    console.log('  Migration Status: Manual Application Required');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

applyMigration();
