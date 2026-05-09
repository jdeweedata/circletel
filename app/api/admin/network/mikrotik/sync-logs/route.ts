/**
 * MikroTik Router Sync Logs API Route
 *
 * GET /api/admin/network/mikrotik/sync-logs - Get sync history
 *
 * @module app/api/admin/network/mikrotik/sync-logs/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';

// =============================================================================
// GET /api/admin/network/mikrotik/sync-logs
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const logs = await MikrotikRouterService.getSyncLogs(limit);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total: logs.length,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/admin/network/mikrotik/sync-logs failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
