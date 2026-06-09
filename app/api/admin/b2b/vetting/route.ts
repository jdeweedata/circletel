/**
 * B2B Onboarding Vetting Queue API
 * Lists onboarding submissions awaiting document vetting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const perm = requirePermission(authResult.adminUser, 'kyc:verify');
    if (perm) return perm;

    const supabase = await createServerClient();

    // Get optional segment filter
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');

    // Build query
    let query = supabase
      .from('onboarding_submissions')
      .select(
        `
        id,
        customer_id,
        segment,
        status,
        document_vetting_status,
        submitted_at,
        customers(id, account_number, business_name, onboarding_status)
      `
      )
      .in('status', ['submitted', 'approved', 'rejected']);

    if (segment) {
      query = query.eq('segment', segment);
    }

    const { data: submissions, error } = await query.order('submitted_at', {
      ascending: true,
    });

    if (error) {
      apiLogger.error('Failed to fetch submissions', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
    });
  } catch (error: unknown) {
    apiLogger.error('API error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
