import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

/**
 * GET /api/admin/coverage-leads/[id]
 * Get a single coverage lead by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const { data: lead, error } = await supabase
      .from('coverage_leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Coverage lead not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching coverage lead', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error: any) {
    apiLogger.error('Error in GET /api/admin/coverage-leads/[id]', { error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/coverage-leads/[id]
 * Update a coverage lead
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const updates = await request.json();

    const { data: lead, error } = await supabase
      .from('coverage_leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Error updating coverage lead', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error: any) {
    apiLogger.error('Error in PATCH /api/admin/coverage-leads/[id]', { error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/coverage-leads/[id]
 * Delete a coverage lead
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const { error } = await supabase
      .from('coverage_leads')
      .delete()
      .eq('id', id);

    if (error) {
      apiLogger.error('Error deleting coverage lead', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coverage lead deleted successfully',
    });
  } catch (error: any) {
    apiLogger.error('Error in DELETE /api/admin/coverage-leads/[id]', { error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
