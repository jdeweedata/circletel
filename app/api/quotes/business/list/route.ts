import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/quotes/business/list
 *
 * List quotes with filtering and pagination (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // TODO: Verify admin permissions

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');
    const customer_type = searchParams.get('customer_type');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabase
      .from('business_quotes')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (customer_type) {
      query = query.eq('customer_type', customer_type);
    }
    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,quote_number.ilike.%${search}%,contact_email.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: quotes, error: quotesError, count } = await query;

    if (quotesError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch quotes'
        },
        { status: 500 }
      );
    }

    // For each quote, get item count and created_by admin info
    const quotesWithDetails = await Promise.all(
      (quotes || []).map(async (quote) => {
        // Get item count
        const { count: itemCount } = await supabase
          .from('business_quote_items')
          .select('*', { count: 'exact', head: true })
          .eq('quote_id', quote.id);

        // Get created_by admin details
        let created_by_admin = null;
        if (quote.created_by) {
          const { data: admin } = await supabase
            .from('admin_users')
            .select('id, full_name, email')
            .eq('id', quote.created_by)
            .single();
          created_by_admin = admin;
        }

        return {
          ...quote,
          item_count: itemCount || 0,
          created_by_admin
        };
      })
    );

    return NextResponse.json({
      success: true,
      quotes: quotesWithDetails,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      },
      filters: {
        status,
        customer_type,
        search,
        sort_by,
        sort_order
      }
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotes'
      },
      { status: 500 }
    );
  }
}
