import { clinicKey, isNominatedCoverageCheck, recommendedAccess, recommendedLabel } from '@/lib/portal/coverage-summary';
import type { StageClinicRef } from '@/lib/portal/count-onboarding-stages';
import type { StageKey } from '@/lib/portal/onboarding-stage';
import type { CoverageCheckResults } from '@/lib/portal/coverage-summary';

export interface KpiListSite {
  siteId: string;
  customerId: string | null;
  name: string;
  installedAt: string | null;
  monthlyFee: number;
  billed: boolean;
}

export interface KpiOnboardingRow {
  stage: StageKey;
  name: string;
  customerId: string | null;
  siteId?: string;
  coverageCheckId?: string | null;
}

export interface KpiPreQualifiedRow {
  coverageCheckId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  recommended: string;
}

export interface UnjaniKpiLists {
  sitesLive: KpiListSite[];
  inOnboarding: KpiOnboardingRow[];
  preQualified: KpiPreQualifiedRow[];
  monthlySpend: KpiListSite[];
}

export function buildUnjaniKpiLists(input: {
  stageClinics: StageClinicRef[];
  sites: Array<{
    id: string;
    site_name?: string | null;
    installed_at?: string | null;
    monthly_fee?: number | string | null;
  }>;
  coverageChecks: Array<{
    id: string;
    clinic_name?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    results?: CoverageCheckResults | { nominated?: boolean } | null;
  }>;
  billedSiteIds: Iterable<string>;
}): UnjaniKpiLists {
  const billed = input.billedSiteIds instanceof Set ? input.billedSiteIds : new Set(input.billedSiteIds);
  const siteById = new Map(input.sites.map((site) => [site.id, site]));
  const siteKeys = new Set(input.sites.map((site) => clinicKey(site.site_name)));

  const sitesLive: KpiListSite[] = input.stageClinics
    .filter((ref) => ref.stage === 'live' && ref.siteId)
    .map((ref) => {
      const site = siteById.get(ref.siteId as string);
      return {
        siteId: ref.siteId as string,
        customerId: ref.customerId,
        name: ref.name,
        installedAt: site?.installed_at ?? null,
        monthlyFee: Number(site?.monthly_fee ?? 0),
        billed: billed.has(ref.siteId as string),
      };
    });

  const inOnboarding: KpiOnboardingRow[] = input.stageClinics
    .filter((ref) => ref.stage !== 'live')
    .map((ref) => ({
      stage: ref.stage,
      name: ref.name,
      customerId: ref.customerId,
      siteId: ref.siteId,
      coverageCheckId: ref.coverageCheckId,
    }));

  const preQualified: KpiPreQualifiedRow[] = input.coverageChecks
    .filter(
      (check) =>
        !siteKeys.has(clinicKey(check.clinic_name)) && !isNominatedCoverageCheck(check)
    )
    .map((check) => ({
      coverageCheckId: check.id,
      name: check.clinic_name?.trim() || 'Clinic',
      address: check.address?.trim() || '',
      latitude: check.latitude ?? null,
      longitude: check.longitude ?? null,
      recommended: recommendedLabel(recommendedAccess(check.results as CoverageCheckResults)),
    }));

  return {
    sitesLive,
    inOnboarding,
    preQualified,
    monthlySpend: sitesLive.filter((site) => site.billed),
  };
}
