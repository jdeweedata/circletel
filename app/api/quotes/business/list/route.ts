import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging';

// Vercel serverless function configuration
export const runtime = 'nodejs'; // Use Node.js runtime (not Edge)
export const maxDuration = 60; // Max execution time in seconds

/**
 * GET /api/quotes/business/list
 *
 * List quotes with filtering and pagination (admin only)
 * Required permission: quotes:read
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ✅ SECURITY: Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;

    // ✅ SECURITY: Check permission
    const permissionError = requirePermission(adminUser, 'quotes:read');
    if (permissionError) {
      return permissionError;
    }

    const supabase = await createClient();

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');
    const customer_type = searchParams.get('customer_type');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';

    apiLogger.info('[Quotes API] Fetching quotes with params:', { limit, offset, status, customer_type, search });

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
      apiLogger.error('[Quotes API] Error fetching quotes:', quotesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch quotes',
          details: quotesError.message
        },
        { status: 500 }
      );
    }

    apiLogger.info(`[Quotes API] Found ${quotes?.length || 0} quotes in ${Date.now() - startTime}ms`);

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({
        success: true,
        quotes: [],
        pagination: {
          total: 0,
          limit,
          offset,
          has_more: false
        },
        filters: {
          status,
          customer_type,
          search,
          sort_by,
          sort_order
        }
      });
    }

    // OPTIMIZATION: Batch fetch item counts for all quotes in one query
    const quoteIds = quotes.map(q => q.id);
    apiLogger.info(`[Quotes API] Fetching item counts for ${quoteIds.length} quotes...`);

    const { data: itemCounts, error: itemCountsError } = await supabase
      .from('business_quote_items')
      .select('quote_id')
      .in('quote_id', quoteIds);

    if (itemCountsError) {
      apiLogger.error('[Quotes API] Error fetching item counts:', itemCountsError);
    }

    // Create a map of quote_id -> item count
    const itemCountMap = new Map<string, number>();
    itemCounts?.forEach(item => {
      const count = itemCountMap.get(item.quote_id) || 0;
      itemCountMap.set(item.quote_id, count + 1);
    });

    // OPTIMIZATION: Batch fetch admin users in one query
    const creatorIds = [...new Set(quotes.map(q => q.created_by).filter(Boolean))];
    apiLogger.info(`[Quotes API] Fetching ${creatorIds.length} unique admin users...`);

    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('id, full_name, email')
      .in('id', creatorIds);

    if (adminsError) {
      apiLogger.error('[Quotes API] Error fetching admins:', adminsError);
    }

    // Create a map of admin_id -> admin details
    const adminMap = new Map(admins?.map(admin => [admin.id, admin]) || []);

    // Combine the data
    const quotesWithDetails = quotes.map(quote => ({
      ...quote,
      item_count: itemCountMap.get(quote.id) || 0,
      created_by_admin: quote.created_by ? adminMap.get(quote.created_by) || null : null
    }));

    const totalTime = Date.now() - startTime;
    apiLogger.info(`[Quotes API] ✅ Successfully fetched ${quotesWithDetails.length} quotes with details in ${totalTime}ms`);

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
    const totalTime = Date.now() - startTime;
    apiLogger.error(`[Quotes API] ❌ Error after ${totalTime}ms:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
