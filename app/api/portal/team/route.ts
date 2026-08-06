import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSuperUser } from '@/lib/portal/require-portal-user';

export async function GET() {
  const auth = await requirePortalSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const { data: portalUsers, error } = await adminDb
    .from('b2b_portal_users')
    .select(
      'id, auth_user_id, display_name, email, role, site_id, created_at, corporate_sites(id, site_name)'
    )
    .eq('organisation_id', portalUser.organisation_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ portalUsers: portalUsers ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requirePortalSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb, authUserId } = auth;

  try {
    const body = await request.json();
    const { email, display_name, site_id } = body as {
      email?: string;
      display_name?: string;
      site_id?: string;
    };

    if (!email || !display_name || !site_id) {
      return NextResponse.json(
        { error: 'email, display_name, and site_id are required' },
        { status: 400 }
      );
    }

    // Portal Super Users may only invite site_users (never another Super User)
    const role = 'site_user' as const;

    const { data: site } = await adminDb
      .from('corporate_sites')
      .select('id')
      .eq('id', site_id)
      .eq('corporate_id', portalUser.organisation_id)
      .maybeSingle();

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found for this organisation' },
        { status: 400 }
      );
    }

    const {
      data: { user: invitedUser },
      error: inviteError,
    } = await adminDb.auth.admin.inviteUserByEmail(email, {
      data: {
        portal_role: role,
        organisation_id: portalUser.organisation_id,
      },
    });

    async function insertPortalUser(authUserIdToLink: string, invited: boolean) {
      const { data: existingPortalUser } = await adminDb
        .from('b2b_portal_users')
        .select('id')
        .eq('auth_user_id', authUserIdToLink)
        .eq('organisation_id', portalUser.organisation_id)
        .maybeSingle();

      if (existingPortalUser) {
        return NextResponse.json(
          { error: 'User already has portal access for this organisation' },
          { status: 409 }
        );
      }

      const { data: created, error: insertError } = await adminDb
        .from('b2b_portal_users')
        .insert({
          auth_user_id: authUserIdToLink,
          organisation_id: portalUser.organisation_id,
          display_name,
          email,
          role,
          site_id,
          created_by: authUserId,
        })
        .select(
          'id, auth_user_id, display_name, email, role, site_id, created_at, corporate_sites(id, site_name)'
        )
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ portalUser: created, invited });
    }

    if (inviteError) {
      if (inviteError.message?.includes('already been registered')) {
        const {
          data: { users },
        } = await adminDb.auth.admin.listUsers({ perPage: 1000 });
        const existingUser = users?.find((u) => u.email === email);
        if (!existingUser) {
          return NextResponse.json(
            { error: 'User exists but could not be found' },
            { status: 400 }
          );
        }
        return insertPortalUser(existingUser.id, false);
      }

      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'Invite succeeded but no user returned' },
        { status: 500 }
      );
    }

    return insertPortalUser(invitedUser.id, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
