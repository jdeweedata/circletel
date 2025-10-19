import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251018000001_create_provider_management_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration to Supabase...');
    console.log('Migration size:', migrationSQL.length, 'characters');

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('exec_sql RPC not available, trying direct SQL execution...');

      // Split by statement and execute individually
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        const { error: execError } = await supabase.rpc('exec', {
          sql: stmt
        });

        if (execError) {
          console.error('Error executing statement:', execError);
          throw execError;
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Created:');
    console.log('  - provider_api_logs table');
    console.log('  - provider_configuration table');
    console.log('  - Enhanced fttb_network_providers with api_config, sso_config, health columns');
    console.log('  - Helper functions for health monitoring');
    console.log('  - RLS policies');
    console.log('');
    console.log('Inserted:');
    console.log('  - MTN Wholesale (MNS) provider configuration');
    console.log('  - MTN Business (WMS) provider configuration');
    console.log('  - MTN Consumer provider configuration');
    console.log('  - Default system configuration settings');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
