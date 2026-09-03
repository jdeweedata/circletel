/**
 * Shared Unjani Connect pipeline counts.
 *
 * Same loops as /api/portal/dashboard: count every site, then leftover
 * customers that already have a submission or invite. Coverage-check-only
 * clinics stay out of the strip (they are Pre-qualified, not nominated).
 * Sites that already went live and are now suspended or decommissioned
 * leave the strip — they are churned, not Clinic nominated.
 *
 * Stage labels still come from deriveStage() — this file does not invent stages.
 */

import { clinicKey } from '@/lib/portal/coverage-summary';
import { deriveStage, type StageKey } from '@/lib/portal/onboarding-stage';

export interface CountableSite {
  id: string;
  site_name?: string | null;
  status?: string | null;
  installed_at?: string | null;
}

export interface CountableCustomer {
  id: string;
  business_name?: string | null;
  corporate_site_id?: string | null;
}

export interface CountableSubmission {
  status: string | null;
  rejection_reason: string | null;
}

/** Went live, then cancelled / kit collected — leave the onboarding strip. */
export function isChurnedLiveSite(site: CountableSite): boolean {
  if (!site.installed_at) return false;
  return site.status === 'suspended' || site.status === 'decommissioned';
}

export function emptyStageCounts(): Record<StageKey, number> {
  return {
    nominated: 0,
    introduced: 0,
    details_confirmed: 0,
    changes_requested: 0,
    visit_booked: 0,
    installing: 0,
    live: 0,
  };
}

/** Dashboard population: site-linked or coverage-check name match; drop training. */
export function scopeOnboardingCustomers<T extends CountableCustomer>(
  customers: T[],
  siteIds: Iterable<string>,
  checkKeys: Iterable<string>
): T[] {
  const sites = siteIds instanceof Set ? siteIds : new Set(siteIds);
  const checks = checkKeys instanceof Set ? checkKeys : new Set(checkKeys);
  return customers.filter((customer) => {
    if (/training/i.test(customer.business_name ?? '')) return false;
    if (customer.corporate_site_id && sites.has(customer.corporate_site_id)) {
      return true;
    }
    return checks.has(clinicKey(customer.business_name));
  });
}

export function countOnboardingStages(input: {
  sites: CountableSite[];
  customers: CountableCustomer[];
  bestSubmission: Record<string, CountableSubmission | undefined>;
  linkSent: Set<string> | Iterable<string>;
  nominatedCheckKeys?: Iterable<string>;
}): {
  stageCounts: Record<StageKey, number>;
  stageByCustomerId: Record<string, StageKey>;
  stageBySiteId: Record<string, StageKey>;
} {
  const sites = input.sites;
  const siteIds = new Set(sites.map((site) => site.id));
  const linkSent =
    input.linkSent instanceof Set ? input.linkSent : new Set(input.linkSent);
  const nominatedKeys = new Set(
    [...(input.nominatedCheckKeys ?? [])].map((key) => clinicKey(key)).filter(Boolean)
  );

  const customerBySite = new Map<string, string>();
  for (const customer of input.customers) {
    if (customer.corporate_site_id && siteIds.has(customer.corporate_site_id)) {
      customerBySite.set(customer.corporate_site_id, customer.id);
    }
  }

  const stageCounts = emptyStageCounts();
  const stageByCustomerId: Record<string, StageKey> = {};
  const stageBySiteId: Record<string, StageKey> = {};
  const countedKeys = new Set<string>();

  for (const site of sites) {
    if (isChurnedLiveSite(site)) {
      const key = clinicKey(site.site_name);
      if (key) countedKeys.add(key);
      continue;
    }
    const customerId = customerBySite.get(site.id);
    const submission = customerId ? input.bestSubmission[customerId] : undefined;
    const stage = deriveStage({
      siteStatus: site.status,
      installedAt: site.installed_at,
      submissionStatus: submission?.status,
      submissionRejectionReason: submission?.rejection_reason,
      onboardingLinkSent: customerId ? linkSent.has(customerId) : false,
    });
    if (stage === 'nominated' && !customerId && !nominatedKeys.has(clinicKey(site.site_name))) {
      continue;
    }
    stageCounts[stage]++;
    stageBySiteId[site.id] = stage;
    if (customerId) stageByCustomerId[customerId] = stage;
    const key = clinicKey(site.site_name);
    if (key) countedKeys.add(key);
  }

  const countedCustomers = new Set(customerBySite.values());
  for (const customer of input.customers) {
    if (countedCustomers.has(customer.id)) continue;
    const submission = input.bestSubmission[customer.id];
    if (!submission && !linkSent.has(customer.id)) continue;
    const stage = deriveStage({
      submissionStatus: submission?.status,
      submissionRejectionReason: submission?.rejection_reason,
      onboardingLinkSent: linkSent.has(customer.id),
    });
    stageCounts[stage]++;
    stageByCustomerId[customer.id] = stage;
    const key = clinicKey(customer.business_name);
    if (key) countedKeys.add(key);
  }

  for (const rawKey of nominatedKeys) {
    if (countedKeys.has(rawKey)) continue;
    stageCounts.nominated += 1;
    countedKeys.add(rawKey);
  }

  return { stageCounts, stageByCustomerId, stageBySiteId };
}

export interface StageClinicRef {
  stage: StageKey;
  siteId?: string;
  customerId: string | null;
  coverageCheckId?: string | null;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Named clinics behind each guide-stage count, including nominated coverage checks. */
export function stageClinicRefs(input: {
  sites: Array<{ id: string; site_name?: string | null }>;
  customers: CountableCustomer[];
  stageBySiteId: Record<string, StageKey>;
  stageByCustomerId: Record<string, StageKey>;
  nominatedChecks?: Array<{
    id?: string;
    clinic_name?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }>;
}): StageClinicRef[] {
  const customerBySite = new Map<string, CountableCustomer>();
  for (const customer of input.customers) {
    if (customer.corporate_site_id) customerBySite.set(customer.corporate_site_id, customer);
  }

  const refs: StageClinicRef[] = [];
  const countedCustomers = new Set<string>();

  for (const site of input.sites) {
    const stage = input.stageBySiteId[site.id];
    if (!stage) continue;
    const customer = customerBySite.get(site.id);
    if (customer) countedCustomers.add(customer.id);
    refs.push({
      stage,
      siteId: site.id,
      customerId: customer?.id ?? null,
      name: site.site_name || customer?.business_name || 'Clinic',
    });
  }

  for (const customer of input.customers) {
    if (countedCustomers.has(customer.id)) continue;
    const stage = input.stageByCustomerId[customer.id];
    if (!stage) continue;
    refs.push({
      stage,
      customerId: customer.id,
      name: customer.business_name || 'Clinic',
    });
  }

  const namedKeys = new Set(refs.map((ref) => clinicKey(ref.name)).filter(Boolean));
  for (const check of input.nominatedChecks ?? []) {
    const name = check.clinic_name?.trim();
    const key = clinicKey(name);
    if (!name || !key || namedKeys.has(key)) continue;
    namedKeys.add(key);
    refs.push({
      stage: 'nominated',
      customerId: null,
      coverageCheckId: check.id ?? null,
      name,
      address: check.address ?? null,
      latitude: check.latitude ?? null,
      longitude: check.longitude ?? null,
    });
  }

  return refs;
}

export function stageByClinicKey(refs: StageClinicRef[]): Record<string, StageKey> {
  const map: Record<string, StageKey> = {};
  for (const ref of refs) {
    const key = clinicKey(ref.name);
    if (key) map[key] = ref.stage;
  }
  return map;
}
