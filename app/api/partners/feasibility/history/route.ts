import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { FeasibilityHistoryResponse } from '@/lib/partners/feasibility-types';

/**
 * GET /api/partners/feasibility/history
 *
 * List partner's past feasibility requests with pagination
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<FeasibilityHistoryResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Get authenticated user
    const supabaseAuth = await createClientWithSession();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get partner record
    const supabase = await createClient();
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    if (partner.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Partner must be approved' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('partner_feasibility_requests')
      .select('*, partner_feasibility_sites(count)', { count: 'exact' })
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error: requestsError, count } = await query;

    if (requestsError) {
      apiLogger.error('[feasibility/history] Query failed', {
        error: requestsError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    // Format response
    const formattedRequests = (requests || []).map((req) => {
      // Get site count from nested query
      const siteCountData = req.partner_feasibility_sites;
      const siteCount = Array.isArray(siteCountData) ? siteCountData.length : 0;

      // Remove the nested sites data
      const { partner_feasibility_sites, ...requestData } = req;

      return {
        ...requestData,
        site_count: siteCount,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      pagination: {
        total,
        page,
        limit,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    apiLogger.error('[feasibility/history] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
