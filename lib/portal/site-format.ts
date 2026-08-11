/**
 * Shared shapes and formatters for corporate_sites as served by /api/portal/sites.
 *
 * Field names here mirror the real `corporate_sites` columns — `installation_address`
 * is JSONB, `technology` is the DB enum-ish text, and health comes from
 * `device_health_snapshots` (`online_clients`, not `connected_clients`).
 */

import type { StageKey } from '@/lib/portal/onboarding-stage';

export interface SiteAddress {
  street?: string;
  area?: string;
  city?: string;
  province?: string;
  postal_code?: string;
}

export interface SiteHealth {
  health_score: number;
  online_clients: number;
  captured_at: string;
}

export interface PortalSite {
  id: string;
  site_number: number | null;
  site_name: string;
  site_code: string | null;
  customer_id: string | null;
  stage: StageKey;
  installation_address: SiteAddress | null;
  province: string | null;
  status: string | null;
  technology: string | null;
  monthly_fee: number | string | null;
  installed_at: string | null;
  job_card_number: string | null;
  ruijie_device_sn: string | null;
  site_contact_name: string | null;
  site_contact_email: string | null;
  site_contact_phone: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
  health: SiteHealth | null;
}

/** `installation_address` is JSONB — guard it before reading keys. */
export function siteAddress(site: {
  installation_address?: unknown;
}): SiteAddress {
  const raw = site.installation_address;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as SiteAddress;
}

/** "Sandton, Gauteng" — falls back to the site's own province column. */
export function formatSiteLocation(site: {
  installation_address?: unknown;
  province?: string | null;
}): string {
  const address = siteAddress(site);
  const city = address.city ?? address.area;
  const province = site.province ?? address.province;
  return [city, province].filter(Boolean).join(', ') || '—';
}

/** Full street address for the site detail panel. */
export function formatSiteStreet(site: { installation_address?: unknown }): string {
  const address = siteAddress(site);
  return (
    [address.street, address.area, address.city, address.postal_code]
      .filter(Boolean)
      .join(', ') || '—'
  );
}

const TECHNOLOGY_LABELS: Record<string, string> = {
  tarana_fwb: 'Fixed wireless',
  lte_5g: '5G / LTE',
  fibre: 'Fibre',
};

export function formatTechnology(technology: string | null | undefined): string {
  if (!technology) return '—';
  return TECHNOLOGY_LABELS[technology] ?? technology;
}

export function formatZar(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return `R${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
