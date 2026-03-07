import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { mapProductToTMF620, buildTMF620Error } from '@/lib/catalog/tmf620-mapper';
import type { TMF620ProductOffering, TMF620LifecycleStatus } from '@/lib/types/tmf620';

/**
 * GET /api/catalog/productOffering
 * TMF620-compliant product catalog listing
 *
 * Query parameters:
 * - offset: Pagination offset (default: 0)
 * - limit: Results per page (default: 20, max: 100)
 * - lifecycleStatus: Filter by status (Active, Retired, etc.)
 * - category.id: Filter by category
 * - name: Search by name (partial match)
 * - fields: Comma-separated list of fields to include
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    // Pagination
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Filters
    const lifecycleStatus = searchParams.get('lifecycleStatus') as TMF620LifecycleStatus | null;
    const categoryId = searchParams.get('category.id');
    const nameSearch = searchParams.get('name');

    apiLogger.info('[TMF620 Catalog] Listing products', {
      offset,
      limit,
      lifecycleStatus,
      categoryId,
      nameSearch,
    });

    // Build query - only return approved (Active) products by default for public API
    let query = supabase
      .from('admin_products')
      .select(`
        *,
        pricing:admin_product_pricing(*)
      `, { count: 'exact' })
      .eq('is_current', true);

    // Map TMF620 lifecycle status back to CircleTel status
    if (lifecycleStatus) {
      const statusMap: Record<string, string> = {
        'In design': 'draft',
        'In test': 'pending',
        'Active': 'approved',
        'Launched': 'approved',
        'Retired': 'archived',
      };
      const mappedStatus = statusMap[lifecycleStatus];
      if (mappedStatus) {
        query = query.eq('status', mappedStatus);
      }
    } else {
      // Default: only show approved products
      query = query.eq('status', 'approved');
    }

    // Category filter
    if (categoryId) {
      query = query.eq('category', categoryId);
    }

    // Name search (case-insensitive partial match)
    if (nameSearch) {
      query = query.ilike('name', `%${nameSearch}%`);
    }

    // Apply pagination
    query = query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      apiLogger.error('[TMF620 Catalog] Database error', { error: error.message });
      return NextResponse.json(
        buildTMF620Error('500', 'Database Error', error.message, 500),
        { status: 500 }
      );
    }

    // Map to TMF620 format
    const offerings: TMF620ProductOffering[] = (products || []).map((product) => {
      // Get the current active pricing (latest by effective_from)
      const pricing = Array.isArray(product.pricing)
        ? product.pricing.find((p: { approval_status: string }) => p.approval_status === 'approved')
        : null;
      return mapProductToTMF620(product, pricing);
    });

    // TMF620 response headers
    const headers = new Headers();
    headers.set('X-Total-Count', String(count || 0));
    headers.set('X-Result-Count', String(offerings.length));

    return NextResponse.json(offerings, { headers });
  } catch (error) {
    apiLogger.error('[TMF620 Catalog] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      buildTMF620Error('500', 'Internal Error', 'An unexpected error occurred', 500),
      { status: 500 }
    );
  }
}
