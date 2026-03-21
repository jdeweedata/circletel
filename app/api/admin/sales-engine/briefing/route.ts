import { NextResponse } from 'next/server';
import { getDailyBriefing } from '@/lib/sales-engine/briefing-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/briefing
 * Returns the aggregated daily sales briefing.
 */
export async function GET() {
  try {
    const result = await getDailyBriefing();

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
