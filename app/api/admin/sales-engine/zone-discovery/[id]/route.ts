import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  approveCandidate,
  rejectCandidate,
} from '@/lib/sales-engine/zone-discovery-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/admin/sales-engine/zone-discovery/[id]
 * Get a single discovery candidate by ID.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zone_discovery_candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message ?? 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sales-engine/zone-discovery/[id]
 * Approve or reject a discovery candidate.
 * Body: { action: 'approve' | 'reject', rejection_reason?, overrides? }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, rejection_reason, overrides } = body as {
      action: 'approve' | 'reject';
      rejection_reason?: string;
      overrides?: Record<string, unknown>;
    };

    if (action === 'approve') {
      const result = await approveCandidate(id, overrides);
      if (result.error) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    if (action === 'reject') {
      const result = await rejectCandidate(id, rejection_reason);
      if (result.error) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be "approve" or "reject".' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
