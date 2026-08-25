import { NextRequest, NextResponse } from 'next/server';
import { isUnjaniCorporateCode } from '@/lib/portal/paths';
import { requirePortalCapability } from '@/lib/portal/require-portal-user';
import {
  aggregateStaffUsageByDay,
  loadStaffHourRows,
} from '@/lib/usage-reports/staff-wifi';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requirePortalCapability('sites.read');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;
  const range = request.nextUrl.searchParams.get('range') === '30d' ? '30d' : '7d';

  if (portalUser.role === 'site_user' && portalUser.site_id !== id) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (!isUnjaniCorporateCode(portalUser.organisation_code)) {
    return NextResponse.json({ range, timeseries: [] });
  }

  const { data: site, error: siteError } = await adminDb
    .from('corporate_sites')
    .select('id, status, installed_at')
    .eq('id', id)
    .eq('corporate_id', portalUser.organisation_id)
    .maybeSingle();

  if (siteError) {
    console.error('[Portal /sites/[id]/staff-wifi] Site query error:', siteError.message);
    return NextResponse.json({ error: 'Failed to load Staff Wi-Fi usage' }, { status: 500 });
  }

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (site.status !== 'active' || !site.installed_at) {
    return NextResponse.json({ range, timeseries: [] });
  }

  const days = range === '30d' ? 30 : 7;
  const endUtc = new Date();
  const startUtc = new Date(endUtc);
  startUtc.setDate(startUtc.getDate() - days);

  try {
    const rows = await loadStaffHourRows(adminDb, id, startUtc, endUtc);
    return NextResponse.json({
      range,
      timeseries: aggregateStaffUsageByDay(rows),
    });
  } catch (error) {
    console.error('[Portal /sites/[id]/staff-wifi] Rollup query error:', error);
    return NextResponse.json({ error: 'Failed to load Staff Wi-Fi usage' }, { status: 500 });
  }
}
