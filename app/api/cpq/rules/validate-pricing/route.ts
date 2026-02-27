/**
 * CPQ Validate Pricing API
 *
 * POST /api/cpq/rules/validate-pricing - Validate discounts against user limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePricing } from '@/lib/cpq/rule-engine';
import { ValidatePricingRequest } from '@/lib/cpq/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ValidatePricingRequest = await request.json();

    // Validate required fields
    if (!body.session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    if (!body.discounts || !Array.isArray(body.discounts)) {
      return NextResponse.json(
        { error: 'discounts array is required' },
        { status: 400 }
      );
    }

    if (!body.user_type || !['admin', 'partner'].includes(body.user_type)) {
      return NextResponse.json(
        { error: 'user_type must be "admin" or "partner"' },
        { status: 400 }
      );
    }

    if (!body.role_name) {
      return NextResponse.json(
        { error: 'role_name is required' },
        { status: 400 }
      );
    }

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await supabase
      .from('cpq_sessions')
      .select('id, owner_id, owner_type')
      .eq('id', body.session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check ownership (database uses owner_id)
    if (session.owner_id !== user.id) {
      // Check if user is a super_admin or manager
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!adminUser || !['super_admin', 'director', 'sales_manager', 'service_delivery_manager'].includes(adminUser.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Validate pricing
    const result = await validatePricing(body);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[cpq-validate-pricing] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
