import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSuperUser } from '@/lib/portal/require-portal-user';
import { customerFacingPortalUsers } from '@/lib/portal/internal-users';
import { isInvitableHqRole } from '@/lib/portal/access-templates';
import {
  portalInviteRedirectUrl,
  sendPortalAccessEmail,
} from '@/lib/portal/invite-email';

export async function GET() {
  const auth = await requirePortalSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const { data: portalUsers, error } = await adminDb
    .from('b2b_portal_users')
    .select(
      'id, auth_user_id, display_name, email, role, site_id, created_at, is_internal, corporate_sites(id, site_name)'
    )
    .eq('organisation_id', portalUser.organisation_id)
    .eq('is_internal', false)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    portalUsers: customerFacingPortalUsers(portalUsers ?? []),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePortalSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb, authUserId } = auth;

  try {
    const body = await request.json();
    const { email, display_name, role } = body as {
      email?: string;
      display_name?: string;
      role?: string;
    };

    if (!email || !display_name || !isInvitableHqRole(role)) {
      return NextResponse.json(
        { error: 'email, display_name, and a Finance, Operations, or Viewer role are required' },
        { status: 400 }
      );
    }

    const inviteEmail = email;
    const inviteName = display_name;
    const inviteRole = role;

    const {
      data: { user: invitedUser },
      error: inviteError,
      } = await adminDb.auth.admin.inviteUserByEmail(inviteEmail, {
      data: {
        portal_role: inviteRole,
        organisation_id: portalUser.organisation_id,
      },
      redirectTo: portalInviteRedirectUrl(),
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
          display_name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          site_id: null,
          created_by: authUserId,
        })
        .select(
          'id, auth_user_id, display_name, email, role, site_id, created_at, corporate_sites(id, site_name)'
        )
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      const emailResult = await sendPortalAccessEmail({
        to: inviteEmail,
        displayName: inviteName,
        role: inviteRole,
        organisationName: portalUser.organisation_name,
        invited,
      });

      return NextResponse.json({
        portalUser: created,
        invited,
        emailWarning: emailResult.warning,
      });
    }

    if (inviteError) {
      if (inviteError.message?.includes('already been registered')) {
        const {
          data: { users },
        } = await adminDb.auth.admin.listUsers({ perPage: 1000 });
        const existingUser = users?.find((u) => u.email === inviteEmail);
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
