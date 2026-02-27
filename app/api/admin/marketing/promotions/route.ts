import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketing/promotions
 * List promotions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('promotions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,promo_code.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data: promotions, error, count } = await query;

    if (error) {
      console.error('Error fetching promotions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promotions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      promotions: promotions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/marketing/promotions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/marketing/promotions
 * Create a new promotion
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Promotion name is required' },
        { status: 400 }
      );
    }

    if (!body.discount_type) {
      return NextResponse.json(
        { error: 'Discount type is required' },
        { status: 400 }
      );
    }

    // Check for duplicate promo code
    if (body.promo_code) {
      const { data: existing } = await supabase
        .from('promotions')
        .select('id')
        .eq('promo_code', body.promo_code)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Promo code already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare promotion data
    const promotionData = {
      name: body.name,
      description: body.description || null,
      discount_type: body.discount_type,
      discount_value: body.discount_value || 0,
      promo_code: body.promo_code || null,
      product_id: body.product_id || null,
      product_category: body.product_category || null,
      customer_type: body.customer_type || 'all',
      valid_from: body.valid_from || new Date().toISOString(),
      valid_until: body.valid_until || null,
      max_usage: body.max_usage || null,
      max_per_customer: body.max_per_customer || 1,
      status: body.status || 'draft',
      display_on_homepage: body.display_on_homepage || false,
      display_on_product: body.display_on_product !== false,
      banner_image_url: body.banner_image_url || null,
      // created_by would be set from auth context in production
    };

    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert(promotionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating promotion:', error);
      return NextResponse.json(
        { error: 'Failed to create promotion' },
        { status: 500 }
      );
    }

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/marketing/promotions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
