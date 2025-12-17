/**
 * Admin Field Operations API
 * GET - Get all technicians and jobs for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getAdminFieldOpsData } from '@/lib/services/technician-service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const data = await getAdminFieldOpsData();

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Admin Field Ops API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
