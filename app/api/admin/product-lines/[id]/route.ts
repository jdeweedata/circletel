import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, hasPermission, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import {
  getProductLine,
  patchProductLine,
  approveProductLine,
  redactProductLineCosts,
  type ProductLinePatch,
} from '@/lib/products/product-line-service';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const { id } = await context.params;
  const supabase = await createClient();
  try {
    const line = await getProductLine(supabase, id);
    if (!line) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const showCosts = hasPermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW_COSTS);
    return NextResponse.json({
      success: true,
      show_costs: showCosts,
      line: showCosts ? line : redactProductLineCosts(line),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, [
    PERMISSIONS.PRODUCTS.EDIT,
    PERMISSIONS.PRODUCTS.APPROVE,
  ]);
  if (denied) return denied;

  const { id } = await context.params;
  const body = (await request.json()) as ProductLinePatch & {
    finance_approve?: boolean;
    finance_approval_notes?: string;
  };
  const supabase = await createClient();

  try {
    if (body.finance_approve) {
      const approveDenied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.APPROVE);
      if (approveDenied) return approveDenied;
      const line = await approveProductLine(
        supabase,
        id,
        auth.adminUser.id,
        body.finance_approval_notes
      );
      return NextResponse.json({ success: true, line });
    }

    const { finance_approve: _fa, finance_approval_notes: _notes, ...patch } = body;
    const line = await patchProductLine(supabase, id, patch);
    return NextResponse.json({ success: true, line });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
