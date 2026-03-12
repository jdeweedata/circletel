/**
 * Zoho Books Retry All Failed Entities Endpoint
 *
 * Resets all failed entities to pending and triggers a full sync
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoBooksSyncOrchestrator } from '@/lib/integrations/zoho/books-sync-orchestrator';

export async function POST() {
  try {
    const supabase = await createClient();

    // Count failed entities before
    const { count: beforeCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: beforeInvoices } = await supabase
      .from('customer_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: beforePayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const processed = (beforeCustomers || 0) + (beforeInvoices || 0) + (beforePayments || 0);

    if (processed === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed entities to retry',
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    }

    // Reset all failed to pending
    await supabase
      .from('customers')
      .update({ zoho_sync_status: 'pending' })
      .eq('zoho_sync_status', 'failed');

    await supabase
      .from('customer_invoices')
      .update({ zoho_sync_status: 'pending' })
      .eq('zoho_sync_status', 'failed');

    await supabase
      .from('payment_transactions')
      .update({ zoho_sync_status: 'pending' })
      .eq('zoho_sync_status', 'failed');

    // Run full sync
    const orchestrator = new ZohoBooksSyncOrchestrator();
    await orchestrator.runFullSync();

    // Count still failed after
    const { count: afterCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: afterInvoices } = await supabase
      .from('customer_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const { count: afterPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed');

    const failed = (afterCustomers || 0) + (afterInvoices || 0) + (afterPayments || 0);
    const succeeded = processed - failed;

    return NextResponse.json({
      success: true,
      message: `Retry completed: ${succeeded} succeeded, ${failed} still failing`,
      processed,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error('[ZohoBooks/RetryAll] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Retry all failed',
        processed: 0,
        succeeded: 0,
        failed: 0,
      },
      { status: 500 }
    );
  }
}
