/**
 * Admin Technicians API
 * GET - List all technicians
 * POST - Create new technician
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getTechnicians, createTechnician } from '@/lib/services/technician-service';
import { CreateTechnicianInput } from '@/lib/types/technician-tracking';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const technicians = await getTechnicians();

    return NextResponse.json(technicians);
  } catch (error) {
    apiLogger.error('[Admin Technicians API] Error', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const body: CreateTechnicianInput = await request.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.phone) {
      return NextResponse.json(
        { error: 'First name, last name, and phone are required' },
        { status: 400 }
      );
    }

    const technician = await createTechnician(body);

    return NextResponse.json(technician, { status: 201 });
  } catch (error) {
    apiLogger.error('[Admin Technicians API] Error', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
