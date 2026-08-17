import { NextRequest, NextResponse } from 'next/server';
import { requirePortalCapability } from '@/lib/portal/require-portal-user';
import { deriveStage, submissionRank } from '@/lib/portal/onboarding-stage';

/** Columns that exist on corporate_sites — verified against information_schema. */
const SITE_DETAIL_COLUMNS = `
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
  access_type,
  access_instructions,
  rfi_status,
  rfi_notes,
  router_model,
  router_serial,
  ruijie_device_sn,
  site_contact_name,
  site_contact_email,
  site_contact_phone,
  lat,
  lng,
  created_at
`;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const auth = await requirePortalCapability('sites.read');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  // Site users may only read their own site.
  if (portalUser.role === 'site_user' && portalUser.site_id !== id) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const { data: site, error } = await adminDb
    .from('corporate_sites')
    .select(SITE_DETAIL_COLUMNS)
    .eq('id', id)
    .eq('corporate_id', portalUser.organisation_id)
    .maybeSingle();

  if (error) {
    console.error('[Portal /sites/[id]] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load site' }, { status: 500 });
  }

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  // Stages 1-4 are evidenced on the customer side; customers holds the link.
  const { data: customer } = await adminDb
    .from('customers')
    .select('id')
    .eq('corporate_site_id', id)
    .maybeSingle();

  let submissionStatus: string | null = null;
  let submissionRejectionReason: string | null = null;
  let onboardingLinkSent = false;

  if (customer) {
    const [{ data: submissions }, { count: tokenCount }] = await Promise.all([
      adminDb
        .from('onboarding_submissions')
        .select('status, rejection_reason')
        .eq('customer_id', customer.id),
      adminDb
        .from('onboarding_tokens')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customer.id)
        .not('sent_at', 'is', null),
    ]);

    // A customer can hold several submissions — keep the most advanced.
    for (const s of submissions ?? []) {
      if (submissionRank(s.status) > submissionRank(submissionStatus)) {
        submissionStatus = s.status;
        submissionRejectionReason = s.rejection_reason;
      }
    }
    onboardingLinkSent = (tokenCount ?? 0) > 0;
  }

  const stage = deriveStage({
    siteStatus: site.status,
    installedAt: site.installed_at,
    submissionStatus,
    submissionRejectionReason,
    onboardingLinkSent,
  });

  let latestHealth = null;
  let recentAlerts: unknown[] = [];

  if (stage === 'live' && site.ruijie_device_sn) {
    const { data: healthData } = await adminDb
      .from('device_health_snapshots')
      .select('health_score, online_clients, cpu_usage, memory_usage, status, captured_at')
      .eq('device_sn', site.ruijie_device_sn)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    latestHealth = healthData;

    const { data: alertData } = await adminDb
      .from('network_health_alerts')
      .select('id, alert_type, severity, message, created_at, acknowledged, acknowledged_at')
      .eq('device_sn', site.ruijie_device_sn)
      .order('created_at', { ascending: false })
      .limit(10);

    recentAlerts = alertData ?? [];
  }

  return NextResponse.json({
    site: { ...site, customer_id: customer?.id ?? null, stage },
    health: latestHealth,
    alerts: recentAlerts,
  });
}
