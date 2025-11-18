import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * GET /api/admin/technicians/[id]
 * Returns a single technician's details
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
      console.error('Error fetching technician:', error);
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: technician,
    });
  } catch (error: any) {
    console.error('Technician fetch error:', error);
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
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email.toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.specialties !== undefined) updateData.specialties = body.specialties;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Validation for required fields if they're being updated
    if (updateData.name !== undefined && !updateData.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    if (updateData.email !== undefined && !updateData.email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email cannot be empty' },
        { status: 400 }
      );
    }

    if (updateData.phone !== undefined && !updateData.phone.trim()) {
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
      console.error('Error updating technician:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update technician',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTechnician,
      message: 'Technician updated successfully',
    });
  } catch (error: any) {
    console.error('Technician update error:', error);
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
      console.error('Error deleting technician:', error);
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
    console.error('Technician delete error:', error);
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
