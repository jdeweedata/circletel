/**
 * Price Comparison API
 *
 * GET /api/admin/competitor-analysis/compare
 * Returns price comparison data for matched products.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import type { PriceComparisonResult, CircleTelProductType } from '@/lib/competitor-analysis/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const productType = searchParams.get('product_type') as CircleTelProductType | null;
    const productId = searchParams.get('product_id');
    const providerId = searchParams.get('provider_id');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Use the price comparison view
    let query = supabase
      .from('v_competitor_price_comparison')
      .select('*', { count: 'exact' });

    // Apply filters
    if (productType) {
      query = query.eq('product_type', productType);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    // Apply pagination and ordering
    query = query
      .order('competitor_price', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('[Compare API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comparison data' },
        { status: 500 }
      );
    }

    // Group by CircleTel product for easier display
    const groupedByProduct = groupComparisonsByProduct(data as PriceComparisonResult[]);

    return NextResponse.json({
      data: data || [],
      grouped: groupedByProduct,
      total: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    apiLogger.error('[Compare API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}

/**
 * Group comparison results by CircleTel product.
 */
function groupComparisonsByProduct(
  comparisons: PriceComparisonResult[]
): Record<string, {
  product_type: CircleTelProductType;
  product_id: string;
  competitors: PriceComparisonResult[];
  lowest_price: number | null;
  highest_price: number | null;
  avg_price: number | null;
}> {
  const grouped: Record<string, {
    product_type: CircleTelProductType;
    product_id: string;
    competitors: PriceComparisonResult[];
    lowest_price: number | null;
    highest_price: number | null;
    avg_price: number | null;
  }> = {};

  for (const comparison of comparisons) {
    const key = `${comparison.product_type}:${comparison.product_id}`;

    if (!grouped[key]) {
      grouped[key] = {
        product_type: comparison.product_type,
        product_id: comparison.product_id,
        competitors: [],
        lowest_price: null,
        highest_price: null,
        avg_price: null,
      };
    }

    grouped[key].competitors.push(comparison);

    // Update price stats
    if (comparison.competitor_price !== null) {
      const price = comparison.competitor_price;

      if (grouped[key].lowest_price === null || price < grouped[key].lowest_price) {
        grouped[key].lowest_price = price;
      }

      if (grouped[key].highest_price === null || price > grouped[key].highest_price) {
        grouped[key].highest_price = price;
      }
    }
  }

  // Calculate averages
  for (const key of Object.keys(grouped)) {
    const prices = grouped[key].competitors
      .map((c) => c.competitor_price)
      .filter((p): p is number => p !== null);

    if (prices.length > 0) {
      grouped[key].avg_price = Math.round(
        prices.reduce((sum, p) => sum + p, 0) / prices.length
      );
    }
  }

  return grouped;
}
