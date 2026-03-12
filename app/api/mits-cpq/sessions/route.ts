/**
 * MITS CPQ Sessions API
 *
 * GET  /api/mits-cpq/sessions - List user's MITS sessions
 * POST /api/mits-cpq/sessions - Create a new MITS CPQ session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';

export async function GET() {
  try {
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

    // Fetch MITS sessions for this user — identified by product_type in step_data JSONB
    // PostgREST JSONB filter: step_data->>product_type (text extraction)
    const { data: sessions, error } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('owner_id', user.id)
      .filter('step_data->>product_type', 'eq', 'mits')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[mits-cpq/sessions] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessions: sessions ?? [],
    });
  } catch (error) {
    console.error('[mits-cpq/sessions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Parse optional initial data from request body
    const body = await request.json().catch(() => ({}));
    const initialStepData = body?.initial_data ?? {};

    // Create a new MITS CPQ session in cpq_sessions
    // product_type is stored in step_data JSONB to distinguish from regular CPQ sessions
    const { data: session, error: insertError } = await supabase
      .from('cpq_sessions')
      .insert({
        owner_type: 'admin',
        owner_id: user.id,
        status: 'draft',
        current_step: 1,
        step_data: {
          product_type: 'mits',
          current_step_name: 'tier_selection',
          tier_selection: null,
          m365_config: null,
          add_ons: null,
          pricing: null,
          customer: null,
          review: null,
          ...initialStepData,
        },
        ai_chat_history: [],
        ai_recommendations: [],
        total_discount_percent: 0,
        discount_approved: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[mits-cpq/sessions] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create session', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[mits-cpq/sessions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
