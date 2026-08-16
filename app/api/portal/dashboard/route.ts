import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/portal/require-portal-user';
import { clinicKey, isNominatedCoverageCheck } from '@/lib/portal/coverage-summary';
import { countOnboardingStages, scopeOnboardingCustomers } from '@/lib/portal/count-onboarding-stages';
import { submissionRank } from '@/lib/portal/onboarding-stage';
import { billedSiteIdSet, unjaniDashboardKpis } from '@/lib/portal/dashboard-kpis';

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

  // Coverage checks define which clinics belong to this organisation, so they
  // also scope the clinics that are onboarding without a site record yet.
  // Matching on the clinic key keeps this tenant-agnostic — no email domain.
  const checkKeys = new Set((checks ?? []).map((c) => clinicKey(c.clinic_name)));

  const { data: customers } = await adminDb
    .from('customers')
    .select('id, business_name, corporate_site_id');

  const customerList = scopeOnboardingCustomers(customers ?? [], siteIds, checkKeys);
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

  const { stageCounts, stageBySiteId } = countOnboardingStages({
    sites: siteList,
    customers: customerList,
    bestSubmission,
    linkSent,
    nominatedCheckKeys: (checks ?? [])
      .filter(isNominatedCoverageCheck)
      .map((check) => check.clinic_name ?? ''),
  });

  const kpis = unjaniDashboardKpis({
    stageCounts,
    sites: siteList,
    coverageChecks: checks ?? [],
    stageBySiteId,
    billedSiteIds: billedSiteIdSet(siteCustomers ?? [], siteServices ?? []),
  });

  // Pre-qualified: coverage-checked clinics with no site record.
  const siteKeys = new Set(siteList.map((s) => clinicKey(s.site_name)));
  const preQualifiedChecks = (checks ?? []).filter(
    (c) => !siteKeys.has(clinicKey(c.clinic_name)) && !isNominatedCoverageCheck(c)
  );

  const provinceCounts: Record<string, number> = {};
  for (const check of preQualifiedChecks) {
    const results = (check.results ?? {}) as { province?: string };
    const province = results.province || 'Unknown';
    provinceCounts[province] = (provinceCounts[province] ?? 0) + 1;
  }

  return NextResponse.json({
    ...kpis,
    stageCounts,
    provinces: Object.entries(provinceCounts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count),
  });
}
