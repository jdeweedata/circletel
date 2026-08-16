import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { priceBundle, type BundlePriceInput } from '@/lib/products/bundle-pricing';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const body = (await request.json()) as BundlePriceInput;
  if (!body.template || !body.termMonths) {
    return NextResponse.json({ success: false, error: 'template and termMonths required' }, { status: 400 });
  }

  const pricing = priceBundle({
    template: body.template,
    termMonths: body.termMonths,
    billedInclVat: body.billedInclVat,
    heliosIncludesCpe: Boolean(body.heliosIncludesCpe),
    cpeCostExcl: Number(body.cpeCostExcl) || 0,
    addCpeUpgrade: Boolean(body.addCpeUpgrade),
    m365Seats: Number(body.m365Seats) || 0,
    connectivityCostExcl: body.connectivityCostExcl,
  });

  return NextResponse.json({ success: true, pricing });
}
