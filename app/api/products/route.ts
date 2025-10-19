import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

/**
 * GET /api/products
 * Get all active products (approved packages)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const minSpeed = searchParams.get('minSpeed');
    const maxPrice = searchParams.get('maxPrice');

    let query = supabase
      .from('service_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by minimum speed if provided
    if (minSpeed) {
      query = query.gte('speed', minSpeed);
    }

    // Filter by maximum price if provided
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products,
      total_count: products?.length || 0
    });

  } catch (error: any) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
