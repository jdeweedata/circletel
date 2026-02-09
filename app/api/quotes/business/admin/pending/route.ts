import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

/**
 * GET /api/quotes/business/admin/pending
 *
 * Get all pending approval quotes (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // TODO: Verify admin permissions

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || 'pending_approval';

    // Fetch pending quotes with basic info
    const { data: quotes, error: quotesError, count } = await supabase
      .from('business_quotes')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (quotesError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch quotes'
        },
        { status: 500 }
      );
    }

    // For each quote, get item count
    const quotesWithCounts = await Promise.all(
      (quotes || []).map(async (quote) => {
        const { count: itemCount } = await supabase
          .from('business_quote_items')
          .select('*', { count: 'exact', head: true })
          .eq('quote_id', quote.id);

        return {
          ...quote,
          item_count: itemCount || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      quotes: quotesWithCounts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    apiLogger.error('Error fetching pending quotes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pending quotes'
      },
      { status: 500 }
    );
  }
}
