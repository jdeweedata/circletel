/**
 * Test ZOHO Customer Sync API
 * GET /api/test/zoho-sync/customer?customer_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  syncCustomerToZohoBilling,
  getCustomerSyncStatus,
  findCustomersNeedingSync
} from '@/lib/integrations/zoho/customer-sync-service';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const customerId = searchParams.get('customer_id');
  const action = searchParams.get('action') || 'sync';

  try {
    // Find customers needing sync
    if (action === 'find') {
      const customerIds = await findCustomersNeedingSync(10);
      return NextResponse.json({
        success: true,
        data: { customerIds, count: customerIds.length }
      });
    }

    // Get sync status
    if (action === 'status' && customerId) {
      const status = await getCustomerSyncStatus(customerId);
      return NextResponse.json({
        success: true,
        data: status
      });
    }

    // Sync customer
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customer_id is required' },
        { status: 400 }
      );
    }

    // Get customer details
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    console.log('[Test] Syncing customer:', {
      id: customer.id,
      email: customer.email,
      current_zoho_id: customer.zoho_billing_customer_id
    });

    // Perform sync
    const startTime = Date.now();
    const result = await syncCustomerToZohoBilling(customerId);
    const duration = Date.now() - startTime;

    // Get updated status
    const updatedStatus = await getCustomerSyncStatus(customerId);

    // Get sync logs
    const { data: logs } = await supabase
      .from('zoho_sync_logs')
      .select('*')
      .eq('entity_type', 'customer')
      .eq('entity_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      success: result.success,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
        },
        sync_result: result,
        sync_status: updatedStatus,
        sync_log: logs?.[0] || null,
        duration_ms: duration
      },
      error: result.error
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
