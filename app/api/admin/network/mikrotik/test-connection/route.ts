/**
 * MikroTik Router Connection Test API Route
 *
 * POST /api/admin/network/mikrotik/test-connection - Test router connectivity
 *
 * @module app/api/admin/network/mikrotik/test-connection/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { MikrotikRouterService } from '@/lib/mikrotik';

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

  return { userId: user.id };
}

// =============================================================================
// POST /api/admin/network/mikrotik/test-connection
// =============================================================================

interface TestConnectionBody {
  ip: string;
  username?: string;
  password?: string;
}

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

    const body: TestConnectionBody = await request.json();

    if (!body.ip) {
      return NextResponse.json(
        { success: false, error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(body.ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    const result = await MikrotikRouterService.testConnection(
      body.ip,
      body.username || 'thinkadmin',
      body.password || ''
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] POST /api/admin/network/mikrotik/test-connection failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
