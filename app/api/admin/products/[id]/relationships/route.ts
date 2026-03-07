import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { apiLogger } from '@/lib/logging';
import type {
  ProductRelationship,
  ProductRelationshipWithTarget,
  CreateProductRelationshipInput,
} from '@/lib/types/product-relationships';

/**
 * GET /api/admin/products/[id]/relationships
 * List all relationships for a product (as source)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    apiLogger.info('[Product Relationships] Fetching relationships', { productId: id });

    // Fetch relationships where this product is the source
    const { data: relationships, error } = await supabase
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
      .eq('source_product_id', id)
      .order('relationship_type')
      .order('sort_order');

    if (error) {
      apiLogger.error('[Product Relationships] Database error', { error: error.message });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch relationships' },
        { status: 500 }
      );
    }

    // Group by relationship type
    const grouped = {
      addons: relationships?.filter((r) => r.relationship_type === 'addon') || [],
      prerequisites: relationships?.filter((r) => r.relationship_type === 'requires') || [],
      exclusions: relationships?.filter((r) => r.relationship_type === 'excludes') || [],
      alternatives: relationships?.filter((r) => r.relationship_type === 'alternative') || [],
      bundleComponents: relationships?.filter((r) => r.relationship_type === 'includes') || [],
    };

    return NextResponse.json({
      success: true,
      data: relationships as ProductRelationshipWithTarget[],
      grouped,
    });
  } catch (error) {
    apiLogger.error('[Product Relationships] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products/[id]/relationships
 * Create a new relationship for a product
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceProductId } = await context.params;
    const supabase = await createClient();
    const body: CreateProductRelationshipInput = await request.json();

    // Verify admin authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    apiLogger.info('[Product Relationships] Creating relationship', {
      sourceProductId,
      targetProductId: body.target_product_id,
      type: body.relationship_type,
    });

    // Validate target product exists
    const { data: targetProduct, error: targetError } = await supabase
      .from('admin_products')
      .select('id, name')
      .eq('id', body.target_product_id)
      .single();

    if (targetError || !targetProduct) {
      return NextResponse.json(
        { success: false, error: 'Target product not found' },
        { status: 404 }
      );
    }

    // Prevent self-reference
    if (sourceProductId === body.target_product_id) {
      return NextResponse.json(
        { success: false, error: 'Cannot create relationship with self' },
        { status: 400 }
      );
    }

    // Create relationship
    const { data: relationship, error } = await supabase
      .from('product_relationships')
      .insert({
        source_product_id: sourceProductId,
        target_product_id: body.target_product_id,
        relationship_type: body.relationship_type,
        is_mandatory: body.is_mandatory ?? false,
        min_quantity: body.min_quantity ?? 0,
        max_quantity: body.max_quantity ?? 1,
        price_modifier: body.price_modifier ?? null,
        sort_order: body.sort_order ?? 0,
      })
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
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Relationship already exists' },
          { status: 409 }
        );
      }
      apiLogger.error('[Product Relationships] Insert error', { error: error.message });
      return NextResponse.json(
        { success: false, error: 'Failed to create relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: relationship },
      { status: 201 }
    );
  } catch (error) {
    apiLogger.error('[Product Relationships] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]/relationships
 * Delete a relationship by ID (passed in body or query param)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceProductId } = await context.params;
    const supabase = await createClient();

    // Verify admin authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get relationship ID from query param
    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('relationshipId');

    if (!relationshipId) {
      return NextResponse.json(
        { success: false, error: 'relationshipId query parameter required' },
        { status: 400 }
      );
    }

    apiLogger.info('[Product Relationships] Deleting relationship', {
      sourceProductId,
      relationshipId,
    });

    // Delete relationship
    const { error } = await supabase
      .from('product_relationships')
      .delete()
      .eq('id', relationshipId)
      .eq('source_product_id', sourceProductId);

    if (error) {
      apiLogger.error('[Product Relationships] Delete error', { error: error.message });
      return NextResponse.json(
        { success: false, error: 'Failed to delete relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('[Product Relationships] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
