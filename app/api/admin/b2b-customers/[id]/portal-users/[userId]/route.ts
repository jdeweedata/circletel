import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id: accountId, userId } = await context.params;
    const supabase = await createClient();

    const { data: portalUser } = await supabase
      .from('b2b_portal_users')
      .select('id, auth_user_id')
      .eq('id', userId)
      .eq('organisation_id', accountId)
      .single();

    if (!portalUser) {
      return NextResponse.json({ error: 'Portal user not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('b2b_portal_users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
