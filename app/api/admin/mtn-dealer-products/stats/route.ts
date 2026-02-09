import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

// GET /api/admin/mtn-dealer-products/stats - Get product statistics and categories
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get overall stats
    const { data: products, error: productsError } = await supabase
      .from('mtn_dealer_products')
      .select('id, status, technology, contract_term, has_device, mtn_price_incl_vat, commission_tier, promo_start_date, promo_end_date, device_status');

    if (productsError) {
      return NextResponse.json(
        { success: false, error: productsError.message },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: products.length,
      by_status: {
        active: products.filter(p => p.status === 'active').length,
        draft: products.filter(p => p.status === 'draft').length,
        inactive: products.filter(p => p.status === 'inactive').length,
        archived: products.filter(p => p.status === 'archived').length,
      },
      by_technology: {
        LTE: products.filter(p => p.technology === 'LTE').length,
        '5G': products.filter(p => p.technology === '5G').length,
        'LTE/5G': products.filter(p => p.technology === 'LTE/5G').length,
      },
      by_contract_term: {
        'month_to_month': products.filter(p => p.contract_term === 0).length,
        '12_months': products.filter(p => p.contract_term === 12).length,
        '24_months': products.filter(p => p.contract_term === 24).length,
        '36_months': products.filter(p => p.contract_term === 36).length,
      },
      by_device: {
        with_device: products.filter(p => p.has_device).length,
        sim_only: products.filter(p => !p.has_device).length,
      },
      by_commission_tier: {} as Record<string, number>,
      current_deals: products.filter(p => {
        const today = new Date().toISOString().split('T')[0];
        return p.promo_start_date && p.promo_start_date <= today &&
          (!p.promo_end_date || p.promo_end_date >= today);
      }).length,
      by_device_status: {
        available: products.filter(p => p.device_status === 'Available').length,
        out_of_stock: products.filter(p => p.device_status === 'Out of Stock').length,
        eol: products.filter(p => p.device_status === 'EOL').length,
        ctb: products.filter(p => p.device_status === 'CTB').length,
      },
      price_range: {
        min: Math.min(...products.map(p => p.mtn_price_incl_vat)),
        max: Math.max(...products.map(p => p.mtn_price_incl_vat)),
        avg: products.reduce((sum, p) => sum + p.mtn_price_incl_vat, 0) / products.length,
      },
    };

    // Calculate commission tier distribution
    products.forEach(p => {
      if (p.commission_tier) {
        stats.by_commission_tier[p.commission_tier] = (stats.by_commission_tier[p.commission_tier] || 0) + 1;
      }
    });

    // Get deal periods
    const { data: dealPeriods, error: periodsError } = await supabase
      .from('mtn_dealer_products')
      .select('promo_start_date, promo_end_date')
      .not('promo_start_date', 'is', null)
      .order('promo_start_date', { ascending: false });

    // Get unique deal periods
    const uniquePeriods = new Map<string, { start: string; end: string | null; count: number }>();
    dealPeriods?.forEach(p => {
      const key = `${p.promo_start_date}-${p.promo_end_date}`;
      if (!uniquePeriods.has(key)) {
        uniquePeriods.set(key, { start: p.promo_start_date, end: p.promo_end_date, count: 0 });
      }
      uniquePeriods.get(key)!.count++;
    });

    // Get recent import batches
    const { data: importBatches, error: batchesError } = await supabase
      .from('mtn_dealer_import_batches')
      .select('*')
      .order('import_date', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        deal_periods: Array.from(uniquePeriods.values()).slice(0, 10),
        recent_imports: importBatches || [],
      },
    });
  } catch (error) {
    apiLogger.error('[MTN Dealer Stats API] Error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
