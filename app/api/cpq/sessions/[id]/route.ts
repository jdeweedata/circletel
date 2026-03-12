/**
 * CPQ Session API - Single Session Operations
 *
 * GET /api/cpq/sessions/[id] - Get session by ID
 * PUT /api/cpq/sessions/[id] - Update session
 * DELETE /api/cpq/sessions/[id] - Cancel session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { CPQSession, UpdateSessionRequest } from '@/lib/cpq/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Use session client for auth (reads cookies)
    const supabaseSession = await createClientWithSession();
    const {
      data: { user },
      error: authError,
    } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = await createClient();

    // Get session
    const { data: session, error } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check ownership (database uses owner_id)
    if (session.owner_id !== user.id) {
      // Check if user is a super_admin who can view all
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!adminUser || !['super_admin', 'service_delivery_manager', 'director', 'sales_manager'].includes(adminUser.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      session: session as CPQSession,
    });
  } catch (error) {
    console.error('[cpq-sessions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Use session client for auth (reads cookies)
    const supabaseSession = await createClientWithSession();
    const {
      data: { user },
      error: authError,
    } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = await createClient();

    const body: UpdateSessionRequest = await request.json();

    // Get existing session
    const { data: existingSession, error: fetchError } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check ownership (database uses owner_id)
    if (existingSession.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if session can be modified
    if (['converted', 'expired', 'cancelled'].includes(existingSession.status)) {
      return NextResponse.json(
        { error: 'Session cannot be modified in its current status' },
        { status: 400 }
      );
    }

    // Build update object - database uses step_data JSONB
    const updateData: Record<string, unknown> = {};
    const existingStepData = existingSession.step_data || {};

    if (body.current_step !== undefined) {
      updateData.current_step = body.current_step;
    }

    // Merge step data fields
    const newStepData = { ...existingStepData };
    let stepDataChanged = false;

    if (body.needs_assessment) {
      newStepData.needs_assessment = {
        ...existingStepData.needs_assessment,
        ...body.needs_assessment,
      };
      stepDataChanged = true;
    }

    if (body.location_coverage) {
      newStepData.location_coverage = {
        ...existingStepData.location_coverage,
        ...body.location_coverage,
      };
      stepDataChanged = true;
    }

    if (body.package_selection) {
      newStepData.package_selection = {
        ...existingStepData.package_selection,
        ...body.package_selection,
      };
      stepDataChanged = true;
    }

    if (body.configuration) {
      newStepData.configuration = {
        ...existingStepData.configuration,
        ...body.configuration,
      };
      stepDataChanged = true;
    }

    if (body.pricing_discounts) {
      newStepData.pricing_discounts = {
        ...existingStepData.pricing_discounts,
        ...body.pricing_discounts,
      };
      stepDataChanged = true;
      // Also update the total_discount_percent column
      if (body.pricing_discounts.total_discount_percent !== undefined) {
        updateData.total_discount_percent = body.pricing_discounts.total_discount_percent;
      }
    }

    if (body.customer_details) {
      newStepData.customer_details = {
        ...existingStepData.customer_details,
        ...body.customer_details,
      };
      stepDataChanged = true;
    }

    if (body.review_summary) {
      newStepData.review_summary = {
        ...existingStepData.review_summary,
        ...body.review_summary,
      };
      stepDataChanged = true;
    }

    if (stepDataChanged) {
      updateData.step_data = newStepData;
    }

    if (body.ai_chat_history !== undefined) {
      updateData.ai_chat_history = body.ai_chat_history;
    }

    if (body.ai_recommendations !== undefined) {
      updateData.ai_recommendations = body.ai_recommendations;
    }

    // Update status based on progress
    if (body.current_step !== undefined && body.current_step > 1) {
      updateData.status = 'in_progress';
    }

    // Perform update
    const { data: updatedSession, error: updateError } = await supabase
      .from('cpq_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[cpq-sessions] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession as CPQSession,
    });
  } catch (error) {
    console.error('[cpq-sessions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Use session client for auth (reads cookies)
    const supabaseSession = await createClientWithSession();
    const {
      data: { user },
      error: authError,
    } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = await createClient();

    // Get existing session
    const { data: existingSession, error: fetchError } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check ownership (database uses owner_id)
    if (existingSession.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow deleting converted sessions
    if (existingSession.status === 'converted') {
      return NextResponse.json(
        { error: 'Cannot delete a converted session' },
        { status: 400 }
      );
    }

    // Update status to cancelled instead of deleting
    const { error: updateError } = await supabase
      .from('cpq_sessions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('[cpq-sessions] Cancel error:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session cancelled',
    });
  } catch (error) {
    console.error('[cpq-sessions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
