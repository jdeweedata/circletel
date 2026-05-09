import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const { id: accountId } = await context.params;

  const supabase = await createClient();

  const { data: sites, error } = await supabase
    .from('corporate_sites')
    .select('id, site_name, status, technology, monthly_fee, package_id, installed_at, wholesale_order_ref')
    .eq('corporate_id', accountId)
    .order('site_number', { ascending: true });

  if (error) {
    console.error('[Admin Sites] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }

  return NextResponse.json({ sites: sites ?? [] });
}
