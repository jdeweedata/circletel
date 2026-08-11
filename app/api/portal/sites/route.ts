import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';

/** Columns that exist on corporate_sites — verified against information_schema. */
const SITE_COLUMNS = `
  id,
  site_number,
  site_name,
  site_code,
  installation_address,
  province,
  status,
  technology,
  monthly_fee,
  installed_at,
  job_card_number,
  ruijie_device_sn,
  site_contact_name,
  site_contact_email,
  site_contact_phone,
  lat,
  lng,
  created_at
`;

export async function GET() {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  let query = adminDb
    .from('corporate_sites')
    .select(SITE_COLUMNS)
    .eq('corporate_id', portalUser.organisation_id)
    .order('site_name');

  // Site users only ever see their own site.
  if (portalUser.role === 'site_user') {
    if (!portalUser.site_id) {
      return NextResponse.json({ sites: [] });
    }
    query = query.eq('id', portalUser.site_id);
  }

  const { data: sites, error } = await query;

  if (error) {
    console.error('[Portal /sites] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load sites' }, { status: 500 });
  }

  const siteList = sites ?? [];

  const deviceSns = siteList
    .map((s) => s.ruijie_device_sn)
    .filter((sn): sn is string => !!sn);

  const healthMap: Record<
    string,
    { health_score: number; online_clients: number; captured_at: string }
  > = {};

  if (deviceSns.length > 0) {
    const { data: healthData, error: healthError } = await adminDb
      .from('device_health_snapshots')
      .select('device_sn, health_score, online_clients, captured_at')
      .in('device_sn', deviceSns)
      .order('captured_at', { ascending: false });

    if (healthError) {
      console.error('[Portal /sites] Health query error:', healthError.message);
    }

    // Rows arrive newest-first, so the first hit per device is the latest snapshot.
    for (const h of healthData ?? []) {
      if (!healthMap[h.device_sn]) {
        healthMap[h.device_sn] = {
          health_score: h.health_score,
          online_clients: h.online_clients,
          captured_at: h.captured_at,
        };
      }
    }
  }

  const enriched = siteList.map((site) => ({
    ...site,
    health: site.ruijie_device_sn
      ? healthMap[site.ruijie_device_sn] ?? null
      : null,
  }));

  return NextResponse.json({ sites: enriched });
}
