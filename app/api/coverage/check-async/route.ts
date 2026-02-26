import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { apiLogger } from '@/lib/logging';

interface CheckAsyncRequest {
  leadId: string;
  requirements?: {
    bandwidth_mbps?: number;
    budget_max?: number;
    contention?: 'best-effort' | '10:1' | 'dia';
    failover_needed?: boolean;
    sla_required?: string;
  };
}

interface CheckAsyncResponse {
  success: boolean;
  eventId?: string;
  leadId?: string;
  message?: string;
  error?: string;
}

/**
 * POST /api/coverage/check-async
 *
 * Trigger an async feasibility coverage check via Inngest.
 * Returns immediately with an event ID for tracking.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CheckAsyncResponse>> {
  try {
    const body = (await request.json()) as CheckAsyncRequest;
    const { leadId, requirements } = body;

    // Validate leadId
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch lead and validate it exists
    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .select('id, coordinates, coverage_check_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      apiLogger.error('[check-async] Lead not found', { leadId, error: leadError?.message });
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check for coordinates
    if (!lead.coordinates) {
      return NextResponse.json(
        { success: false, error: 'Lead has no coordinates. Geocode address first.' },
        { status: 400 }
      );
    }

    // Prevent duplicate concurrent checks
    if (lead.coverage_check_status === 'checking') {
      return NextResponse.json(
        { success: false, error: 'Coverage check already in progress' },
        { status: 409 }
      );
    }

    // Extract coordinates (handle both formats)
    let coordinates: { lat: number; lng: number };
    if (lead.coordinates.type === 'Point' && Array.isArray(lead.coordinates.coordinates)) {
      coordinates = {
        lng: lead.coordinates.coordinates[0],
        lat: lead.coordinates.coordinates[1],
      };
    } else if (lead.coordinates.lat && lead.coordinates.lng) {
      coordinates = {
        lat: lead.coordinates.lat,
        lng: lead.coordinates.lng,
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates format' },
        { status: 400 }
      );
    }

    // Send Inngest event
    const { ids } = await inngest.send({
      name: 'feasibility/check.requested',
      data: {
        lead_id: leadId,
        coordinates,
        requirements,
        triggered_by: 'api',
      },
    });

    apiLogger.info('[check-async] Triggered feasibility check', {
      leadId,
      eventId: ids[0],
      coordinates,
    });

    return NextResponse.json({
      success: true,
      eventId: ids[0],
      leadId,
      message: 'Coverage check started. Poll coverage_check_status for progress.',
    });
  } catch (error) {
    apiLogger.error('[check-async] Error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/coverage/check-async?leadId=xxx
 *
 * Get the current status of a coverage check.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: lead, error } = await supabase
      .from('coverage_leads')
      .select('id, coverage_check_status, coverage_results, checked_at')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      status: lead.coverage_check_status,
      results: lead.coverage_results,
      checkedAt: lead.checked_at,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
