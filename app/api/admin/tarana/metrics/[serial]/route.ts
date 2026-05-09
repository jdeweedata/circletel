import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getMetricsHistory, getLatestMetrics } from '@/lib/tarana/metrics-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ serial: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const { serial } = await context.params;
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  if (fromParam && toParam) {
    const history = await getMetricsHistory(serial, new Date(fromParam), new Date(toParam));
    return NextResponse.json({ serial, history, count: history.length });
  }

  const latest = await getLatestMetrics(serial);
  return NextResponse.json({ serial, latest });
}
