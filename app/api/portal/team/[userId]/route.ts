import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSuperUser } from '@/lib/portal/require-portal-user';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requirePortalSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;
  const { userId } = await context.params;

  const { data: target } = await adminDb
    .from('b2b_portal_users')
    .select('id, role, auth_user_id')
    .eq('id', userId)
    .eq('organisation_id', portalUser.organisation_id)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: 'Portal user not found' }, { status: 404 });
  }

  if (target.id === portalUser.id) {
    return NextResponse.json(
      { error: 'You cannot remove your own Super User account' },
      { status: 400 }
    );
  }

  if (target.role === 'admin') {
    return NextResponse.json(
      { error: 'Cannot remove the organisation Super User' },
      { status: 400 }
    );
  }

  const { error: deleteError } = await adminDb
    .from('b2b_portal_users')
    .delete()
    .eq('id', userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
