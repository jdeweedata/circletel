import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

/**
 * PATCH /api/products/mtn-deals/[id]
 * Update MTN deal visibility
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { is_visible_on_frontend } = body;

    if (typeof is_visible_on_frontend !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_visible_on_frontend must be a boolean' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update the deal visibility
    const { data, error } = await supabase
      .from('mtn_business_deals')
      .update({
        is_visible_on_frontend,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('[MTN Deals API] Error updating deal visibility', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    apiLogger.info(`[MTN Deals API] Deal ${id} visibility updated`, { is_visible_on_frontend });

    return NextResponse.json({
      success: true,
      deal: data,
    });
  } catch (error) {
    apiLogger.error('[MTN Deals API] Error in PATCH handler', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/mtn-deals/[id]
 * Get a single MTN deal by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('mtn_business_deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      apiLogger.error('[MTN Deals API] Error fetching deal', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deal: data,
    });
  } catch (error) {
    apiLogger.error('[MTN Deals API] Error in GET handler', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

