/**
 * MITS CPQ Session by ID API
 *
 * GET   /api/mits-cpq/sessions/[id] - Get a session by ID
 * PATCH /api/mits-cpq/sessions/[id] - Update session step, step_data, or status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
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

    const { data: session, error } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Enforce ownership — only the owner can access their own session
    if (session.owner_id !== user.id) {
      // Allow admins with elevated roles to view any session
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (
        !adminUser ||
        !['super_admin', 'service_delivery_manager', 'director', 'sales_manager'].includes(
          adminUser.role
        )
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('[mits-cpq/sessions/[id]] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Fetch existing session
    const { data: existingSession, error: fetchError } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Enforce ownership
    if (existingSession.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent modifications to terminal states
    if (['converted', 'expired', 'cancelled'].includes(existingSession.status)) {
      return NextResponse.json(
        { error: 'Session cannot be modified in its current status' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Build the update payload
    const updateData: Record<string, unknown> = {};

    // Update current_step_name (stored in step_data) and advance numeric step if provided
    if (body.current_step !== undefined) {
      // Accept either a step name string or numeric step index
      if (typeof body.current_step === 'string') {
        const existingStepData =
          (existingSession.step_data as Record<string, unknown>) ?? {};
        updateData.step_data = {
          ...existingStepData,
          current_step_name: body.current_step,
        };
        // Advance numeric step to 2+ to mark session as in_progress
        updateData.current_step = Math.max(
          (existingSession.current_step as number) ?? 1,
          2
        );
      } else {
        updateData.current_step = body.current_step;
      }
    }

    // Merge step_data patches
    if (body.step_data !== undefined) {
      const existingStepData =
        (existingSession.step_data as Record<string, unknown>) ?? {};
      const incomingStepData = updateData.step_data as Record<string, unknown> | undefined;
      updateData.step_data = {
        ...existingStepData,
        ...(incomingStepData ?? {}),
        ...body.step_data,
      };
    }

    // Allow direct status override
    if (body.status !== undefined) {
      updateData.status = body.status;
    } else if (updateData.current_step !== undefined) {
      // Auto-advance status to in_progress when stepping forward
      if ((updateData.current_step as number) > 1) {
        updateData.status = 'in_progress';
      }
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('cpq_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[mits-cpq/sessions/[id]] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('[mits-cpq/sessions/[id]] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
