import { NextRequest, NextResponse } from 'next/server';
import { getCashFlowProjection } from '@/lib/sales-engine/cash-flow-projection-service';

// GET /api/admin/sales-engine/cash-flow
// Returns 12-month cash flow projection based on execution milestones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') ?? '12') || 12;

    const result = await getCashFlowProjection(months);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result.data });
  } catch (error) {
    console.error('[cash-flow] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate cash flow projection' },
      { status: 500 }
    );
  }
}
