import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getWeeklyBriefing } = await import('@/lib/sales-engine/briefing-service');
    const result = await getWeeklyBriefing();
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
