import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { mapCategoryToTMF620, buildTMF620Error } from '@/lib/catalog/tmf620-mapper';
import type { TMF620Category } from '@/lib/types/tmf620';

// CircleTel product categories (from admin_product_category enum)
const CATEGORIES = [
  'business_fibre',
  'fixed_wireless_business',
  'fixed_wireless_residential',
] as const;

/**
 * GET /api/catalog/category
 * TMF620-compliant category listing
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    apiLogger.info('[TMF620 Catalog] Listing categories');

    // Get product counts per category
    const { data: products, error } = await supabase
      .from('admin_products')
      .select('category')
      .eq('status', 'approved')
      .eq('is_current', true);

    if (error) {
      apiLogger.error('[TMF620 Catalog] Database error', { error: error.message });
      return NextResponse.json(
        buildTMF620Error('500', 'Database Error', error.message, 500),
        { status: 500 }
      );
    }

    // Count products per category
    const categoryCounts: Record<string, number> = {};
    for (const product of products || []) {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    }

    // Map to TMF620 format
    const categories: TMF620Category[] = CATEGORIES.map((categoryId) =>
      mapCategoryToTMF620(categoryId, categoryCounts[categoryId] || 0)
    );

    // TMF620 response headers
    const headers = new Headers();
    headers.set('X-Total-Count', String(categories.length));
    headers.set('X-Result-Count', String(categories.length));

    return NextResponse.json(categories, { headers });
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
