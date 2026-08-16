import { NextRequest, NextResponse } from 'next/server';
import { isUnjaniCorporateCode } from '@/lib/portal/paths';
import { requirePortalUser } from '@/lib/portal/require-portal-user';
import {
  aggregateStaffUsageBySite,
  loadStaffHourRowsForSites,
} from '@/lib/usage-reports/staff-wifi';

export async function GET(request: NextRequest) {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;
  const range = request.nextUrl.searchParams.get('range') === '30d' ? '30d' : '7d';

  if (!isUnjaniCorporateCode(portalUser.organisation_code)) {
    return NextResponse.json({ range, clinics: [] });
  }

  const { data: sites, error: sitesError } = await adminDb
    .from('corporate_sites')
    .select('id, site_name, status, installed_at')
    .eq('corporate_id', portalUser.organisation_id)
    .eq('status', 'active')
    .not('installed_at', 'is', null);

  if (sitesError) {
    console.error('[Portal /sites/staff-wifi] Sites query error:', sitesError.message);
    return NextResponse.json({ error: 'Failed to load Staff Wi-Fi usage' }, { status: 500 });
  }

  const liveSites = (sites ?? []).filter((site) => {
    if (portalUser.role === 'site_user') return site.id === portalUser.site_id;
    return true;
  });

  if (liveSites.length === 0) {
    return NextResponse.json({ range, clinics: [] });
  }

  const days = range === '30d' ? 30 : 7;
  const endUtc = new Date();
  const startUtc = new Date(endUtc);
  startUtc.setDate(startUtc.getDate() - days);

  try {
    const rows = await loadStaffHourRowsForSites(
      adminDb,
      liveSites.map((site) => site.id),
      startUtc,
      endUtc
    );
    const usage = aggregateStaffUsageBySite(rows);

    const clinics = liveSites
      .map((site) => {
        const totals = usage[site.id] ?? { rxBytes: 0, txBytes: 0, totalBytes: 0 };
        return {
          siteId: site.id,
          siteName: site.site_name,
          totalBytes: totals.totalBytes,
          rxBytes: totals.rxBytes,
          txBytes: totals.txBytes,
        };
      })
      .sort((a, b) => b.totalBytes - a.totalBytes || a.siteName.localeCompare(b.siteName));

    return NextResponse.json({ range, clinics });
  } catch (error) {
    console.error('[Portal /sites/staff-wifi] Rollup query error:', error);
    return NextResponse.json({ error: 'Failed to load Staff Wi-Fi usage' }, { status: 500 });
  }
}
