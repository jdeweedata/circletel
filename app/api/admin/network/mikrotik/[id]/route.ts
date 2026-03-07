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
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { MikrotikRouterService } from '@/lib/mikrotik';
import type { MikrotikRouterUpdate } from '@/lib/types/mikrotik';

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
    isAdmin: roleName === 'Super Admin' || permissions?.includes('network:mikrotik:admin'),
  };
}

// =============================================================================
// GET /api/admin/network/mikrotik/[id]
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

    const router = await MikrotikRouterService.updateRouter(id, body, authResult.userId);

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
    const { id } = await context.params;

    const supabase = await createClientWithSession();
    const authResult = await verifyNetworkAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    if (!authResult.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required to delete routers' },
        { status: 403 }
      );
    }

    await MikrotikRouterService.deleteRouter(id, authResult.userId);

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
