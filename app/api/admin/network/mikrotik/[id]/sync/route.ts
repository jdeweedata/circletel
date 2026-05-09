/**
 * MikroTik Router Sync API Route
 *
 * POST /api/admin/network/mikrotik/[id]/sync - Force sync router status
 *
 * @module app/api/admin/network/mikrotik/[id]/sync/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';

// =============================================================================
// POST /api/admin/network/mikrotik/[id]/sync
// =============================================================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await context.params;

    const router = await MikrotikRouterService.syncRouterStatus(id);

    return NextResponse.json({
      success: true,
      data: router,
      message: `Router status synced: ${router.status}`,
    });
  } catch (error) {
    console.error('[API] POST /api/admin/network/mikrotik/[id]/sync failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
