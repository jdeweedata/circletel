import { NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: sites, error } = await supabase
    .from('corporate_sites')
    .select(`
      id,
      site_name,
      site_code,
      address_line1,
      address_line2,
      city,
      province,
      postal_code,
      status,
      technology_type,
      ruijie_device_sn,
      contact_name,
      contact_phone,
      contact_email
    `)
    .order('site_name');

  if (error) {
    console.error('[Portal /sites] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load sites' }, { status: 500 });
  }

  const siteList = sites ?? [];

  const deviceSns = siteList
    .map((s) => s.ruijie_device_sn)
    .filter((sn): sn is string => !!sn);

  let healthMap: Record<string, { health_score: number; connected_clients: number }> = {};

  if (deviceSns.length > 0) {
    const { data: healthData } = await supabase
      .from('device_health_snapshots')
      .select('device_sn, health_score, connected_clients')
      .in('device_sn', deviceSns)
      .order('created_at', { ascending: false });

    if (healthData) {
      for (const h of healthData) {
        if (!healthMap[h.device_sn]) {
          healthMap[h.device_sn] = {
            health_score: h.health_score,
            connected_clients: h.connected_clients,
          };
        }
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
