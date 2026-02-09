import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get total count
    const { count: total } = await supabase
      .from('mtn_business_deals')
      .select('*', { count: 'exact', head: true });

    // Get active count
    const { count: active } = await supabase
      .from('mtn_business_deals')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Get deals expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { count: expiringSoon } = await supabase
      .from('mtn_business_deals')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .lte('promo_end_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('promo_end_date', new Date().toISOString().split('T')[0]);

    // Get average price
    const { data: priceData } = await supabase
      .from('mtn_business_deals')
      .select('monthly_price_incl_vat')
      .eq('active', true);

    const avgPrice = priceData && priceData.length > 0
      ? priceData.reduce((sum, deal) => sum + (deal.monthly_price_incl_vat || 0), 0) / priceData.length
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        total: total || 0,
        active: active || 0,
        expiringSoon: expiringSoon || 0,
        avgPrice: Math.round(avgPrice * 100) / 100
      }
    });

  } catch (error) {
    apiLogger.error('Error fetching MTN deals stats', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
