import { NextResponse } from 'next/server';
import { getCompetitorAlertsSummary } from '@/lib/sales-engine/competitor-intelligence-service';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/competitor-intelligence
 * Returns competitor intelligence summary: recent price changes,
 * affected zones, and competitive position by product.
 */
export async function GET() {
  try {
    const result = await getCompetitorAlertsSummary();

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
