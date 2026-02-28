/**
 * Direct DFA Sync Script
 * Bypasses Inngest for manual sync execution
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { dfaSyncService } from '../lib/coverage/providers/dfa/dfa-sync-service';

async function runDirectSync() {
  console.log('Starting direct DFA sync...');
  console.log('Time:', new Date().toISOString());

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create sync log entry
  const { data: syncLog, error: insertError } = await supabase
    .from('dfa_sync_logs')
    .insert({
      status: 'running',
      triggered_by: 'manual',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to create sync log:', insertError.message);
    process.exit(1);
  }

  console.log('Sync log ID:', syncLog.id);

  const startTime = Date.now();

  try {
    // Check API health first
    const health = await dfaSyncService.checkHealth();
    console.log('API Health:', health.healthy ? 'OK' : 'UNHEALTHY', `(${health.responseTime}ms)`);

    if (!health.healthy) {
      throw new Error('DFA API is unhealthy');
    }

    // Run the sync
    console.log('\nFetching buildings from DFA API...');
    const result = await dfaSyncService.sync({ dryRun: false });

    const duration = Date.now() - startTime;

    // Update sync log
    await supabase
      .from('dfa_sync_logs')
      .update({
        status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
        connected_count: result.connectedCount,
        near_net_count: result.nearNetCount,
        records_fetched: result.connectedCount + result.nearNetCount,
        records_inserted: result.recordsInserted,
        records_updated: result.recordsUpdated,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
        error_message: result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null
      })
      .eq('id', syncLog.id);

    console.log('\n=== DFA Sync Complete ===');
    console.log('Connected buildings:', result.connectedCount);
    console.log('Near-net buildings:', result.nearNetCount);
    console.log('Records inserted:', result.recordsInserted);
    console.log('Records updated:', result.recordsUpdated);
    console.log('Duration:', duration + 'ms');
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors.length);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', errorMessage);

    await supabase
      .from('dfa_sync_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        duration_ms: duration,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncLog.id);

    process.exit(1);
  }
}

runDirectSync();
