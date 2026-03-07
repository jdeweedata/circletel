/**
 * MikroTik Router Management API Routes
 *
 * GET  /api/admin/network/mikrotik - List all routers
 * POST /api/admin/network/mikrotik - Create a new router
 *
 * @module app/api/admin/network/mikrotik/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { MikrotikRouterService } from '@/lib/mikrotik';
import type { MikrotikRouterCreate, MikrotikRouterFilters } from '@/lib/types/mikrotik';

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

  // Use service role client to bypass RLS for admin_users lookup
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

  // Check for network permissions or Super Admin role
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
// GET /api/admin/network/mikrotik
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithSession();
    const authResult = await verifyNetworkAdmin(supabase);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters: MikrotikRouterFilters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as 'online' | 'offline' | 'unknown') || undefined,
      province: searchParams.get('province') || undefined,
      clinic_audit_id: searchParams.get('clinic_audit_id') || undefined,
    };

    const result = await MikrotikRouterService.listRouters(filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/network/mikrotik failed', error);

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
// POST /api/admin/network/mikrotik
// =============================================================================

export async function POST(request: NextRequest) {
  try {
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

    const body: MikrotikRouterCreate = await request.json();

    // Validate required fields
    const requiredFields = ['identity', 'mac_address', 'management_ip', 'pppoe_username', 'pppoe_password', 'router_password'];
    for (const field of requiredFields) {
      if (!body[field as keyof MikrotikRouterCreate]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(body.management_ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    const router = await MikrotikRouterService.createRouter(body, authResult.userId);

    return NextResponse.json({
      success: true,
      data: router,
    });
  } catch (error) {
    console.error('[API] POST /api/admin/network/mikrotik failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
