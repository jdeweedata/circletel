/**
 * Admin Stats API Route
 * GET /api/admin/stats - Fetch dashboard statistics
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch products with service role access
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('pricing, status');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch products',
          details: productsError.message
        },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalProducts = products?.length || 0;
    const activeProducts = (products || []).filter((p: any) => p.status === 'active');
    const approvedProducts = activeProducts.length;

    // Calculate monthly recurring revenue
    const revenueImpact = activeProducts.reduce((sum: number, p: any) => {
      // pricing is a JSONB object like {"monthly": 799, "installation": 0}
      const price = typeof p.pricing === 'object' && p.pricing !== null
        ? parseFloat(p.pricing.monthly?.toString() || '0')
        : 0;
      return sum + price;
    }, 0);

    const stats = {
      totalProducts,
      pendingApprovals: 0, // No approval workflow implemented yet
      approvedProducts,
      revenueImpact: Math.round(revenueImpact),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
