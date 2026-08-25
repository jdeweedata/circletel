import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { submitForReview } from '@/lib/products/bundle-template-service';
import type { FlyerWizardFields } from '@/lib/products/bundle-doc-fields';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.EDIT);
  if (denied) return denied;

  const { code } = await context.params;
  const fields = (await request.json()) as FlyerWizardFields;
  const supabase = await createClient();
  try {
    const line = await submitForReview(supabase, code, auth.adminUser.id, {
      ...fields,
      code: fields.code || code,
    });
    return NextResponse.json({ success: true, line });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not send' },
      { status: 400 }
    );
  }
}
