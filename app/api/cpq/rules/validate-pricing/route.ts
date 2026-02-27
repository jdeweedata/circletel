/**
 * CPQ Pricing Validation API
 *
 * POST /api/cpq/rules/validate-pricing - Validate discount against role limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { validatePricing } from '@/lib/cpq/rule-engine';
import type { ValidatePricingRequest, RoleType, PartnerTier, AdminRole } from '@/lib/cpq/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidatePricingRequest;

    // Validate required fields
    if (body.discount_percent === undefined || !body.role_type || !body.role_name) {
      return NextResponse.json(
        { error: 'Missing required fields: discount_percent, role_type, role_name' },
        { status: 400 }
      );
    }

    // Validate discount_percent
    if (body.discount_percent < 0 || body.discount_percent > 100) {
      return NextResponse.json(
        { error: 'discount_percent must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate role_type
    if (!['admin', 'partner'].includes(body.role_type)) {
      return NextResponse.json(
        { error: 'Invalid role_type. Must be "admin" or "partner"' },
        { status: 400 }
      );
    }

    // Validate role_name based on type
    const validPartnerTiers: PartnerTier[] = ['bronze', 'silver', 'gold', 'platinum'];
    const validAdminRoles: AdminRole[] = ['sales_rep', 'sales_manager', 'director', 'super_admin'];

    if (body.role_type === 'partner' && !validPartnerTiers.includes(body.role_name as PartnerTier)) {
      return NextResponse.json(
        { error: `Invalid partner tier. Must be one of: ${validPartnerTiers.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.role_type === 'admin' && !validAdminRoles.includes(body.role_name as AdminRole)) {
      return NextResponse.json(
        { error: `Invalid admin role. Must be one of: ${validAdminRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await validatePricing(
      body.discount_percent,
      body.role_type as RoleType,
      body.role_name as PartnerTier | AdminRole,
      body.product_ids
    );

    return NextResponse.json({
      success: true,
      data: {
        discount_percent: body.discount_percent,
        role_type: body.role_type,
        role_name: body.role_name,
        ...result,
      },
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error validating pricing', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
