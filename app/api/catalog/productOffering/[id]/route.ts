import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { mapProductToTMF620, buildTMF620Error } from '@/lib/catalog/tmf620-mapper';
import type { ProductRelationshipWithTarget } from '@/lib/types/product-relationships';

/**
 * GET /api/catalog/productOffering/{id}
 * TMF620-compliant single product offering retrieval
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    apiLogger.info('[TMF620 Catalog] Fetching product', { id });

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        buildTMF620Error('400', 'Invalid ID', 'Product ID must be a valid UUID', 400),
        { status: 400 }
      );
    }

    // Fetch product with pricing, features, and relationships
    const { data: product, error: productError } = await supabase
      .from('admin_products')
      .select(`
        *,
        pricing:admin_product_pricing(*),
        features:admin_product_features(*)
      `)
      .eq('id', id)
      .eq('is_current', true)
      .single();

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          buildTMF620Error('404', 'Not Found', `ProductOffering with id ${id} not found`, 404),
          { status: 404 }
        );
      }
      apiLogger.error('[TMF620 Catalog] Database error', { error: productError.message });
      return NextResponse.json(
        buildTMF620Error('500', 'Database Error', productError.message, 500),
        { status: 500 }
      );
    }

    // Fetch relationships
    const { data: relationships } = await supabase
      .from('product_relationships')
      .select(`
        *,
        target_product:admin_products!target_product_id (
          id,
          name,
          slug,
          category,
          status
        )
      `)
      .eq('source_product_id', id);

    // Get active pricing
    const activePricing = Array.isArray(product.pricing)
      ? product.pricing.find((p: { approval_status: string }) => p.approval_status === 'approved')
      : null;

    // Map to TMF620 format
    const offering = mapProductToTMF620(
      product,
      activePricing,
      product.features || [],
      (relationships as ProductRelationshipWithTarget[]) || []
    );

    return NextResponse.json(offering);
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
