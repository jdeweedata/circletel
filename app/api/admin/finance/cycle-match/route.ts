import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { loadCycleMatchWorkbench } from '@/lib/billing/cycle-match/load-workbench';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const data = await loadCycleMatchWorkbench(
      searchParams.get('month'),
      searchParams.get('exceptionId')
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load cycle match';
    apiLogger.error('[cycle-match] GET failed', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
