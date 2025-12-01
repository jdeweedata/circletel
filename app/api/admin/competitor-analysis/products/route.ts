/**
 * Competitor Products API
 *
 * GET /api/admin/competitor-analysis/products
 * Returns filtered list of competitor products.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProductsFilter } from '@/lib/competitor-analysis/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters: ProductsFilter = {
      provider_id: searchParams.get('provider_id') || undefined,
      provider_slug: searchParams.get('provider_slug') || undefined,
      product_type: (searchParams.get('product_type') as ProductsFilter['product_type']) || undefined,
      technology: (searchParams.get('technology') as ProductsFilter['technology']) || undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      search: searchParams.get('search') || undefined,
      is_current: searchParams.get('is_current') !== 'false', // Default to true
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    // Build query
    let query = supabase
      .from('competitor_products')
      .select(`
        *,
        competitor_providers (
          id,
          name,
          slug,
          logo_url
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.is_current !== undefined) {
      query = query.eq('is_current', filters.is_current);
    }

    if (filters.provider_id) {
      query = query.eq('provider_id', filters.provider_id);
    }

    if (filters.provider_slug) {
      // Need to join and filter by slug
      const { data: provider } = await supabase
        .from('competitor_providers')
        .select('id')
        .eq('slug', filters.provider_slug)
        .single();

      if (provider) {
        query = query.eq('provider_id', provider.id);
      } else {
        return NextResponse.json({ data: [], total: 0, limit: filters.limit, offset: filters.offset, has_more: false });
      }
    }

    if (filters.product_type) {
      query = query.eq('product_type', filters.product_type);
    }

    if (filters.technology) {
      query = query.eq('technology', filters.technology);
    }

    if (filters.min_price !== undefined) {
      query = query.gte('monthly_price', filters.min_price);
    }

    if (filters.max_price !== undefined) {
      query = query.lte('monthly_price', filters.max_price);
    }

    if (filters.search) {
      query = query.ilike('product_name', `%${filters.search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('monthly_price', { ascending: true })
      .range(filters.offset!, filters.offset! + filters.limit! - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Products API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset,
      has_more: (count || 0) > (filters.offset! + filters.limit!),
    });
  } catch (error) {
    console.error('[Products API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
