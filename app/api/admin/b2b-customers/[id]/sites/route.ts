import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await context.params;

  const sessionClient = await createClientWithSession();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, is_active')
    .eq('id', user.id)
    .single();

  if (!adminUser || !adminUser.is_active) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
