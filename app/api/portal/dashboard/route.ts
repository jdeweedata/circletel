import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';
import {
  deriveStage,
  submissionRank,
  type StageKey,
} from '@/lib/portal/onboarding-stage';
import { isCustomerServiceBilledNow } from '@/lib/billing/billing-eligibility';

/**
 * Organisation-level rollup for the portal dashboard.
 *
 * A clinic reaches the dashboard by one of two routes, and both must be counted:
 *  - it has a corporate_sites record (installing or live, or a placeholder
 *    created before onboarding starts), or
 *  - onboarding has started but no site record exists yet.
 *
 * Pre-qualified clinics are those CircleTel has coverage-checked that have no
 * site record — the population Unjani can still nominate.
 */

/** "Unjani Clinic - Lens ext 10" and "Lens ext 10" both collapse to "lensext10". */
function clinicKey(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .replace(/^.*[Uu]njani [Cc]linic[ -]*/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export async function GET() {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const [{ data: sites, error: sitesError }, { data: checks }] = await Promise.all([
    adminDb
      .from('corporate_sites')
      .select('id, site_name, province, status, technology, monthly_fee, installed_at')
      .eq('corporate_id', portalUser.organisation_id),
    adminDb
      .from('b2b_coverage_checks')
      .select('clinic_name, results')
      .eq('organisation_id', portalUser.organisation_id),
  ]);

  if (sitesError) {
    console.error('[Portal /dashboard] Sites query error:', sitesError.message);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }

  const siteList = sites ?? [];
  const siteIds = new Set(siteList.map((s) => s.id));

  const { data: siteCustomers } = siteIds.size
    ? await adminDb
        .from('customers')
        .select('id, corporate_site_id')
        .in('corporate_site_id', [...siteIds])
    : { data: [] as Array<{ id: string; corporate_site_id: string }> };

  type SiteServiceRow = {
    customer_id: string;
    billing_start_date: string | null;
    status: string | null;
    active: boolean | null;
  };

  const siteCustomerIds = (siteCustomers ?? []).map((c) => c.id);
  const { data: siteServices } = siteCustomerIds.length
    ? await adminDb
        .from('customer_services')
        .select('customer_id, billing_start_date, status, active')
        .in('customer_id', siteCustomerIds)
    : { data: [] as SiteServiceRow[] };

  const servicesByCustomer = new Map<string, SiteServiceRow[]>();
  for (const svc of (siteServices ?? []) as SiteServiceRow[]) {
    const list = servicesByCustomer.get(svc.customer_id) ?? [];
    list.push(svc);
    servicesByCustomer.set(svc.customer_id, list);
  }

  const billedCustomerBySite = new Map<string, string>();
  for (const c of siteCustomers ?? []) {
    if (c.corporate_site_id) billedCustomerBySite.set(c.corporate_site_id, c.id);
  }

  const now = new Date();
  const isSiteBilled = (siteId: string): boolean => {
    const customerId = billedCustomerBySite.get(siteId);
    if (!customerId) return false;
    const services = servicesByCustomer.get(customerId) ?? [];
    return services.some((svc) => isCustomerServiceBilledNow(svc, now));
  };

  // Coverage checks define which clinics belong to this organisation, so they
  // also scope the clinics that are onboarding without a site record yet.
  // Matching on the clinic key keeps this tenant-agnostic — no email domain.
  const checkKeys = new Set((checks ?? []).map((c) => clinicKey(c.clinic_name)));

  const { data: customers } = await adminDb
    .from('customers')
    .select('id, business_name, corporate_site_id');

  const customerList = (customers ?? []).filter((c) => {
    if (/training/i.test(c.business_name ?? '')) return false;
    if (c.corporate_site_id && siteIds.has(c.corporate_site_id)) return true;
    return checkKeys.has(clinicKey(c.business_name));
  });
  const customerIds = customerList.map((c) => c.id);

  const bestSubmission: Record<
    string,
    { status: string | null; rejection_reason: string | null }
  > = {};
  const linkSent = new Set<string>();

  if (customerIds.length > 0) {
    const [{ data: submissions }, { data: tokens }] = await Promise.all([
      adminDb
        .from('onboarding_submissions')
        .select('customer_id, status, rejection_reason')
        .in('customer_id', customerIds),
      adminDb
        .from('onboarding_tokens')
        .select('customer_id')
        .in('customer_id', customerIds)
        .not('sent_at', 'is', null),
    ]);

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

  const customerBySite = new Map<string, string>();
  for (const c of customerList) {
    if (c.corporate_site_id && siteIds.has(c.corporate_site_id)) {
      customerBySite.set(c.corporate_site_id, c.id);
    }
  }

  const stageCounts: Record<StageKey, number> = {
    nominated: 0,
    introduced: 0,
    details_confirmed: 0,
    changes_requested: 0,
    visit_booked: 0,
    installing: 0,
    live: 0,
  };

  let sitesLive = 0;
  let billedSites = 0;
  let monthlySpend = 0;

  for (const site of siteList) {
    const customerId = customerBySite.get(site.id);
    const submission = customerId ? bestSubmission[customerId] : undefined;
    const stage = deriveStage({
      siteStatus: site.status,
      installedAt: site.installed_at,
      submissionStatus: submission?.status,
      submissionRejectionReason: submission?.rejection_reason,
      onboardingLinkSent: customerId ? linkSent.has(customerId) : false,
    });
    stageCounts[stage]++;

    if (stage === 'live') {
      sitesLive++;
      // Recurring spend follows the invoice generator: an active service whose
      // billing_start_date has been reached. Live but deferred (e.g. 1 Sep) is excluded.
      if (isSiteBilled(site.id)) {
        billedSites++;
        monthlySpend += Number(site.monthly_fee ?? 0);
      }
    }
  }

  // Clinics whose onboarding has started but that have no site record yet.
  const countedCustomers = new Set(customerBySite.values());
  for (const customer of customerList) {
    if (countedCustomers.has(customer.id)) continue;
    const submission = bestSubmission[customer.id];
    if (!submission && !linkSent.has(customer.id)) continue;
    stageCounts[
      deriveStage({
        submissionStatus: submission?.status,
        submissionRejectionReason: submission?.rejection_reason,
        onboardingLinkSent: linkSent.has(customer.id),
      })
    ]++;
  }

  const inOnboarding =
    stageCounts.nominated +
    stageCounts.introduced +
    stageCounts.details_confirmed +
    stageCounts.changes_requested +
    stageCounts.visit_booked +
    stageCounts.installing;

  // Pre-qualified: coverage-checked clinics with no site record.
  const siteKeys = new Set(siteList.map((s) => clinicKey(s.site_name)));
  const preQualifiedChecks = (checks ?? []).filter(
    (c) => !siteKeys.has(clinicKey(c.clinic_name))
  );

  const provinceCounts: Record<string, number> = {};
  for (const check of preQualifiedChecks) {
    const results = (check.results ?? {}) as { province?: string };
    const province = results.province || 'Unknown';
    provinceCounts[province] = (provinceCounts[province] ?? 0) + 1;
  }

  return NextResponse.json({
    sitesLive,
    billedSites,
    inOnboarding,
    preQualified: preQualifiedChecks.length,
    monthlySpend,
    stageCounts,
    provinces: Object.entries(provinceCounts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count),
  });
}
