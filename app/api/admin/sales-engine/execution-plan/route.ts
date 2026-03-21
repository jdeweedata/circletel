import { NextResponse } from 'next/server';
import { getExecutionSnapshot } from '@/lib/sales-engine/execution-plan-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/execution-plan
 * Returns the full execution plan snapshot: MRR vs targets, MSC coverage,
 * phase gates, hiring triggers, and alerts.
 */
export async function GET() {
  try {
    const result = await getExecutionSnapshot();

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
