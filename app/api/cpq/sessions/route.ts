/**
 * CPQ Sessions API
 *
 * POST /api/cpq/sessions - Create a new CPQ session
 * GET /api/cpq/sessions - List user's sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import type { CPQSession, CreateSessionRequest, RoleType } from '@/lib/cpq/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = (await request.json()) as CreateSessionRequest;

    // Validate required fields
    if (!body.owner_type || !body.owner_id) {
      return NextResponse.json(
        { error: 'Missing required fields: owner_type, owner_id' },
        { status: 400 }
      );
    }

    // Validate owner_type
    if (!['admin', 'partner'].includes(body.owner_type)) {
      return NextResponse.json(
        { error: 'Invalid owner_type. Must be "admin" or "partner"' },
        { status: 400 }
      );
    }

    // Create session with default step data
    const { data: session, error } = await supabase
      .from('cpq_sessions')
      .insert({
        owner_type: body.owner_type as RoleType,
        owner_id: body.owner_id,
        current_step: 1,
        status: 'draft',
        step_data: {
          needs_assessment: null,
          locations: [],
          selected_packages: [],
          configuration: { add_ons: [], customizations: {} },
          pricing: {
            subtotal: 0,
            automatic_discounts: [],
            manual_discount_percent: 0,
            manual_discount_amount: 0,
            total_discount_percent: 0,
            total_discount_amount: 0,
            final_monthly: 0,
            final_setup: 0,
            requires_approval: false,
          },
          customer_details: {},
          review: { terms_accepted: false },
        },
        ai_chat_history: [],
        ai_recommendations: [],
        total_discount_percent: 0,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) {
      apiLogger.error('[CPQ] Failed to create session', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      );
    }

    // Log analytics entry
    await supabase.from('cpq_analytics').insert({
      session_id: session.id,
      step_entered: 1,
      step_completed: false,
    });

    apiLogger.info('[CPQ] Session created', { sessionId: session.id });

    return NextResponse.json({
      success: true,
      data: session as CPQSession,
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error creating session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const ownerType = searchParams.get('owner_type');
    const ownerId = searchParams.get('owner_id');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('cpq_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (ownerType) {
      query = query.eq('owner_type', ownerType);
    }
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    if (status) {
      query = query.eq('status', status);
    } else {
      // By default, exclude expired/abandoned/converted
      query = query.in('status', ['draft', 'pending_approval', 'approved']);
    }

    const { data: sessions, error } = await query.limit(50);

    if (error) {
      apiLogger.error('[CPQ] Failed to list sessions', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to list sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sessions as CPQSession[],
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error listing sessions', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
