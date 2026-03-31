import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { getMetricsHistory, getLatestMetrics } from '@/lib/tarana/metrics-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ serial: string }> }
) {
  const sessionClient = await createClientWithSession();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
