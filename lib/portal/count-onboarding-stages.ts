/**
 * Shared Unjani Connect pipeline counts.
 *
 * Same loops as /api/portal/dashboard: count every site, then leftover
 * customers that already have a submission or invite. Coverage-check-only
 * clinics stay out of the strip (they are Pre-qualified, not nominated).
 *
 * Stage labels still come from deriveStage() — this file does not invent stages.
 */

import { clinicKey } from '@/lib/portal/coverage-summary';
import { deriveStage, type StageKey } from '@/lib/portal/onboarding-stage';

export interface CountableSite {
  id: string;
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
}): {
  stageCounts: Record<StageKey, number>;
  stageByCustomerId: Record<string, StageKey>;
  stageBySiteId: Record<string, StageKey>;
} {
  const sites = input.sites;
  const siteIds = new Set(sites.map((site) => site.id));
  const linkSent =
    input.linkSent instanceof Set ? input.linkSent : new Set(input.linkSent);

  const customerBySite = new Map<string, string>();
  for (const customer of input.customers) {
    if (customer.corporate_site_id && siteIds.has(customer.corporate_site_id)) {
      customerBySite.set(customer.corporate_site_id, customer.id);
    }
  }

  const stageCounts = emptyStageCounts();
  const stageByCustomerId: Record<string, StageKey> = {};
  const stageBySiteId: Record<string, StageKey> = {};

  for (const site of sites) {
    const customerId = customerBySite.get(site.id);
    const submission = customerId ? input.bestSubmission[customerId] : undefined;
    const stage = deriveStage({
      siteStatus: site.status,
      installedAt: site.installed_at,
      submissionStatus: submission?.status,
      submissionRejectionReason: submission?.rejection_reason,
      onboardingLinkSent: customerId ? linkSent.has(customerId) : false,
    });
    stageCounts[stage]++;
    stageBySiteId[site.id] = stage;
    if (customerId) stageByCustomerId[customerId] = stage;
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
  }

  return { stageCounts, stageByCustomerId, stageBySiteId };
}
