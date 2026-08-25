import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { loadExceptionDetail } from '@/lib/billing/cycle-match/load-workbench';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await context.params;
    const data = await loadExceptionDetail(id);
    if (!data) {
      return NextResponse.json({ error: 'Exception not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load exception';
    apiLogger.error('[cycle-match] exception GET failed', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
