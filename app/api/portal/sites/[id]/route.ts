import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: site, error } = await supabase
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
      contact_email,
      notes,
      created_at
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[Portal /sites/[id]] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load site' }, { status: 500 });
  }

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  let latestHealth = null;
  let recentAlerts: any[] = [];

  if (site.ruijie_device_sn) {
    const { data: healthData } = await supabase
      .from('device_health_snapshots')
      .select('health_score, connected_clients, cpu_usage, memory_usage, created_at')
      .eq('device_sn', site.ruijie_device_sn)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    latestHealth = healthData;

    const { data: alertData } = await supabase
      .from('network_health_alerts')
      .select('id, alert_type, severity, message, created_at, resolved_at')
      .eq('device_sn', site.ruijie_device_sn)
      .order('created_at', { ascending: false })
      .limit(10);

    recentAlerts = alertData ?? [];
  }

  return NextResponse.json({
    site,
    health: latestHealth,
    alerts: recentAlerts,
  });
}
