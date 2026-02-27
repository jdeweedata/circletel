/**
 * CPQ Session by ID API
 *
 * GET /api/cpq/sessions/[id] - Get session details
 * PUT /api/cpq/sessions/[id] - Update session state
 * DELETE /api/cpq/sessions/[id] - Abandon session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import type { CPQSession, UpdateSessionRequest, CPQWizardStep } from '@/lib/cpq/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: session, error } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      apiLogger.error('[CPQ] Failed to get session', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session as CPQSession,
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error getting session', {
      error: error instanceof Error ? error.message : String(error),
    });
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
    const supabase = await createClient();
    const body = (await request.json()) as UpdateSessionRequest;

    // Get current session to merge step_data
    const { data: currentSession, error: fetchError } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      );
    }

    // Check if session can be updated
    if (['converted', 'expired', 'abandoned'].includes(currentSession.status)) {
      return NextResponse.json(
        { error: `Cannot update session with status: ${currentSession.status}` },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.current_step !== undefined) {
      // Validate step range
      if (body.current_step < 1 || body.current_step > 7) {
        return NextResponse.json(
          { error: 'Invalid step. Must be between 1 and 7' },
          { status: 400 }
        );
      }
      updateData.current_step = body.current_step;

      // Log step analytics
      await supabase.from('cpq_analytics').insert({
        session_id: id,
        step_entered: body.current_step,
        step_completed: false,
      });

      // Mark previous step as completed
      if (body.current_step > currentSession.current_step) {
        await supabase
          .from('cpq_analytics')
          .update({ step_completed: true })
          .eq('session_id', id)
          .eq('step_entered', currentSession.current_step);
      }
    }

    if (body.status !== undefined) {
      updateData.status = body.status;

      // Handle status-specific updates
      if (body.status === 'converted') {
        updateData.converted_at = new Date().toISOString();
      }
    }

    if (body.step_data !== undefined) {
      // Deep merge step_data
      updateData.step_data = {
        ...currentSession.step_data,
        ...body.step_data,
      };
    }

    if (body.ai_chat_history !== undefined) {
      updateData.ai_chat_history = body.ai_chat_history;
    }

    if (body.ai_recommendations !== undefined) {
      updateData.ai_recommendations = body.ai_recommendations;
    }

    if (body.total_discount_percent !== undefined) {
      updateData.total_discount_percent = body.total_discount_percent;
    }

    // Update session
    const { data: session, error } = await supabase
      .from('cpq_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('[CPQ] Failed to update session', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to update session', details: error.message },
        { status: 500 }
      );
    }

    apiLogger.info('[CPQ] Session updated', {
      sessionId: id,
      step: body.current_step,
      status: body.status,
    });

    return NextResponse.json({
      success: true,
      data: session as CPQSession,
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error updating session', {
      error: error instanceof Error ? error.message : String(error),
    });
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
    const supabase = await createClient();

    // Mark as abandoned instead of deleting
    const { data: session, error } = await supabase
      .from('cpq_sessions')
      .update({
        status: 'abandoned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      apiLogger.error('[CPQ] Failed to abandon session', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to abandon session' },
        { status: 500 }
      );
    }

    apiLogger.info('[CPQ] Session abandoned', { sessionId: id });

    return NextResponse.json({
      success: true,
      message: 'Session abandoned',
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error abandoning session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
