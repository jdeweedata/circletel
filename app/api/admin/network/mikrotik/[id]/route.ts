/**
 * Individual MikroTik Router API Routes
 *
 * GET    /api/admin/network/mikrotik/[id] - Get router details
 * PATCH  /api/admin/network/mikrotik/[id] - Update router
 * DELETE /api/admin/network/mikrotik/[id] - Delete router
 *
 * @module app/api/admin/network/mikrotik/[id]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';
import type { MikrotikRouterUpdate } from '@/lib/types/mikrotik';

// =============================================================================
// GET /api/admin/network/mikrotik/[id]
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await context.params;

    const router = await MikrotikRouterService.getRouter(id);

    if (!router) {
      return NextResponse.json(
        { success: false, error: 'Router not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: router,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/network/mikrotik/[id] failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/admin/network/mikrotik/[id]
// =============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await context.params;

    const body: MikrotikRouterUpdate = await request.json();

    // Validate IP format if provided
    if (body.management_ip) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(body.management_ip)) {
        return NextResponse.json(
          { success: false, error: 'Invalid IP address format' },
          { status: 400 }
        );
      }
    }

    const router = await MikrotikRouterService.updateRouter(id, body, authResult.adminUser.id);

    return NextResponse.json({
      success: true,
      data: router,
    });
  } catch (error) {
    console.error('[API] PATCH /api/admin/network/mikrotik/[id] failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/admin/network/mikrotik/[id]
// =============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await context.params;

    await MikrotikRouterService.deleteRouter(id, authResult.adminUser.id);

    return NextResponse.json({
      success: true,
      message: 'Router deleted successfully',
    });
  } catch (error) {
    console.error('[API] DELETE /api/admin/network/mikrotik/[id] failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
