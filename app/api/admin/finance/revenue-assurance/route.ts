import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { loadRevenueAssurance } from '@/lib/billing/cycle-match/load-workbench';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const data = await loadRevenueAssurance(searchParams.get('month'));
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load revenue assurance';
    apiLogger.error('[revenue-assurance] GET failed', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
