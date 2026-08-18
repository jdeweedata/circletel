import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, hasPermission, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getProductLine, redactProductLineCosts } from '@/lib/products/product-line-service';
import { updateTemplate } from '@/lib/products/bundle-template-service';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const { code } = await context.params;
  const supabase = await createClient();
  try {
    const line = await getProductLine(supabase, code);
    if (!line) {
      return NextResponse.json({ success: false, error: 'Flyer not found' }, { status: 404 });
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
  context: { params: Promise<{ code: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.EDIT);
  if (denied) return denied;

  const { code } = await context.params;
  const body = await request.json();
  const supabase = await createClient();
  try {
    const line = await updateTemplate(supabase, code, body);
    const showCosts = hasPermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW_COSTS);
    return NextResponse.json({
      success: true,
      line: showCosts ? line : redactProductLineCosts(line),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save';
    const status = message.includes('cannot be changed') ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
