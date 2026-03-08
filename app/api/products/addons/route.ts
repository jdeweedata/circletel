import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// South African VAT rate (15%)
const VAT_RATE = 0.15;

export interface ProductAddon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  price_incl_vat: number;
  price_type: 'monthly' | 'once-off';
  compatible_product_categories: string[];
  icon: string | null;
  sort_order: number;
}

/**
 * GET /api/products/addons
 *
 * Fetches available product add-ons, optionally filtered by category.
 *
 * Query params:
 * - category: Filter by compatible product category (e.g., 'connectivity', 'wireless', '5g')
 *
 * Returns prices including VAT for customer display.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const supabase = await createClient();

    let query = supabase
      .from('product_addons')
      .select('id, name, slug, description, short_description, price, price_type, compatible_product_categories, icon, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    // Filter by category if provided
    if (category) {
      query = query.contains('compatible_product_categories', [category]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API] Error fetching addons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch add-ons' },
        { status: 500 }
      );
    }

    // Transform to include VAT-inclusive prices
    const addons: ProductAddon[] = (data || []).map((addon) => ({
      id: addon.id,
      name: addon.name,
      slug: addon.slug,
      description: addon.description,
      short_description: addon.short_description,
      price: addon.price,
      price_incl_vat: Math.round(addon.price * (1 + VAT_RATE)),
      price_type: addon.price_type,
      compatible_product_categories: addon.compatible_product_categories || [],
      icon: addon.icon,
      sort_order: addon.sort_order,
    }));

    return NextResponse.json({
      addons,
      count: addons.length,
    });
  } catch (error) {
    console.error('[API] Unexpected error in addons route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
