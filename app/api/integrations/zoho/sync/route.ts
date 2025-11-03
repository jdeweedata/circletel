// ZOHO Manual Sync API
// Trigger manual sync of quotes/contracts to ZOHO CRM

import { NextRequest, NextResponse } from 'next/server';
import { createZohoSyncService } from '@/lib/integrations/zoho/sync-service';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/integrations/zoho/sync
 * Manually trigger sync of entity to ZOHO CRM
 *
 * Body: {
 *   entityType: 'quote' | 'contract',
 *   entityId: string,
 *   forceSync?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, status')
      .eq('id', user.id)
      .eq('status', 'active')
      .single();

    if (!adminUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { entityType, entityId, forceSync } = body;

    // Validate input
    if (!entityType || !entityId) {
      return NextResponse.json(
        {
          success: false,
          error: 'entityType and entityId are required',
        },
        { status: 400 }
      );
    }

    if (!['quote', 'contract'].includes(entityType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'entityType must be "quote" or "contract"',
        },
        { status: 400 }
      );
    }

    console.log(`[ZOHO Sync API] Syncing ${entityType}:${entityId} (forceSync: ${forceSync})`);

    // Perform sync
    const syncService = createZohoSyncService();
    let result;

    if (entityType === 'quote') {
      result = await syncService.syncQuoteWithKYC(entityId, { forceSync });
    } else {
      result = await syncService.syncContractToDeal(entityId, { forceSync });
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      result: {
        zohoEntityId: result.zohoEntityId,
        zohoEntityType: result.zohoEntityType,
        syncLogId: result.syncLogId,
      },
    });
  } catch (error) {
    console.error('[ZOHO Sync API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/zoho/sync?entityType=quote&entityId=123
 * Check sync status of entity
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        {
          success: false,
          error: 'entityType and entityId are required',
        },
        { status: 400 }
      );
    }

    // Check mapping
    const { data: mapping } = await supabase
      .from('zoho_entity_mappings')
      .select('*')
      .eq('circletel_type', entityType)
      .eq('circletel_id', entityId)
      .single();

    // Get recent sync logs
    const { data: logs } = await supabase
      .from('zoho_sync_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      isSynced: !!mapping,
      mapping: mapping || null,
      recentLogs: logs || [],
    });
  } catch (error) {
    console.error('[ZOHO Sync API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check sync status',
      },
      { status: 500 }
    );
  }
}
