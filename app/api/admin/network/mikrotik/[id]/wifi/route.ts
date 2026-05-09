/**
 * MikroTik Router WiFi API Routes
 *
 * GET   /api/admin/network/mikrotik/[id]/wifi - Get WiFi configuration
 * PATCH /api/admin/network/mikrotik/[id]/wifi - Update WiFi password
 *
 * @module app/api/admin/network/mikrotik/[id]/wifi/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';
import type { MikrotikWifiPasswordUpdate } from '@/lib/types/mikrotik';

// =============================================================================
// GET /api/admin/network/mikrotik/[id]/wifi
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

    const wifiConfig = await MikrotikRouterService.getWifiConfig(id);

    return NextResponse.json({
      success: true,
      data: wifiConfig,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/network/mikrotik/[id]/wifi failed', error);

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
// PATCH /api/admin/network/mikrotik/[id]/wifi
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

    const body: MikrotikWifiPasswordUpdate = await request.json();

    // Validate required fields
    if (typeof body.vlan_id !== 'number') {
      return NextResponse.json(
        { success: false, error: 'vlan_id is required' },
        { status: 400 }
      );
    }

    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const { user } = authResult;

    const result = await MikrotikRouterService.updateWifiPassword(
      id,
      body,
      user.id
    );

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('[API] PATCH /api/admin/network/mikrotik/[id]/wifi failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
