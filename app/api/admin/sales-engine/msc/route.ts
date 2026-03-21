import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Compute MSC period status based on dates and actual vs required RNS
 */
function computeMscStatus(
  periodStart: string,
  periodEnd: string,
  actualRns: number,
  requiredRns: number
): string {
  const today = new Date();
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  if (end < today) {
    // Period has ended
    return actualRns >= requiredRns ? 'met' : 'missed';
  }

  if (start <= today && today <= end) {
    // Currently active period
    if (actualRns >= requiredRns) return 'met';
    if (actualRns < requiredRns * 0.7) return 'at_risk';
    return 'active';
  }

  // Future period
  return 'upcoming';
}

/**
 * GET /api/admin/sales-engine/msc
 * Get all MSC tracking periods sorted by period_start ASC
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('msc_tracking')
      .select('*')
      .order('period_start', { ascending: true });

    if (error) {
      apiLogger.error('[Sales Engine] Error fetching MSC periods', { error: error.message });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] MSC GET error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sales-engine/msc
 * Update an MSC period with actual values — auto-computes status
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, actual_rns, actual_spend } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id', success: false },
        { status: 400 }
      );
    }

    // Fetch current period to get dates and required_rns
    const { data: period, error: fetchError } = await supabase
      .from('msc_tracking')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      apiLogger.error('[Sales Engine] Error fetching MSC period', { error: fetchError.message, msc_id: id });
      return NextResponse.json(
        { error: fetchError.message, success: false },
        { status: fetchError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    const updatedRns = actual_rns ?? period.actual_rns ?? 0;
    const updatedSpend = actual_spend ?? period.actual_spend ?? 0;

    const status = computeMscStatus(
      period.period_start,
      period.period_end,
      updatedRns,
      period.required_rns
    );

    const updatePayload: Record<string, unknown> = { status };

    if (actual_rns !== undefined) updatePayload.actual_rns = actual_rns;
    if (actual_spend !== undefined) updatePayload.actual_spend = actual_spend;

    const { data, error } = await supabase
      .from('msc_tracking')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error updating MSC period', { error: error.message, msc_id: id });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info('[Sales Engine] MSC period updated', {
      msc_id: id,
      status,
      actual_rns: updatedRns,
      actual_spend: updatedSpend,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] MSC PUT error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
