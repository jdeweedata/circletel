import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/products/[slug]
 * Fetch a single product by slug for public product detail pages
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Product slug is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First try to find by slug
    let { data: product, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    // If not found by slug, try to find by ID (for backwards compatibility)
    if (!product && !error?.message?.includes('multiple')) {
      const idResult = await supabase
        .from('service_packages')
        .select('*')
        .eq('id', slug)
        .eq('active', true)
        .single();

      if (idResult.data) {
        product = idResult.data;
        error = null;
      }
    }

    // If still not found, try matching by name (slugified)
    if (!product) {
      const { data: allProducts } = await supabase
        .from('service_packages')
        .select('*')
        .eq('active', true);

      if (allProducts) {
        product = allProducts.find((p) => {
          const generatedSlug = p.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          return generatedSlug === slug;
        }) || null;
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Parse metadata if it's a string
    if (typeof product.metadata === 'string') {
      try {
        product.metadata = JSON.parse(product.metadata);
      } catch {
        product.metadata = {};
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
