/**
 * MikroTik Router Config Backup API Route
 *
 * POST /api/admin/network/mikrotik/[id]/backup - Create config backup
 *
 * @module app/api/admin/network/mikrotik/[id]/backup/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';

// =============================================================================
// POST /api/admin/network/mikrotik/[id]/backup
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

    const backupUrl = await MikrotikRouterService.backupConfig(id, user.id);

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
