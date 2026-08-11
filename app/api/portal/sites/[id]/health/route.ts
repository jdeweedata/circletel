import { NextRequest, NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const range = request.nextUrl.searchParams.get('range') ?? '7d';

  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  if (portalUser.role === 'site_user' && portalUser.site_id !== id) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const { data: site, error: siteError } = await adminDb
    .from('corporate_sites')
    .select('ruijie_device_sn')
    .eq('id', id)
    .eq('corporate_id', portalUser.organisation_id)
    .maybeSingle();

  if (siteError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (!site.ruijie_device_sn) {
    return NextResponse.json({
      timeseries: [],
      range,
      device_sn: null,
      message: 'Automated monitoring not available for this site',
    });
  }

  const days = range === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: snapshots, error } = await adminDb
    .from('device_health_snapshots')
    .select('health_score, online_clients, captured_at')
    .eq('device_sn', site.ruijie_device_sn)
    .gte('captured_at', since.toISOString())
    .order('captured_at', { ascending: true });

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
