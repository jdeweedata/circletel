import { NextResponse } from 'next/server';
import { getPipelineHealth } from '@/lib/sales-engine/pipeline-health-service';

export async function GET() {
  try {
    const result = await getPipelineHealth();
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
