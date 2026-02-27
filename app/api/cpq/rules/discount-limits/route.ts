/**
 * CPQ Discount Limits API
 *
 * GET /api/cpq/rules/discount-limits - Get discount limits for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDiscountLimits, getAllDiscountLimits } from '@/lib/cpq/rule-engine';
import { RoleType } from '@/lib/cpq/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleType = searchParams.get('role_type') as RoleType | null;
    const roleName = searchParams.get('role_name');
    const all = searchParams.get('all') === 'true';

    // If requesting all limits (admin only)
    if (all) {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!adminUser || !['super_admin', 'service_delivery_manager', 'product_manager'].includes(adminUser.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const limits = await getAllDiscountLimits();
      return NextResponse.json({
        success: true,
        limits,
      });
    }

    // If specific role requested
    if (roleType && roleName) {
      const limits = await getDiscountLimits(roleType, roleName);

      if (!limits) {
        return NextResponse.json({ error: 'Limits not found for specified role' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        limits,
      });
    }

    // Get limits for current user
    // First check if admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser) {
      const limits = await getDiscountLimits('admin', adminUser.role);
      return NextResponse.json({
        success: true,
        role_type: 'admin',
        role_name: adminUser.role,
        limits,
      });
    }

    // Check if partner
    const { data: partner } = await supabase
      .from('partners')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    if (partner) {
      const tier = partner.tier || 'bronze';
      const limits = await getDiscountLimits('partner', tier);
      return NextResponse.json({
        success: true,
        role_type: 'partner',
        role_name: tier,
        limits,
      });
    }

    return NextResponse.json(
      { error: 'User role not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[cpq-discount-limits] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
