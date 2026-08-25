/**
 * Three-way Netcash ↔ Zoho Books bank match cron
 *
 * Pulls Netcash statement lines + Zoho cashbook deposits for yesterday (SAST),
 * auto-matches by amount/date/reference, and persists queue auto_matched rows.
 *
 * Schedule: 0 7 * * * (07:00 UTC ≈ 09:00 SAST) — after payment recon.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runThreeWayBankMatch } from '@/lib/billing/recon-hub/run-bank-match';
import { cronLogger } from '@/lib/logging';

export const maxDuration = 600;
export const dynamic = 'force-dynamic';

function yesterdayBoundsUtc(): { from: string; to: string } {
  // Africa/Johannesburg calendar yesterday → UTC ISO [from, to)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  // SAST = UTC+2 → local midnight is 22:00 UTC previous calendar day
  const todayStartUtcMs = Date.UTC(y, m - 1, d) - 2 * 3_600_000;
  const yesterdayStartUtcMs = todayStartUtcMs - 86_400_000;
  return {
    from: new Date(yesterdayStartUtcMs).toISOString(),
    to: new Date(todayStartUtcMs).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      cronLogger.error('[ThreeWayBankMatch] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const bounds =
      fromParam && toParam
        ? { from: fromParam, to: toParam }
        : yesterdayBoundsUtc();

    cronLogger.info('[ThreeWayBankMatch] Starting full bank match', bounds);

    const result = await runThreeWayBankMatch(bounds.from, bounds.to, 'full');

    const durationMs = Date.now() - startTime;
    cronLogger.info('[ThreeWayBankMatch] Completed', {
      ...result.summary,
      exceptionCount: result.exceptions.length,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      dateRange: result.dateRange,
      summary: result.summary,
      exceptionCount: result.exceptions.length,
      durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cronLogger.error('[ThreeWayBankMatch] Failed', { error: message });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
