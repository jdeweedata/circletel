import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { inngest } from '@/lib/inngest/client';
import { parseYearMonth } from '@/lib/billing/cycle-match/period';
import { runCycleMatch } from '@/lib/billing/cycle-match/run-cycle-match';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      month?: string;
      sync?: boolean;
    };
    const yearMonth = parseYearMonth(body.month);

    if (body.sync) {
      const result = await runCycleMatch({
        yearMonth,
        triggeredBy: 'manual',
        userId: auth.adminUser.id,
      });
      return NextResponse.json({ success: true, ...result });
    }

    await inngest.send({
      name: 'billing/cycle-match.requested',
      data: {
        triggered_by: 'manual',
        yearMonth,
        admin_user_id: auth.adminUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cycle match queued for ${yearMonth}`,
      yearMonth,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run cycle match';
    apiLogger.error('[cycle-match] run failed', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
