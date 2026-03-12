/**
 * MITS CPQ Tiers API
 *
 * GET /api/mits-cpq/tiers - Return active tiers and M365 pricing from database
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch active tiers ordered by sort_order
    const { data: tiers, error: tiersError } = await supabase
      .from('mits_tier_catalogue')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (tiersError) {
      console.error('[mits-cpq/tiers] Tiers query error:', tiersError);
      return NextResponse.json(
        { error: 'Failed to fetch tiers', details: tiersError.message },
        { status: 500 }
      );
    }

    // Fetch active M365 pricing
    const { data: m365Pricing, error: m365Error } = await supabase
      .from('mits_m365_pricing')
      .select('*')
      .eq('is_active', true);

    if (m365Error) {
      console.error('[mits-cpq/tiers] M365 pricing query error:', m365Error);
      return NextResponse.json(
        { error: 'Failed to fetch M365 pricing', details: m365Error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tiers: tiers ?? [],
      m365Pricing: m365Pricing ?? [],
    });
  } catch (error) {
    console.error('[mits-cpq/tiers] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
