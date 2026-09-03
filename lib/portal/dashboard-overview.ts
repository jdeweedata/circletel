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

export function pipelineOverviewRows(input: {
  stage: StageKey;
  clinics: StageClinicRef[];
  sites?: PipelineOverviewSite[];
}): PipelineOverviewRow[] {
  const siteById = new Map((input.sites ?? []).map((site) => [site.id, site]));

  return input.clinics
    .filter((clinic) => clinic.stage === input.stage)
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
