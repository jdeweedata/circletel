/**
 * CPQ Product Eligibility Check API
 *
 * POST /api/cpq/rules/check-eligibility - Check if a product is eligible
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { checkEligibility } from '@/lib/cpq/rule-engine';
import type { CheckEligibilityRequest, CoverageType, CustomerType, PartnerTier } from '@/lib/cpq/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckEligibilityRequest;

    // Validate required fields
    if (!body.product_id || !body.coverage_type || !body.customer_type) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, coverage_type, customer_type' },
        { status: 400 }
      );
    }

    // Validate coverage_type
    const validCoverageTypes: CoverageType[] = ['fibre', '5g', 'lte', 'microwave', 'tarana', 'dfa'];
    if (!validCoverageTypes.includes(body.coverage_type)) {
      return NextResponse.json(
        { error: `Invalid coverage_type. Must be one of: ${validCoverageTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate customer_type
    const validCustomerTypes: CustomerType[] = ['residential', 'business', 'enterprise'];
    if (!validCustomerTypes.includes(body.customer_type)) {
      return NextResponse.json(
        { error: `Invalid customer_type. Must be one of: ${validCustomerTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate partner_tier if provided
    const validPartnerTiers: PartnerTier[] = ['bronze', 'silver', 'gold', 'platinum'];
    if (body.partner_tier && !validPartnerTiers.includes(body.partner_tier)) {
      return NextResponse.json(
        { error: `Invalid partner_tier. Must be one of: ${validPartnerTiers.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await checkEligibility(
      body.product_id,
      body.coverage_type,
      body.customer_type,
      body.partner_tier,
      body.region,
      body.quantity ?? 1
    );

    return NextResponse.json({
      success: true,
      data: {
        product_id: body.product_id,
        ...result,
      },
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error checking eligibility', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
