import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, hasPermission, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { listProductLines, redactProductLineCosts } from '@/lib/products/product-line-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const gate1Only = new URL(request.url).searchParams.get('gate1') === '1';
  const supabase = await createClient();
  try {
    const lines = await listProductLines(supabase, { gate1Only });
    const showCosts = hasPermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW_COSTS);
    return NextResponse.json({
      success: true,
      show_costs: showCosts,
      lines: showCosts ? lines : lines.map(redactProductLineCosts),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list product lines' },
      { status: 500 }
    );
  }
}
