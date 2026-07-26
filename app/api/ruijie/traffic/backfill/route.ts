/**
 * Ruijie Traffic History Backfill
 * POST /api/ruijie/traffic/backfill
 *
 * Queues Inngest `ruijie/traffic.backfill.requested` to pull the longest
 * practical hourly window from Ruijie into `ruijie_traffic_rollups`.
 *
 * Body (optional JSON): { hours?: number } — clamped to 1..168
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { inngest } from '@/lib/inngest/client';
import { apiLogger } from '@/lib/logging/logger';
import {
  clampTrafficHistoryHours,
  RUIJIE_TRAFFIC_HISTORY_HOURS,
} from '@/lib/ruijie/traffic-history';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    let hours = RUIJIE_TRAFFIC_HISTORY_HOURS;
    try {
      const body = await request.json();
      if (body && typeof body.hours === 'number') {
        hours = clampTrafficHistoryHours(body.hours);
      }
    } catch {
      // empty body is fine — use default history window
    }

    await inngest.send({
      name: 'ruijie/traffic.backfill.requested',
      data: {
        hours,
        triggered_by: 'manual',
        admin_user_id: authResult.adminUser!.id,
      },
    });

    return NextResponse.json({
      status: 'queued',
      message: 'Traffic history backfill queued',
      hours,
    });
  } catch (error) {
    apiLogger.error('Ruijie traffic backfill trigger error', { error });
    return NextResponse.json({ error: 'Failed to queue traffic backfill' }, { status: 500 });
  }
}
