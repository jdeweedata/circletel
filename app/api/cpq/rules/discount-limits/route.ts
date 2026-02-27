/**
 * CPQ Discount Limits API
 *
 * GET /api/cpq/rules/discount-limits - Get discount limits for a role
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { getDiscountLimits, getAllDiscountLimits } from '@/lib/cpq/rule-engine';
import type { RoleType, PartnerTier, AdminRole } from '@/lib/cpq/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const roleType = searchParams.get('role_type') as RoleType | null;
    const roleName = searchParams.get('role_name') as PartnerTier | AdminRole | null;

    // If no specific role requested, return all limits
    if (!roleType || !roleName) {
      const allLimits = await getAllDiscountLimits();
      return NextResponse.json({
        success: true,
        data: allLimits,
      });
    }

    // Validate role_type
    if (!['admin', 'partner'].includes(roleType)) {
      return NextResponse.json(
        { error: 'Invalid role_type. Must be "admin" or "partner"' },
        { status: 400 }
      );
    }

    // Validate role_name based on type
    const validPartnerTiers = ['bronze', 'silver', 'gold', 'platinum'];
    const validAdminRoles = ['sales_rep', 'sales_manager', 'director', 'super_admin'];

    if (roleType === 'partner' && !validPartnerTiers.includes(roleName)) {
      return NextResponse.json(
        { error: `Invalid partner tier. Must be one of: ${validPartnerTiers.join(', ')}` },
        { status: 400 }
      );
    }

    if (roleType === 'admin' && !validAdminRoles.includes(roleName)) {
      return NextResponse.json(
        { error: `Invalid admin role. Must be one of: ${validAdminRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const limits = await getDiscountLimits(roleType, roleName);

    if (!limits) {
      return NextResponse.json(
        { error: 'No discount limits found for this role' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        role_type: roleType,
        role_name: roleName,
        ...limits,
      },
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error getting discount limits', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
