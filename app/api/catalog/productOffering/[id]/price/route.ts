import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { mapPricingToTMF620, buildTMF620Error } from '@/lib/catalog/tmf620-mapper';
import type { TMF620ProductOfferingPrice } from '@/lib/types/tmf620';

/**
 * GET /api/catalog/productOffering/{id}/price
 * TMF620-compliant pricing for a product offering
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    apiLogger.info('[TMF620 Catalog] Fetching prices', { productId: id });

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        buildTMF620Error('400', 'Invalid ID', 'Product ID must be a valid UUID', 400),
        { status: 400 }
      );
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('admin_products')
      .select('id, name')
      .eq('id', id)
      .eq('is_current', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        buildTMF620Error('404', 'Not Found', `ProductOffering with id ${id} not found`, 404),
        { status: 404 }
      );
    }

    // Fetch all pricing records
    const { data: pricingRecords, error: pricingError } = await supabase
      .from('admin_product_pricing')
      .select('*')
      .eq('product_id', id)
      .order('effective_from', { ascending: false });

    if (pricingError) {
      apiLogger.error('[TMF620 Catalog] Database error', { error: pricingError.message });
      return NextResponse.json(
        buildTMF620Error('500', 'Database Error', pricingError.message, 500),
        { status: 500 }
      );
    }

    // Map all pricing records to TMF620 format
    const allPrices: TMF620ProductOfferingPrice[] = [];
    for (const pricing of pricingRecords || []) {
      const mappedPrices = mapPricingToTMF620(id, pricing);
      allPrices.push(...mappedPrices);
    }

    // TMF620 response headers
    const headers = new Headers();
    headers.set('X-Total-Count', String(allPrices.length));
    headers.set('X-Result-Count', String(allPrices.length));

    return NextResponse.json(allPrices, { headers });
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
