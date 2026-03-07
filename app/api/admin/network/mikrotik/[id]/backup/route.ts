/**
 * MikroTik Router Config Backup API Route
 *
 * POST /api/admin/network/mikrotik/[id]/backup - Create config backup
 *
 * @module app/api/admin/network/mikrotik/[id]/backup/route
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
    permissions?.includes('network:mikrotik:write');

  if (!hasAccess) {
    return { error: 'Forbidden: Write access required', status: 403 };
  }

  return { userId: user.id };
}

// =============================================================================
// POST /api/admin/network/mikrotik/[id]/backup
// =============================================================================

export async function POST(
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

    const backupUrl = await MikrotikRouterService.backupConfig(id, authResult.userId);

    return NextResponse.json({
      success: true,
      data: { backup_url: backupUrl },
      message: 'Config backup created successfully',
    });
  } catch (error) {
    console.error('[API] POST /api/admin/network/mikrotik/[id]/backup failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
