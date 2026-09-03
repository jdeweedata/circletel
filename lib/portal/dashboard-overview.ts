/**
 * Site overview rows for a selected Unjani pipeline stage.
 *
 * The strip counts leftover customers and nominated coverage checks as well as
 * corporate_sites. The overview table must list the same clinics.
 */

import type { StageClinicRef } from '@/lib/portal/count-onboarding-stages';
import type { StageKey } from '@/lib/portal/onboarding-stage';
import {
  formatClinicShortName,
  formatSiteLocation,
} from '@/lib/portal/site-format';

export interface PipelineOverviewSite {
  id: string;
  province?: string | null;
  technology?: string | null;
  installation_address?: unknown;
}

export interface PipelineOverviewRow {
  key: string;
  name: string;
  stage: StageKey;
  siteId?: string;
  location: string;
  technology: string | null;
}

export type SiteListFilter = 'all' | 'onboarding' | 'live';

export function parseSiteListFilter(value: string | null | undefined): SiteListFilter {
  if (value === 'onboarding' || value === 'live' || value === 'all') return value;
  return 'all';
}

export function isInOnboardingStage(stage: StageKey): boolean {
  return stage !== 'live';
}

export function sitesForListFilter<T extends { stage: StageKey }>(
  sites: T[],
  filter: SiteListFilter
): T[] {
  if (filter === 'onboarding') return sites.filter((site) => isInOnboardingStage(site.stage));
  if (filter === 'live') return sites.filter((site) => site.stage === 'live');
  return sites;
}

export function pipelineClinicsForFilter(
  clinics: StageClinicRef[],
  filter: SiteListFilter
): StageClinicRef[] {
  return sitesForListFilter(clinics, filter);
}

function toOverviewRows(
  clinics: StageClinicRef[],
  sites?: PipelineOverviewSite[]
): PipelineOverviewRow[] {
  const siteById = new Map((sites ?? []).map((site) => [site.id, site]));

  return clinics
    .map((clinic) => {
      const site = clinic.siteId ? siteById.get(clinic.siteId) : undefined;
      const location = site
        ? formatSiteLocation(site)
        : clinic.address?.trim() || '—';
      return {
        key:
          clinic.siteId ||
          clinic.customerId ||
          clinic.coverageCheckId ||
          clinic.name,
        name: formatClinicShortName(clinic.name),
        stage: clinic.stage,
        siteId: clinic.siteId,
        location,
        technology: site?.technology ?? null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function pipelineOverviewRows(input: {
  stage: StageKey;
  clinics: StageClinicRef[];
  sites?: PipelineOverviewSite[];
}): PipelineOverviewRow[] {
  return toOverviewRows(
    input.clinics.filter((clinic) => clinic.stage === input.stage),
    input.sites
  );
}

export function pipelineSiteListRows(input: {
  filter: SiteListFilter;
  clinics: StageClinicRef[];
  sites?: PipelineOverviewSite[];
}): PipelineOverviewRow[] {
  return toOverviewRows(pipelineClinicsForFilter(input.clinics, input.filter), input.sites);
}
