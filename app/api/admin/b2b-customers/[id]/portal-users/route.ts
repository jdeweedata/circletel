import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)
    .eq('is_active', true)
    .single();
  return adminUser ? user : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await context.params;
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: portalUsers, error } = await supabase
      .from('b2b_portal_users')
      .select('id, auth_user_id, display_name, email, role, site_id, created_at, corporate_sites(id, site_name)')
      .eq('organisation_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ portalUsers: portalUsers ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await context.params;
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, display_name, role, site_id } = body;

    if (!email || !display_name || !role) {
      return NextResponse.json({ error: 'email, display_name, and role are required' }, { status: 400 });
    }

    if (!['admin', 'site_user'].includes(role)) {
      return NextResponse.json({ error: 'role must be admin or site_user' }, { status: 400 });
    }

    if (role === 'site_user' && !site_id) {
      return NextResponse.json({ error: 'site_id is required for site_user role' }, { status: 400 });
    }

    const { data: { user: invitedUser }, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { portal_role: role, organisation_id: accountId },
    });

    if (inviteError) {
      if (inviteError.message?.includes('already been registered')) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users?.find((u) => u.email === email);
        if (!existingUser) {
          return NextResponse.json({ error: 'User exists but could not be found' }, { status: 400 });
        }

        const { data: existingPortalUser } = await supabase
          .from('b2b_portal_users')
          .select('id')
          .eq('auth_user_id', existingUser.id)
          .eq('organisation_id', accountId)
          .single();

        if (existingPortalUser) {
          return NextResponse.json({ error: 'User already has portal access for this organisation' }, { status: 409 });
        }

        const { data: portalUser, error: insertError } = await supabase
          .from('b2b_portal_users')
          .insert({
            auth_user_id: existingUser.id,
            organisation_id: accountId,
            display_name,
            email,
            role,
            site_id: role === 'site_user' ? site_id : null,
            created_by: admin.id,
          })
          .select('id, auth_user_id, display_name, email, role, site_id, created_at, corporate_sites(id, site_name)')
          .single();

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ portalUser, invited: false });
      }

      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    if (!invitedUser) {
      return NextResponse.json({ error: 'Invite succeeded but no user returned' }, { status: 500 });
    }

    const { data: portalUser, error: insertError } = await supabase
      .from('b2b_portal_users')
      .insert({
        auth_user_id: invitedUser.id,
        organisation_id: accountId,
        display_name,
        email,
        role,
        site_id: role === 'site_user' ? site_id : null,
        created_by: admin.id,
      })
      .select('id, auth_user_id, display_name, email, role, site_id, created_at, corporate_sites(id, site_name)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ portalUser, invited: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
