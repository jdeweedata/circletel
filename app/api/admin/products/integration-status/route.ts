/**
 * Product Integration Status API
 * GET /api/admin/products/integration-status
 *
 * Fetches Zoho CRM sync status for service_packages.
 * Used to display sync badges and status in admin UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Optional: filter by specific product IDs
    const productIds = searchParams.get('ids')?.split(',').filter(Boolean);

    let query = supabase
      .from('product_integrations')
      .select(`
        service_package_id,
        zoho_crm_product_id,
        sync_status,
        last_synced_at,
        last_sync_error,
        retry_count,
        next_retry_at,
        last_retry_at,
        sync_error_details
      `);

    // Filter by specific IDs if provided
    if (productIds && productIds.length > 0) {
      query = query.in('service_package_id', productIds);
    }

    const { data, error } = await query;

    if (error) {
      apiLogger.error('[Integration Status API] Query failed', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch integration status' },
        { status: 500 }
      );
    }

    // Convert to map for easy lookup: { [servicePackageId]: status }
    const statusMap: Record<string, any> = {};
    (data || []).forEach((row) => {
      statusMap[row.service_package_id] = {
        zohoProductId: row.zoho_crm_product_id,
        syncStatus: row.sync_status,
        lastSyncedAt: row.last_synced_at,
        lastSyncError: row.last_sync_error,
        retryCount: row.retry_count,
        nextRetryAt: row.next_retry_at,
        lastRetryAt: row.last_retry_at,
        errorDetails: row.sync_error_details,
      };
    });

    return NextResponse.json({
      success: true,
      data: statusMap,
    });
  } catch (error: any) {
    apiLogger.error('[Integration Status API] Error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
