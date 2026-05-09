/**
 * MikroTik Router Management API Routes
 *
 * GET  /api/admin/network/mikrotik - List all routers
 * POST /api/admin/network/mikrotik - Create a new router
 *
 * @module app/api/admin/network/mikrotik/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { MikrotikRouterService } from '@/lib/mikrotik';
import type { MikrotikRouterCreate, MikrotikRouterFilters } from '@/lib/types/mikrotik';

// =============================================================================
// GET /api/admin/network/mikrotik
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
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
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;

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

    const router = await MikrotikRouterService.createRouter(body, user.id);

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
