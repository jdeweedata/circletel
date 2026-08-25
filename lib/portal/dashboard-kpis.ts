/**
 * Organisation rollup used by /unjani Dashboard and Admin Clinic Onboarding.
 * Stage keys still come from deriveStage via countOnboardingStages.
 */

import { isCustomerServiceBilledNow } from '@/lib/billing/billing-eligibility';
import { clinicKey, isNominatedCoverageCheck } from '@/lib/portal/coverage-summary';
import { emptyStageCounts } from '@/lib/portal/count-onboarding-stages';
import type { StageKey } from '@/lib/portal/onboarding-stage';
import { formatZar } from '@/lib/portal/site-format';

export interface DashboardKpiSite {
  id: string;
  site_name?: string | null;
  monthly_fee?: number | string | null;
}

export interface DashboardKpiCheck {
  clinic_name?: string | null;
  results?: { nominated?: boolean; nominated_at?: string | null } | null;
}

export interface UnjaniDashboardKpis {
  sitesLive: number;
  inOnboarding: number;
  preQualified: number;
  billedSites: number;
  monthlySpend: number;
}

export function inOnboardingCount(stageCounts: Record<StageKey, number>): number {
  return (
    (stageCounts.nominated ?? 0) +
    (stageCounts.introduced ?? 0) +
    (stageCounts.details_confirmed ?? 0) +
    (stageCounts.changes_requested ?? 0) +
    (stageCounts.visit_booked ?? 0) +
    (stageCounts.installing ?? 0)
  );
}

export function unjaniDashboardKpis(input: {
  stageCounts?: Record<StageKey, number>;
  sites: DashboardKpiSite[];
  coverageChecks: DashboardKpiCheck[];
  stageBySiteId: Record<string, StageKey>;
  billedSiteIds: Iterable<string>;
}): UnjaniDashboardKpis {
  const stageCounts = input.stageCounts ?? emptyStageCounts();
  const billed = input.billedSiteIds instanceof Set ? input.billedSiteIds : new Set(input.billedSiteIds);
  const siteKeys = new Set(input.sites.map((site) => clinicKey(site.site_name)));

  let billedSites = 0;
  let monthlySpend = 0;
  for (const site of input.sites) {
    if (input.stageBySiteId[site.id] !== 'live' || !billed.has(site.id)) continue;
    billedSites += 1;
    monthlySpend += Number(site.monthly_fee ?? 0);
  }

  return {
    sitesLive: stageCounts.live ?? 0,
    inOnboarding: inOnboardingCount(stageCounts),
    preQualified: input.coverageChecks.filter(
      (check) =>
        !siteKeys.has(clinicKey(check.clinic_name)) && !isNominatedCoverageCheck(check)
    ).length,
    billedSites,
    monthlySpend,
  };
}

export function billedSiteIdSet(
  siteCustomers: Array<{ id: string; corporate_site_id?: string | null }>,
  services: Array<{
    customer_id: string;
    billing_start_date?: string | null;
    status?: string | null;
    active?: boolean | null;
  }>,
  now = new Date()
): Set<string> {
  const servicesByCustomer = new Map<string, typeof services>();
  for (const service of services) {
    const list = servicesByCustomer.get(service.customer_id) ?? [];
    list.push(service);
    servicesByCustomer.set(service.customer_id, list);
  }

  const billed = new Set<string>();
  for (const customer of siteCustomers) {
    if (!customer.corporate_site_id) continue;
    const list = servicesByCustomer.get(customer.id) ?? [];
    if (list.some((service) => isCustomerServiceBilledNow(service, now))) {
      billed.add(customer.corporate_site_id);
    }
  }
  return billed;
}

export function spendNote(billedCount: number, spend: number): string {
  if (billedCount > 0 && spend > 0) {
    return `${billedCount} × ${formatZar(spend / billedCount)} excl VAT`;
  }
  return 'Excl VAT';
}
