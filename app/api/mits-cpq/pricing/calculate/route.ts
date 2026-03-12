/**
 * MITS CPQ Pricing Calculator API
 *
 * POST /api/mits-cpq/pricing/calculate
 *
 * Accepts a pricing configuration and returns the full pricing breakdown.
 * Uses the calculateMITSPricing function from lib/mits-cpq.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMITSPricing } from '@/lib/mits-cpq';
import type { MITSSelectedModule } from '@/lib/mits-cpq';

interface CalculatePricingRequest {
  tier_code: string;
  additional_licences?: number;
  selected_modules?: MITSSelectedModule[];
  discount_percent?: number;
  contract_term_months?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculatePricingRequest = await request.json();

    const {
      tier_code,
      additional_licences = 0,
      selected_modules = [],
      discount_percent = 0,
      contract_term_months = 12,
    } = body;

    if (!tier_code) {
      return NextResponse.json(
        { error: 'tier_code is required' },
        { status: 400 }
      );
    }

    // Validate numeric inputs
    if (
      typeof additional_licences !== 'number' ||
      additional_licences < 0 ||
      typeof discount_percent !== 'number' ||
      discount_percent < 0 ||
      discount_percent > 100 ||
      typeof contract_term_months !== 'number' ||
      contract_term_months < 1
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid input: additional_licences must be >= 0, discount_percent must be 0-100, contract_term_months must be >= 1',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the requested tier
    const { data: tier, error: tierError } = await supabase
      .from('mits_tier_catalogue')
      .select('*')
      .eq('tier_code', tier_code)
      .eq('is_active', true)
      .single();

    if (tierError || !tier) {
      return NextResponse.json(
        { error: `Tier '${tier_code}' not found or inactive` },
        { status: 404 }
      );
    }

    // Fetch M365 pricing for reference (used for accurate direct cost if needed)
    const { data: m365Pricing } = await supabase
      .from('mits_m365_pricing')
      .select('*')
      .eq('licence_type', tier.m365_licence_type)
      .eq('is_active', true)
      .maybeSingle();

    // If we have exact CSP cost from the M365 pricing table, override the tier's proxy rate
    // The pricing calculator uses tier.m365_additional_rate as a proxy for direct cost;
    // we surface m365Pricing alongside the result so callers can use exact figures if needed.
    const pricing = calculateMITSPricing({
      tier,
      additional_licences,
      selected_modules,
      contract_term_months,
      manual_discount_percent: discount_percent,
    });

    return NextResponse.json({
      success: true,
      pricing,
      // Include m365Pricing so the client can display licence details
      m365_licence: m365Pricing ?? null,
    });
  } catch (error) {
    console.error('[mits-cpq/pricing/calculate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
