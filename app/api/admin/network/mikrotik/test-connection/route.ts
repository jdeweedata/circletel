/**
 * MikroTik Router Connection Test API Route
 *
 * POST /api/admin/network/mikrotik/test-connection - Test router connectivity
 *
 * @module app/api/admin/network/mikrotik/test-connection/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';

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
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
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
