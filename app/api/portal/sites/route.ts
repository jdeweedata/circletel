import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';
import { deriveStage, submissionRank } from '@/lib/portal/onboarding-stage';

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

  // Onboarding stages 1-4 are evidenced on the customer side. customers holds
  // the link (customers.corporate_site_id), so resolve site -> customer first.
  const { data: linkedCustomers } = await adminDb
    .from('customers')
    .select('id, corporate_site_id')
    .in(
      'corporate_site_id',
      siteList.map((s) => s.id)
    )
    .not('corporate_site_id', 'is', null);

  const customerBySite = new Map<string, string>();
  for (const c of linkedCustomers ?? []) {
    if (c.corporate_site_id && !customerBySite.has(c.corporate_site_id)) {
      customerBySite.set(c.corporate_site_id, c.id);
    }
  }

  const customerIds = Array.from(customerBySite.values());

  const bestSubmission: Record<
    string,
    { status: string | null; rejection_reason: string | null }
  > = {};
  const linkSent = new Set<string>();

  if (customerIds.length > 0) {
    const [{ data: submissions }, { data: tokens }] = await Promise.all([
      adminDb
        .from('onboarding_submissions')
        .select('customer_id, status, rejection_reason, submitted_at')
        .in('customer_id', customerIds),
      adminDb
        .from('onboarding_tokens')
        .select('customer_id, sent_at')
        .in('customer_id', customerIds)
        .not('sent_at', 'is', null),
    ]);

    // A customer can hold several submissions (drafts plus an approved one) —
    // keep the most advanced, breaking ties on the later submitted_at.
    for (const s of submissions ?? []) {
      const current = bestSubmission[s.customer_id];
      if (!current || submissionRank(s.status) > submissionRank(current.status)) {
        bestSubmission[s.customer_id] = {
          status: s.status,
          rejection_reason: s.rejection_reason,
        };
      }
    }

    for (const t of tokens ?? []) linkSent.add(t.customer_id);
  }

  const enriched = siteList.map((site) => {
    const customerId = customerBySite.get(site.id) ?? null;
    const submission = customerId ? bestSubmission[customerId] : undefined;
    return {
      ...site,
      customer_id: customerId,
      health: site.ruijie_device_sn ? healthMap[site.ruijie_device_sn] ?? null : null,
      stage: deriveStage({
        siteStatus: site.status,
        installedAt: site.installed_at,
        submissionStatus: submission?.status,
        submissionRejectionReason: submission?.rejection_reason,
        onboardingLinkSent: customerId ? linkSent.has(customerId) : false,
      }),
    };
  });

  return NextResponse.json({ sites: enriched });
}
