import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get active promotions count
    const { count: activePromotions, error: activeError } = await supabase
      .from('promotions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      console.error('Error fetching active promotions:', activeError);
    }

    // Get total redemptions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: totalRedemptions, error: redemptionError } = await supabase
      .from('promotion_usage')
      .select('*', { count: 'exact', head: true })
      .gte('used_at', startOfMonth.toISOString());

    if (redemptionError) {
      console.error('Error fetching redemptions:', redemptionError);
    }

    // Get revenue from promotions (sum of discount_amount)
    const { data: revenueData, error: revenueError } = await supabase
      .from('promotion_usage')
      .select('discount_amount')
      .gte('used_at', startOfMonth.toISOString());

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
    }

    const revenueFromPromotions = revenueData?.reduce(
      (sum, row) => sum + (Number(row.discount_amount) || 0),
      0
    ) || 0;

    // Calculate conversion rate (redemptions / total promo views)
    // For now, use a placeholder calculation
    const conversionRate = totalRedemptions && activePromotions
      ? Math.round((totalRedemptions / (activePromotions * 100)) * 100 * 10) / 10
      : 0;

    return NextResponse.json({
      activePromotions: activePromotions || 0,
      totalRedemptions: totalRedemptions || 0,
      conversionRate: Math.min(conversionRate, 100), // Cap at 100%
      revenueFromPromotions,
    });
  } catch (error) {
    console.error('Error fetching marketing stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing stats' },
      { status: 500 }
    );
  }
}
