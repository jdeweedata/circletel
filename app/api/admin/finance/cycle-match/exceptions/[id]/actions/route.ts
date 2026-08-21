import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import {
  applyCycleMatchAction,
  type CycleMatchAction,
} from '@/lib/billing/cycle-match/actions';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS = new Set<CycleMatchAction>([
  'create_invoice',
  'credit_note',
  'debit_note',
  'request_mandate',
  'accept_variance',
  'apply_to_pattern',
]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const action = body.action as CycleMatchAction;
    if (!ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await applyCycleMatchAction(id, action, {
      id: auth.user.id,
      email: auth.user.email || undefined,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed';
    apiLogger.error('[cycle-match] exception action failed', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
