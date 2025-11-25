import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/products
 * Fetch products with optional filtering by service type
 *
 * Query params:
 * - service_type: Filter by service type (5G, Fibre, LTE, etc.)
 * - category: Filter by product_category
 * - featured: Only featured products (true/false)
 * - limit: Max number of results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const supabase = await createClient();

    let query = supabase
      .from('service_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('price', { ascending: true });

    // Apply filters
    if (serviceType) {
      query = query.ilike('service_type', `%${serviceType}%`);
    }

    if (category) {
      query = query.eq('product_category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Parse metadata for each product
    const processedProducts = (products || []).map((product) => {
      if (typeof product.metadata === 'string') {
        try {
          product.metadata = JSON.parse(product.metadata);
        } catch {
          product.metadata = {};
        }
      }
      return product;
    });

    return NextResponse.json({
      products: processedProducts,
      count: processedProducts.length,
    });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
