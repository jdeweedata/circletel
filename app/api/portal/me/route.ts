import { NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: portalUser, error } = await supabase
    .from('b2b_portal_users')
    .select(`
      id,
      auth_user_id,
      organisation_id,
      site_id,
      role,
      display_name,
      email,
      corporate_accounts!inner (
        id,
        company_name,
        corporate_code
      ),
      corporate_sites (
        id,
        site_name
      )
    `)
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[Portal /me] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }

  if (!portalUser) {
    return NextResponse.json({ error: 'No portal access' }, { status: 403 });
  }

  const org = portalUser.corporate_accounts as any;
  const site = portalUser.corporate_sites as any;

  return NextResponse.json({
    user: {
      id: portalUser.id,
      auth_user_id: portalUser.auth_user_id,
      organisation_id: portalUser.organisation_id,
      site_id: portalUser.site_id,
      role: portalUser.role,
      display_name: portalUser.display_name,
      email: portalUser.email,
      organisation_name: org?.company_name ?? '',
      organisation_code: org?.corporate_code ?? '',
      site_name: site?.site_name ?? null,
    },
  });
}
