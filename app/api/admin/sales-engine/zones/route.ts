import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/zones
 * List sales zones with optional filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sort_by') || 'zone_score';

    let query = supabase
      .from('sales_zones')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    query = query.order(sortBy, { ascending: false });

    const { data, error } = await query;

    if (error) {
      apiLogger.error('[Sales Engine] Error fetching zones', { error: error.message });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zones GET error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sales-engine/zones
 * Create a new sales zone
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('sales_zones')
      .insert(body)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error creating zone', { error: error.message });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info('[Sales Engine] Zone created', { zone_id: data.id });
    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Zones POST error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
