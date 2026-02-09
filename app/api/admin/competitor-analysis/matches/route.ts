/**
 * Product Matches API
 *
 * GET /api/admin/competitor-analysis/matches
 * Returns list of product-competitor matches.
 *
 * POST /api/admin/competitor-analysis/matches
 * Creates a new product-competitor match.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import type { CreateMatchRequest, CircleTelProductType } from '@/lib/competitor-analysis/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const productType = searchParams.get('product_type') as CircleTelProductType | null;
    const productId = searchParams.get('product_id');
    const competitorProductId = searchParams.get('competitor_product_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query with joins
    let query = supabase
      .from('product_competitor_matches')
      .select(`
        *,
        competitor_products (
          id,
          product_name,
          monthly_price,
          product_type,
          technology,
          data_bundle,
          provider_id,
          competitor_providers (
            id,
            name,
            slug,
            logo_url
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (productType) {
      query = query.eq('product_type', productType);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (competitorProductId) {
      query = query.eq('competitor_product_id', competitorProductId);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('[Matches API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    apiLogger.error('[Matches API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateMatchRequest = await request.json();

    // Validate required fields
    if (!body.product_type || !body.product_id || !body.competitor_product_id) {
      return NextResponse.json(
        { error: 'Missing required fields: product_type, product_id, competitor_product_id' },
        { status: 400 }
      );
    }

    // Validate product_type
    const validTypes: CircleTelProductType[] = ['mtn_dealer', 'fibre', 'lte', 'product', 'service_package'];
    if (!validTypes.includes(body.product_type)) {
      return NextResponse.json(
        { error: `product_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify competitor product exists
    const { data: competitorProduct, error: cpError } = await supabase
      .from('competitor_products')
      .select('id')
      .eq('id', body.competitor_product_id)
      .single();

    if (cpError || !competitorProduct) {
      return NextResponse.json(
        { error: 'Competitor product not found' },
        { status: 404 }
      );
    }

    // Check for duplicate match
    const { data: existing } = await supabase
      .from('product_competitor_matches')
      .select('id')
      .eq('product_type', body.product_type)
      .eq('product_id', body.product_id)
      .eq('competitor_product_id', body.competitor_product_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This match already exists' },
        { status: 409 }
      );
    }

    // Validate confidence if provided
    if (body.match_confidence !== undefined) {
      if (body.match_confidence < 0 || body.match_confidence > 1) {
        return NextResponse.json(
          { error: 'match_confidence must be between 0 and 1' },
          { status: 400 }
        );
      }
    }

    // Create the match
    const { data, error } = await supabase
      .from('product_competitor_matches')
      .insert({
        product_type: body.product_type,
        product_id: body.product_id,
        competitor_product_id: body.competitor_product_id,
        match_confidence: body.match_confidence ?? null,
        match_method: 'manual',
        notes: body.notes || null,
      })
      .select(`
        *,
        competitor_products (
          id,
          product_name,
          monthly_price,
          competitor_providers (
            id,
            name,
            slug
          )
        )
      `)
      .single();

    if (error) {
      apiLogger.error('[Matches API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create match' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    apiLogger.error('[Matches API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}
