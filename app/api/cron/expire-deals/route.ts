import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cronLogger } from '@/lib/logging';

/**
 * Cron job to automatically expire MTN deals
 * This should be called daily via Vercel Cron or similar
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-deals",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    
    // Find all deals that should be expired
    const { data: expiredDeals, error: fetchError } = await supabase
      .from('mtn_business_deals')
      .select('id, deal_id, deal_name, promo_end_date')
      .eq('active', true)
      .lt('promo_end_date', today);
    
    if (fetchError) {
      cronLogger.error('Error fetching expired deals:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expired deals' },
        { status: 500 }
      );
    }
    
    if (!expiredDeals || expiredDeals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No deals to expire',
        expired: 0
      });
    }
    
    // Update deals to inactive
    const { error: updateError } = await supabase
      .from('mtn_business_deals')
      .update({ active: false })
      .in('id', expiredDeals.map(d => d.id));
    
    if (updateError) {
      cronLogger.error('Error updating deals:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to expire deals' },
        { status: 500 }
      );
    }
    
    // Log the expiry
    cronLogger.info(`Expired ${expiredDeals.length} MTN deals:`, expiredDeals.map(d => d.deal_id));
    
    return NextResponse.json({
      success: true,
      message: `Successfully expired ${expiredDeals.length} deals`,
      expired: expiredDeals.length,
      deals: expiredDeals.map(d => ({
        deal_id: d.deal_id,
        deal_name: d.deal_name,
        promo_end_date: d.promo_end_date
      }))
    });
    
  } catch (error) {
    cronLogger.error('Error in expire-deals cron:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
