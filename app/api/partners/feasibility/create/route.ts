import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import {
  CreateFeasibilityRequest,
  CreateFeasibilityResponse,
  PartnerFeasibilitySite,
} from '@/lib/partners/feasibility-types';

/**
 * POST /api/partners/feasibility/create
 *
 * Create a new feasibility request with sites and trigger coverage checks
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateFeasibilityResponse>> {
  try {
    const body = (await request.json()) as CreateFeasibilityRequest;

    // Validate required fields
    if (!body.client_company_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Client company name is required' },
        { status: 400 }
      );
    }

    if (!body.sites || !Array.isArray(body.sites) || body.sites.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one site is required' },
        { status: 400 }
      );
    }

    // Validate sites
    for (const site of body.sites) {
      if (!site.address?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Each site must have an address' },
          { status: 400 }
        );
      }
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

    // Get partner record and verify approved status
    const supabase = await createClient();
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, business_name, status')
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
        { success: false, error: 'Partner must be approved to submit feasibility requests' },
        { status: 403 }
      );
    }

    // Create the feasibility request
    const { data: feasibilityRequest, error: createError } = await supabase
      .from('partner_feasibility_requests')
      .insert({
        partner_id: partner.id,
        client_company_name: body.client_company_name.trim(),
        client_contact_name: body.client_contact_name?.trim() || null,
        client_email: body.client_email?.trim() || null,
        client_phone: body.client_phone?.trim() || null,
        bandwidth_required: body.bandwidth_required || null,
        contention: body.contention || null,
        sla_level: body.sla_level || null,
        failover_required: body.failover_required ?? false,
        contract_term: body.contract_term ?? 24,
        status: 'checking',
      })
      .select()
      .single();

    if (createError || !feasibilityRequest) {
      apiLogger.error('[feasibility/create] Failed to create request', {
        error: createError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to create feasibility request' },
        { status: 500 }
      );
    }

    // Create sites and coverage_leads for each site
    const createdSites: PartnerFeasibilitySite[] = [];

    for (const siteInput of body.sites) {
      // Create a coverage_lead for this site (reuse existing infrastructure)
      const { data: coverageLead, error: leadError } = await supabase
        .from('coverage_leads')
        .insert({
          address: siteInput.address.trim(),
          latitude: siteInput.latitude || null,
          longitude: siteInput.longitude || null,
          source: 'partner_feasibility',
          customer_type: 'business',
          company_name: body.client_company_name.trim(),
          coverage_check_status: 'pending',
          requirements: {
            bandwidth_mbps: body.bandwidth_required,
            contention: body.contention,
            sla_level: body.sla_level,
            failover_needed: body.failover_required,
          },
        })
        .select('id')
        .single();

      if (leadError) {
        apiLogger.warn('[feasibility/create] Failed to create coverage_lead', {
          error: leadError.message,
          address: siteInput.address,
        });
      }

      // Create the feasibility site
      const { data: site, error: siteError } = await supabase
        .from('partner_feasibility_sites')
        .insert({
          request_id: feasibilityRequest.id,
          address: siteInput.address.trim(),
          latitude: siteInput.latitude || null,
          longitude: siteInput.longitude || null,
          coverage_status: 'pending',
          coverage_lead_id: coverageLead?.id || null,
        })
        .select()
        .single();

      if (siteError) {
        apiLogger.error('[feasibility/create] Failed to create site', {
          error: siteError.message,
        });
        continue;
      }

      createdSites.push(site as PartnerFeasibilitySite);

      // Trigger async coverage check via Inngest event
      // The Inngest function `feasibility/check.requested` will handle coverage checks
      if (coverageLead?.id) {
        try {
          // Import inngest client
          const { inngest } = await import('@/lib/inngest/client');
          await inngest.send({
            name: 'feasibility/check.requested',
            data: {
              coverage_lead_id: coverageLead.id,
              partner_feasibility_site_id: site.id,
              coordinates: siteInput.latitude && siteInput.longitude
                ? { lat: siteInput.latitude, lng: siteInput.longitude }
                : null,
              address: siteInput.address,
            },
          });
        } catch (inngestError) {
          apiLogger.warn('[feasibility/create] Failed to trigger Inngest', {
            error: inngestError instanceof Error ? inngestError.message : String(inngestError),
          });
          // Continue - we can check coverage synchronously as fallback
        }
      }
    }

    // If no sites were created successfully, delete the request
    if (createdSites.length === 0) {
      await supabase
        .from('partner_feasibility_requests')
        .delete()
        .eq('id', feasibilityRequest.id);

      return NextResponse.json(
        { success: false, error: 'Failed to create any sites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request_id: feasibilityRequest.id,
      sites: createdSites,
    });
  } catch (error) {
    apiLogger.error('[feasibility/create] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
