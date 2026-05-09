/**
 * MikroTik Router Reboot API Route
 *
 * POST /api/admin/network/mikrotik/[id]/reboot - Reboot router
 *
 * @module app/api/admin/network/mikrotik/[id]/reboot/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';

// =============================================================================
// POST /api/admin/network/mikrotik/[id]/reboot
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
    const { user } = authResult;

    const result = await MikrotikRouterService.rebootRouter(id, user.id);

    return NextResponse.json({
      success: true,
      message: result.message || 'Reboot command sent successfully',
    });
  } catch (error) {
    console.error('[API] POST /api/admin/network/mikrotik/[id]/reboot failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
