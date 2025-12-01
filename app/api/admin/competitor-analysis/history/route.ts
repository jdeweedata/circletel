/**
 * Price History API
 *
 * GET /api/admin/competitor-analysis/history
 * Returns price history for a competitor product.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PriceHistoryFilter } from '@/lib/competitor-analysis/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    const filters: PriceHistoryFilter = {
      product_id: productId,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: parseInt(searchParams.get('limit') || '100', 10),
    };

    // Get the product info first
    const { data: product, error: productError } = await supabase
      .from('competitor_products')
      .select(`
        *,
        competitor_providers (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Build history query
    let historyQuery = supabase
      .from('competitor_price_history')
      .select('*')
      .eq('competitor_product_id', productId)
      .order('recorded_at', { ascending: true });

    if (filters.start_date) {
      historyQuery = historyQuery.gte('recorded_at', filters.start_date);
    }

    if (filters.end_date) {
      historyQuery = historyQuery.lte('recorded_at', filters.end_date);
    }

    historyQuery = historyQuery.limit(filters.limit!);

    const { data: history, error: historyError } = await historyQuery;

    if (historyError) {
      console.error('[History API] Query error:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch price history' },
        { status: 500 }
      );
    }

    // Calculate price change stats
    const priceHistory = history || [];
    let priceChange: number | null = null;
    let priceChangePercent: number | null = null;

    if (priceHistory.length >= 2) {
      const firstPrice = priceHistory[0].monthly_price;
      const lastPrice = priceHistory[priceHistory.length - 1].monthly_price;

      if (firstPrice !== null && lastPrice !== null && firstPrice !== 0) {
        priceChange = lastPrice - firstPrice;
        priceChangePercent = Math.round(((lastPrice - firstPrice) / firstPrice) * 100 * 10) / 10;
      }
    }

    return NextResponse.json({
      product,
      history: priceHistory,
      stats: {
        total_records: priceHistory.length,
        first_recorded: priceHistory.length > 0 ? priceHistory[0].recorded_at : null,
        last_recorded: priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].recorded_at : null,
        price_change: priceChange,
        price_change_percent: priceChangePercent,
      },
    });
  } catch (error) {
    console.error('[History API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
