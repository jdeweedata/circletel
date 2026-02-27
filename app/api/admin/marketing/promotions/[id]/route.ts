import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketing/promotions/[id]
 * Get a single promotion by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Promotion not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching promotion:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promotion' },
        { status: 500 }
      );
    }

    // Get usage statistics
    const { count: usageCount } = await supabase
      .from('promotion_usage')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', id);

    return NextResponse.json({
      ...promotion,
      usage_stats: {
        total_redemptions: usageCount || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/marketing/promotions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/marketing/promotions/[id]
 * Update a promotion
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    // Check if promotion exists
    const { data: existing, error: fetchError } = await supabase
      .from('promotions')
      .select('id, promo_code')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Check for duplicate promo code if changing
    if (body.promo_code && body.promo_code !== existing.promo_code) {
      const { data: duplicate } = await supabase
        .from('promotions')
        .select('id')
        .eq('promo_code', body.promo_code)
        .neq('id', id)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: 'Promo code already exists' },
          { status: 400 }
        );
      }
    }

    // Build update object (only include fields that are provided)
    const updateData: Record<string, unknown> = {};

    const allowedFields = [
      'name',
      'description',
      'discount_type',
      'discount_value',
      'promo_code',
      'product_id',
      'product_category',
      'customer_type',
      'valid_from',
      'valid_until',
      'max_usage',
      'max_per_customer',
      'status',
      'display_on_homepage',
      'display_on_product',
      'banner_image_url',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: promotion, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion:', error);
      return NextResponse.json(
        { error: 'Failed to update promotion' },
        { status: 500 }
      );
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error in PUT /api/admin/marketing/promotions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/marketing/promotions/[id]
 * Delete a promotion
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Check if promotion exists and get usage count
    const { data: existing, error: fetchError } = await supabase
      .from('promotions')
      .select('id, usage_count')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Warn if promotion has been used (but still allow deletion)
    if (existing.usage_count > 0) {
      console.warn(
        `Deleting promotion ${id} that has been used ${existing.usage_count} times`
      );
    }

    // Delete the promotion (cascade will handle promotion_usage)
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promotion:', error);
      return NextResponse.json(
        { error: 'Failed to delete promotion' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/marketing/promotions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
