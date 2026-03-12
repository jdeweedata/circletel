/**
 * CPQ Sessions API
 *
 * POST /api/cpq/sessions - Create a new CPQ session
 * GET /api/cpq/sessions - List sessions for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { CreateSessionRequest, CPQSession } from '@/lib/cpq/types';

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

    const body: CreateSessionRequest = await request.json();

    // Validate user type
    if (!body.user_type || !['admin', 'partner'].includes(body.user_type)) {
      return NextResponse.json(
        { error: 'Invalid user_type. Must be "admin" or "partner"' },
        { status: 400 }
      );
    }

    // Determine user ID based on type
    let adminUserId: string | undefined;
    let partnerId: string | undefined;

    if (body.user_type === 'admin') {
      // Verify user is an admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!adminUser) {
        return NextResponse.json({ error: 'User is not an admin' }, { status: 403 });
      }
      adminUserId = user.id;
    } else {
      // Verify user is a partner
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partner) {
        return NextResponse.json({ error: 'User is not a partner' }, { status: 403 });
      }
      partnerId = partner.id;
    }

    // Create the session (matches existing database schema)
    const sessionData = {
      owner_type: body.user_type,
      owner_id: adminUserId || partnerId,
      status: 'draft',
      current_step: 1,
      step_data: {
        needs_assessment: body.initial_data || {},
        location_coverage: { sites: [], all_sites_checked: false },
        package_selection: { selected_packages: [], ai_recommendations_shown: false },
        configuration: { per_site_config: [] },
        pricing_discounts: {
          discounts: [],
          total_discount_percent: 0,
          total_discount_amount: 0,
          subtotal: 0,
          total: 0,
        },
        customer_details: { company_name: '', primary_contact: {} },
        review_summary: { summary_generated: false },
      },
      ai_chat_history: [],
      ai_recommendations: [],
      total_discount_percent: 0,
      discount_approved: false,
    };

    const { data: session, error: insertError } = await supabase
      .from('cpq_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      console.error('[cpq-sessions] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create session', details: insertError.message },
        { status: 500 }
      );
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

export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query (database uses owner_id for both admin and partner)
    let query = supabase
      .from('cpq_sessions')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('[cpq-sessions] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessions: sessions as CPQSession[],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[cpq-sessions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
