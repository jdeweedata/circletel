import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging/logger';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * GET /api/admin/technicians/[id]
 * Returns a single technician's details
 * Maps new schema to old format for backwards compatibility
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Technician ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: technician, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !technician) {
      apiLogger.error('Error fetching technician', { error });
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    // Map to include backwards-compatible fields
    const mappedTechnician = {
      ...technician,
      name: `${technician.first_name} ${technician.last_name}`.trim(),
      specialties: technician.skills || [],
      total_installations: 0,
      completed_installations: 0,
      average_rating: null,
      notes: null,
    };

    return NextResponse.json({
      success: true,
      data: mappedTechnician,
    });
  } catch (error: any) {
    apiLogger.error('Technician fetch error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/technicians/[id]
 * Updates an existing technician
 * Accepts both old format (name, specialties) and new format (first_name, last_name, skills)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Technician ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    const body = await request.json();

    // Get current technician to verify it exists
    const { data: existingTechnician, error: fetchError } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTechnician) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    // Build update object - only update provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle old format 'name' field - split into first_name/last_name
    if (body.name !== undefined) {
      const nameParts = body.name.trim().split(' ');
      updateData.first_name = nameParts[0] || '';
      updateData.last_name = nameParts.slice(1).join(' ') || '';
    }

    // Handle new format fields
    if (body.first_name !== undefined) updateData.first_name = body.first_name;
    if (body.last_name !== undefined) updateData.last_name = body.last_name;
    if (body.email !== undefined) updateData.email = body.email?.toLowerCase() || null;
    if (body.phone !== undefined) updateData.phone = body.phone;

    // Handle skills/specialties (map old to new)
    if (body.specialties !== undefined) updateData.skills = body.specialties;
    if (body.skills !== undefined) updateData.skills = body.skills;

    // Handle new schema fields
    if (body.team !== undefined) updateData.team = body.team;
    if (body.employee_id !== undefined) updateData.employee_id = body.employee_id;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Validation for required fields if they're being updated
    if (updateData.first_name !== undefined && !(updateData.first_name as string).trim()) {
      return NextResponse.json(
        { success: false, error: 'First name cannot be empty' },
        { status: 400 }
      );
    }

    if (updateData.phone !== undefined && !(updateData.phone as string).trim()) {
      return NextResponse.json(
        { success: false, error: 'Phone cannot be empty' },
        { status: 400 }
      );
    }

    const { data: updatedTechnician, error: updateError } = await supabase
      .from('technicians')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      apiLogger.error('Error updating technician', { error: updateError });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update technician',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Map response to include backwards-compatible fields
    const mappedTechnician = {
      ...updatedTechnician,
      name: `${updatedTechnician.first_name} ${updatedTechnician.last_name}`.trim(),
      specialties: updatedTechnician.skills || [],
    };

    return NextResponse.json({
      success: true,
      data: mappedTechnician,
      message: 'Technician updated successfully',
    });
  } catch (error: any) {
    apiLogger.error('Technician update error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/technicians/[id]
 * Soft deletes a technician (sets is_active to false)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Technician ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Soft delete - set is_active to false instead of actually deleting
    const { data: updatedTechnician, error } = await supabase
      .from('technicians')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Error deleting technician', { error });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete technician',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTechnician,
      message: 'Technician deactivated successfully',
    });
  } catch (error: any) {
    apiLogger.error('Technician delete error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
