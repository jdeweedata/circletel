import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/zones/[id]
 * Get a single zone by ID with latest zone_metrics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('*')
      .eq('id', id)
      .single();

    if (zoneError) {
      apiLogger.error('[Sales Engine] Error fetching zone', { error: zoneError.message, zone_id: id });
      return NextResponse.json(
        { error: zoneError.message, success: false },
        { status: zoneError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    const { data: latestMetric, error: metricError } = await supabase
      .from('zone_metrics')
      .select('*')
      .eq('zone_id', id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (metricError) {
      apiLogger.error('[Sales Engine] Error fetching zone metrics', { error: metricError.message, zone_id: id });
    }

    const data = {
      ...zone,
      latest_metrics: latestMetric ?? null,
    };

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zone GET error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sales-engine/zones/[id]
 * Update zone fields
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('sales_zones')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error updating zone', { error: error.message, zone_id: id });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info('[Sales Engine] Zone updated', { zone_id: id });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zone PUT error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sales-engine/zones/[id]
 * Soft delete — sets status to 'parked'
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sales_zones')
      .update({ status: 'parked' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error soft-deleting zone', { error: error.message, zone_id: id });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info('[Sales Engine] Zone soft-deleted (parked)', { zone_id: id });
    return NextResponse.json({ data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zone DELETE error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
