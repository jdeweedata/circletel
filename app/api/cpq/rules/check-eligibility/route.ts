/**
 * CPQ Check Eligibility API
 *
 * POST /api/cpq/rules/check-eligibility - Check package eligibility and applicable rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkEligibility } from '@/lib/cpq/rule-engine';
import { CheckEligibilityRequest } from '@/lib/cpq/types';

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

    const body: CheckEligibilityRequest = await request.json();

    // Validate required fields
    if (!body.package_id) {
      return NextResponse.json(
        { error: 'package_id is required' },
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

    // Check eligibility
    const result = await checkEligibility(body);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[cpq-check-eligibility] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
