import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const range = request.nextUrl.searchParams.get('range') ?? '7d';
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: site, error: siteError } = await supabase
    .from('corporate_sites')
    .select('ruijie_device_sn')
    .eq('id', id)
    .maybeSingle();

  if (siteError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (!site.ruijie_device_sn) {
    return NextResponse.json({
      timeseries: [],
      message: 'Automated monitoring not available for this site',
    });
  }

  const days = range === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: snapshots, error } = await supabase
    .from('device_health_snapshots')
    .select('health_score, connected_clients, created_at')
    .eq('device_sn', site.ruijie_device_sn)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Portal /sites/[id]/health] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load health data' }, { status: 500 });
  }

  return NextResponse.json({
    timeseries: snapshots ?? [],
    range,
    device_sn: site.ruijie_device_sn,
  });
}
