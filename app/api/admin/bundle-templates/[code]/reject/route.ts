import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { rejectTemplate } from '@/lib/products/bundle-template-service';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.APPROVE);
  if (denied) return denied;

  const { code } = await context.params;
  const body = await request.json();
  const note = String(body.note || '').trim();
  if (!note) {
    return NextResponse.json(
      { success: false, error: 'What should sales change?' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  try {
    const line = await rejectTemplate(supabase, code, note);
    return NextResponse.json({ success: true, line });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not send back' },
      { status: 400 }
    );
  }
}
