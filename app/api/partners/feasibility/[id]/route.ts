import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { FeasibilityStatusResponse } from '@/lib/partners/feasibility-types';

/**
 * GET /api/partners/feasibility/[id]
 *
 * Get details for a specific feasibility request including sites
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<FeasibilityStatusResponse>> {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

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

    // Get the feasibility request with sites
    const { data: feasibilityRequest, error: requestError } = await supabase
      .from('partner_feasibility_requests')
      .select('*')
      .eq('id', id)
      .eq('partner_id', partner.id)
      .single();

    if (requestError || !feasibilityRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Get sites for this request
    const { data: sites, error: sitesError } = await supabase
      .from('partner_feasibility_sites')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: true });

    if (sitesError) {
      apiLogger.error('[feasibility/[id]] Failed to get sites', {
        error: sitesError.message,
      });
    }

    // Check if all sites are complete and update request status
    const allSites = sites || [];
    const allComplete = allSites.length > 0 && allSites.every(
      (s) => s.coverage_status === 'complete' || s.coverage_status === 'failed'
    );

    if (
      allComplete &&
      feasibilityRequest.status === 'checking'
    ) {
      // Update request status to complete
      await supabase
        .from('partner_feasibility_requests')
        .update({ status: 'complete' })
        .eq('id', id);

      feasibilityRequest.status = 'complete';
    }

    return NextResponse.json({
      success: true,
      request: {
        ...feasibilityRequest,
        sites: allSites,
      },
    });
  } catch (error) {
    apiLogger.error('[feasibility/[id]] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/partners/feasibility/[id]
 *
 * Update a feasibility request (e.g., select packages, generate quote)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

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

    // Verify ownership
    const { data: existingRequest, error: fetchError } = await supabase
      .from('partner_feasibility_requests')
      .select('id, status')
      .eq('id', id)
      .eq('partner_id', partner.id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Build update object
    const allowedFields = [
      'client_company_name',
      'client_contact_name',
      'client_email',
      'client_phone',
      'bandwidth_required',
      'contention',
      'sla_level',
      'failover_required',
      'contract_term',
      'status',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('partner_feasibility_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      apiLogger.error('[feasibility/[id]] Update failed', {
        error: updateError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    apiLogger.error('[feasibility/[id]] PATCH error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
