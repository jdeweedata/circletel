/**
 * MikroTik Router WiFi API Routes
 *
 * GET   /api/admin/network/mikrotik/[id]/wifi - Get WiFi configuration
 * PATCH /api/admin/network/mikrotik/[id]/wifi - Update WiFi password
 *
 * @module app/api/admin/network/mikrotik/[id]/wifi/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { MikrotikRouterService } from '@/lib/mikrotik';
import type { MikrotikWifiPasswordUpdate } from '@/lib/types/mikrotik';

// =============================================================================
// Auth Helper
// =============================================================================

async function verifyNetworkAdmin(
  sessionClient: Awaited<ReturnType<typeof createClientWithSession>>
) {
  const {
    data: { user },
    error: authError,
  } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const serviceClient = await createClient();
  const { data: adminUser, error: adminError } = await serviceClient
    .from('admin_users')
    .select(`
      id,
      role_template:role_templates(name, permissions)
    `)
    .eq('id', user.id)
    .single();

  if (adminError || !adminUser) {
    return { error: 'Forbidden: Admin user not found', status: 403 };
  }

  const roleTemplate = Array.isArray(adminUser.role_template)
    ? adminUser.role_template[0]
    : adminUser.role_template;

  const roleName = roleTemplate?.name;
  const permissions = roleTemplate?.permissions as string[] | undefined;

  const hasAccess =
    roleName === 'Super Admin' ||
    roleName === 'Network Administrator' ||
    permissions?.includes('network:mikrotik:read');

  if (!hasAccess) {
    return { error: 'Forbidden: Network access required', status: 403 };
  }

  return {
    userId: user.id,
    canWrite:
      roleName === 'Super Admin' ||
      roleName === 'Network Administrator' ||
      permissions?.includes('network:mikrotik:write'),
  };
}

// =============================================================================
// GET /api/admin/network/mikrotik/[id]/wifi
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClientWithSession();
    const authResult = await verifyNetworkAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

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
    const { id } = await context.params;

    const supabase = await createClientWithSession();
    const authResult = await verifyNetworkAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    if (!authResult.canWrite) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Write access required' },
        { status: 403 }
      );
    }

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

    const result = await MikrotikRouterService.updateWifiPassword(
      id,
      body,
      authResult.userId
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
