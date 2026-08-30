/**
 * Builds itemised invoice line items for B2B corporate accounts:
 * one Unjani Connect (or package) line per active clinic/site.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { shouldBillUnjaniSiteOnNpcPeriod } from './unjani-connect-rules';

export interface CorporateClinicLineItem {
  description: string;
  site_name: string;
  site_id: string;
  /** Customer-facing site ID printed on the NPC invoice (e.g. CT-UNJ-013). */
  site_code: string;
  service: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  type: 'recurring' | 'pro_rata';
}

export interface ActiveCorporateSite {
  id: string;
  site_name: string;
  account_number?: string | null;
  site_code?: string | null;
  site_number?: number | null;
  monthly_fee: number | null;
  package_id: string | null;
  service_packages?: {
    name: string | null;
    sku: string | null;
    price: number | null;
  } | null;
}

const DEFAULT_PRODUCT_NAME = 'Unjani Connect';
const DEFAULT_SKU = 'UNJ-MC-001';
const DEFAULT_FEE = 450;

export function formatClinicLineDescription(
  siteName: string,
  productName: string = DEFAULT_PRODUCT_NAME,
  suffix?: string
): string {
  const base = `${productName} — ${siteName}`;
  return suffix ? `${base} (${suffix})` : base;
}

export function formatSiteDisplayId(site: {
  account_number?: string | null;
  site_code?: string | null;
  site_number?: number | null;
}): string {
  const account = site.account_number?.trim();
  if (account) return account;
  const code = site.site_code?.trim();
  if (code) return code;
  if (typeof site.site_number === 'number' && Number.isFinite(site.site_number)) {
    return `UNJ-${String(site.site_number).padStart(3, '0')}`;
  }
  return '';
}

export function buildClinicLineItem(
  site: ActiveCorporateSite,
  options: {
    type?: 'recurring' | 'pro_rata';
    amountOverride?: number;
    suffix?: string;
  } = {}
): CorporateClinicLineItem {
  const pkg = site.service_packages;
  const productName =
    pkg?.sku === DEFAULT_SKU || !pkg?.name
      ? DEFAULT_PRODUCT_NAME
      : pkg.name;
  const sku = pkg?.sku ?? DEFAULT_SKU;
  const unitPrice =
    options.amountOverride ??
    Number(site.monthly_fee ?? pkg?.price ?? DEFAULT_FEE);
  const amount = Math.round(unitPrice * 100) / 100;

  return {
    description: formatClinicLineDescription(
      site.site_name,
      productName,
      options.suffix
    ),
    site_name: site.site_name,
    site_id: site.id,
    site_code: formatSiteDisplayId(site),
    service: productName,
    sku,
    quantity: 1,
    unit_price: amount,
    amount,
    type: options.type ?? 'recurring',
  };
}

export async function fetchActiveCorporateSites(
  supabase: SupabaseClient,
  organisationId: string
): Promise<ActiveCorporateSite[]> {
  const { data, error } = await supabase
    .from('corporate_sites')
    .select(
      `
      id,
      site_name,
      account_number,
      site_code,
      site_number,
      monthly_fee,
      package_id,
      service_packages (
        name,
        sku,
        price
      )
    `
    )
    .eq('corporate_id', organisationId)
    .eq('status', 'active')
    .order('site_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load active sites: ${error.message}`);
  }

  return (data ?? []) as unknown as ActiveCorporateSite[];
}

export async function buildActiveClinicLineItems(
  supabase: SupabaseClient,
  organisationId: string,
  options: { periodEnd: string }
): Promise<CorporateClinicLineItem[]> {
  const sites = await fetchActiveCorporateSites(supabase, organisationId);
  return sites
    .filter((site) =>
      shouldBillUnjaniSiteOnNpcPeriod({
        siteName: site.site_name,
        periodEnd: options.periodEnd,
      })
    )
    .map((site) => buildClinicLineItem(site));
}
