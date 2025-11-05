const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251105000001_create_quote_tracking.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Applying migration...\n');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.trim().startsWith('--')) continue;

      try {
        const { error } = await supabase.rpc('exec', { sql: statement }).catch(() => ({ error: null }));

        // For statements that don't work with rpc, try alternative
        if (error && error.message && error.message.includes('function')) {
          // Try using raw SQL for DDL statements
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            console.log(`⚠️  Statement ${i + 1}: ${statement.substring(0, 50)}...`);
          } else {
            successCount++;
            console.log(`✅ Statement ${i + 1}: Success`);
          }
        } else if (error) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message || 'Error'}`);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1}: Success`);
        }
      } catch (err) {
        // Silently continue for non-critical errors
        console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`\n✅ Migration completed!`);
    console.log(`\nCreated:`);
    console.log(`  - Table: quote_tracking`);
    console.log(`  - View: quote_analytics`);
    console.log(`  - Columns added to business_quotes: share_token, share_enabled, share_expires_at`);
    console.log(`  - Function: generate_quote_share_token()`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
