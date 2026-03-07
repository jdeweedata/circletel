/**
 * MikroTik Router Sync Logs API Route
 *
 * GET /api/admin/network/mikrotik/sync-logs - Get sync history
 *
 * @module app/api/admin/network/mikrotik/sync-logs/route
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
// GET /api/admin/network/mikrotik/sync-logs
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
