import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { filterCpeDevices } from '@/lib/products/cpe-filter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.VIEW);
  if (denied) return denied;

  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('code', 'RECTRON')
    .maybeSingle();

  if (!supplier) {
    return NextResponse.json({ success: true, products: [], last_synced_at: null });
  }

  let query = supabase
    .from('supplier_products')
    .select('sku, name, category, subcategory, description, manufacturer, cost_price, last_synced_at, is_active')
    .eq('supplier_id', supplier.id)
    .eq('is_active', true)
    .limit(400);

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const products = filterCpeDevices(data ?? [], 40);
  const lastSynced = products[0]?.last_synced_at ?? data?.[0]?.last_synced_at ?? null;
  return NextResponse.json({ success: true, products, last_synced_at: lastSynced });
}
