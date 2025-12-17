/**
 * Admin Technician Detail API
 * GET - Get single technician
 * PUT - Update technician
 * DELETE - Deactivate technician
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getTechnicianById, updateTechnician } from '@/lib/services/technician-service';
import { UpdateTechnicianInput } from '@/lib/types/technician-tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const technician = await getTechnicianById(id);
    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    return NextResponse.json(technician);
  } catch (error) {
    console.error('[Admin Technician API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const body: UpdateTechnicianInput = await request.json();
    const technician = await updateTechnician(id, body);

    return NextResponse.json(technician);
  } catch (error) {
    console.error('[Admin Technician API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Soft delete - set is_active to false
    const technician = await updateTechnician(id, { is_active: false, status: 'inactive' });

    return NextResponse.json({ success: true, technician });
  } catch (error) {
    console.error('[Admin Technician API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
