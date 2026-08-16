import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getPublishGateForSku } from '@/lib/products/product-line-service';

export const runtime = 'nodejs';

/** GET /api/admin/product-lines/publish-check?sku= */
export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const sku = new URL(request.url).searchParams.get('sku');
  if (!sku) {
    return NextResponse.json({ success: false, error: 'sku required' }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const result = await getPublishGateForSku(supabase, sku);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
