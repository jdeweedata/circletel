import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { transitionProductLine } from '@/lib/products/product-line-service';
import type { ProductLineLifecycle } from '@/lib/types/product-lines';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const denied = requirePermission(auth.adminUser, PERMISSIONS.PRODUCTS.APPROVE);
  if (denied) return denied;

  const { id } = await context.params;
  const body = (await request.json()) as { to?: ProductLineLifecycle; reason?: string };
  if (!body.to) {
    return NextResponse.json({ success: false, error: 'Missing target stage' }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const result = await transitionProductLine(supabase, id, body.to, { reason: body.reason });
    if (!result.gate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Transition blocked', gate: result.gate, line: result.line },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true, line: result.line, gate: result.gate });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
