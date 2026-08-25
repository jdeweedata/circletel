/**
 * Flyer / bundle pricing.
 * Store and compute excl VAT. Flyers are incl VAT.
 *
 * Direct cost = connectivity + CPE amortised (only if not already on the Helios
 * deal) + licence CSP + any extra BOM roles.
 */

import type { ProductLineWithRelations } from '@/lib/types/product-lines';

export const VAT_RATE = 0.15;
export const FINANCE_MARGIN_FLOOR_PCT = 25;

export const M365_BUSINESS_STANDARD = {
  name: 'Microsoft 365 Business Standard',
  retailExcl: 329,
  cspExcl: 270,
} as const;

export interface BundleBomComponent {
  role: string;
  costExcl: number | null;
  amortiseMonths: number | null;
  heliosIncludesCpe: boolean;
}

export interface BundleTemplate {
  code: string;
  name: string;
  productLineCode: string;
  billedInclVat: number;
  defaultTermMonths: 12 | 24 | 36;
  defaultHeliosIncludesCpe: boolean;
  defaultM365Seats: number;
  /** SkyTel / wholesale connectivity cost excl VAT */
  defaultConnectivityCostExcl: number;
  /** Catalogue list ARPU excl VAT (for drift vs flyer) */
  catalogueListExcl?: number;
  packageSku?: string | null;
  publishedPackageId?: string | null;
  components?: BundleBomComponent[];
}

export interface BundlePriceInput {
  template: BundleTemplate;
  termMonths: 12 | 24 | 36;
  billedInclVat?: number;
  heliosIncludesCpe: boolean;
  /** Rectron (or Helios outright) dealer cost excl VAT. Ignored when heliosIncludesCpe and addCpeUpgrade is false. */
  cpeCostExcl: number;
  /** Explicit upgrade: add Rectron CPE even if the Helios deal already includes a router. */
  addCpeUpgrade: boolean;
  m365Seats: number;
  connectivityCostExcl?: number;
}

export interface BundlePriceResult {
  template: BundleTemplate;
  billedInclVat: number;
  billedExclVat: number;
  connectivityCostExcl: number;
  extraRoleCostExcl: number;
  cpeCharged: boolean;
  cpeCashOutExcl: number;
  cpeAmortisedMonthlyExcl: number;
  m365CspMonthlyExcl: number;
  m365RetailMonthlyExcl: number;
  directCostExcl: number;
  contributionExcl: number;
  marginPct: number;
  month1CashOutExcl: number;
  belowFloor: boolean;
  floorPct: number;
  priceDriftNote: string | null;
}

export function inclToExcl(incl: number, vatRate = VAT_RATE): number {
  return round2(incl / (1 + vatRate));
}

export function exclToIncl(excl: number, vatRate = VAT_RATE): number {
  return round2(excl * (1 + vatRate));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function sumRoleCost(components: BundleBomComponent[] | undefined, role: string): number | null {
  if (!components?.length) return null;
  const rows = components.filter((c) => c.role === role);
  if (rows.length === 0) return null;
  return round2(rows.reduce((sum, row) => sum + Math.max(0, row.costExcl ?? 0), 0));
}

export function priceBundle(input: BundlePriceInput): BundlePriceResult {
  const template = input.template;
  const billedInclVat = input.billedInclVat ?? template.billedInclVat;
  const billedExclVat = inclToExcl(billedInclVat);

  const fromBomConn = sumRoleCost(template.components, 'connectivity');
  const connectivityCostExcl =
    input.connectivityCostExcl ?? fromBomConn ?? template.defaultConnectivityCostExcl;

  const cpeCharged = input.addCpeUpgrade || !input.heliosIncludesCpe;
  const cpeCashOutExcl = cpeCharged ? round2(Math.max(0, input.cpeCostExcl)) : 0;
  const cpeAmortisedMonthlyExcl =
    cpeCashOutExcl > 0 ? round2(cpeCashOutExcl / input.termMonths) : 0;

  const fromBomLicence = sumRoleCost(template.components, 'licence');
  const m365CspMonthlyExcl =
    fromBomLicence != null && input.m365Seats > 0
      ? round2(fromBomLicence)
      : round2(input.m365Seats * M365_BUSINESS_STANDARD.cspExcl);
  const m365RetailMonthlyExcl = round2(input.m365Seats * M365_BUSINESS_STANDARD.retailExcl);

  const reserved = new Set(['connectivity', 'cpe', 'licence']);
  const extraRoleCostExcl = round2(
    (template.components ?? [])
      .filter((c) => !reserved.has(c.role))
      .reduce((sum, row) => sum + Math.max(0, row.costExcl ?? 0), 0)
  );

  const directCostExcl = round2(
    connectivityCostExcl + cpeAmortisedMonthlyExcl + m365CspMonthlyExcl + extraRoleCostExcl
  );
  const contributionExcl = round2(billedExclVat - directCostExcl);
  const marginPct =
    billedExclVat > 0 ? round2((contributionExcl / billedExclVat) * 100) : 0;

  const month1CashOutExcl = round2(
    connectivityCostExcl + cpeCashOutExcl + m365CspMonthlyExcl + extraRoleCostExcl
  );

  let priceDriftNote: string | null = null;
  if (template.catalogueListExcl != null) {
    const flyerExcl = billedExclVat;
    if (Math.abs(template.catalogueListExcl - flyerExcl) >= 1) {
      priceDriftNote = `Catalogue list R${template.catalogueListExcl.toFixed(2)} excl vs flyer R${flyerExcl.toFixed(2)} excl (R${billedInclVat} incl)`;
    }
  }

  return {
    template,
    billedInclVat,
    billedExclVat,
    connectivityCostExcl,
    extraRoleCostExcl,
    cpeCharged,
    cpeCashOutExcl,
    cpeAmortisedMonthlyExcl,
    m365CspMonthlyExcl,
    m365RetailMonthlyExcl,
    directCostExcl,
    contributionExcl,
    marginPct,
    month1CashOutExcl,
    belowFloor: marginPct < FINANCE_MARGIN_FLOOR_PCT,
    floorPct: FINANCE_MARGIN_FLOOR_PCT,
    priceDriftNote,
  };
}

export interface BundleLineAllocation {
  connectivityMonthlyExcl: number;
  cpeMonthlyExcl: number;
  m365MonthlyExcl: number;
  m365Seats: number;
  m365MonthlyExclPerSeat: number;
}

/**
 * Split billed excl VAT across quote lines so they sum to the flyer price.
 * M365 is allocated from the bundle, not listed at CSP/retail (that would overflow OTG).
 */
export function allocateBundleLineItems(
  pricing: BundlePriceResult,
  m365Seats: number
): BundleLineAllocation {
  const cpeMonthlyExcl = pricing.cpeCharged ? pricing.cpeAmortisedMonthlyExcl : 0;
  const remaining = round2(Math.max(0, pricing.billedExclVat - cpeMonthlyExcl));
  const seats = Math.max(0, m365Seats);
  const m365Cost = pricing.m365CspMonthlyExcl;
  const pool = pricing.connectivityCostExcl + m365Cost;

  let m365MonthlyExcl = 0;
  if (seats > 0 && pool > 0) {
    m365MonthlyExcl = round2(remaining * (m365Cost / pool));
  }
  const connectivityMonthlyExcl = round2(remaining - m365MonthlyExcl);

  return {
    connectivityMonthlyExcl,
    cpeMonthlyExcl,
    m365MonthlyExcl,
    m365Seats: seats,
    m365MonthlyExclPerSeat: seats > 0 ? round2(m365MonthlyExcl / seats) : 0,
  };
}

export function bundleTemplateFromLine(line: ProductLineWithRelations): BundleTemplate {
  const live = line.published_defaults;
  const billedIncl =
    live?.billedInclVat ?? line.billed_incl_vat_zar ?? line.list_arpu_incl_vat_zar ?? 0;
  const connectivity =
    live?.connectivityCostExcl ??
    line.default_connectivity_cost_excl ??
    0;
  return {
    code: line.code,
    name: line.name,
    productLineCode: line.code,
    billedInclVat: billedIncl,
    defaultTermMonths: live?.termMonths ?? line.default_term_months,
    defaultHeliosIncludesCpe: live?.heliosIncludesCpe ?? line.default_helios_includes_cpe,
    defaultM365Seats: live?.m365Seats ?? line.default_m365_seats,
    defaultConnectivityCostExcl: connectivity,
    catalogueListExcl: line.list_arpu_zar ?? undefined,
    packageSku: live?.packageSku ?? line.skus.find((s) => s.sku)?.sku ?? null,
    publishedPackageId: line.published_package_id,
    components: line.bundle_components.map((c) => ({
      role: c.component_role,
      costExcl: c.default_cost_excl,
      amortiseMonths: c.amortise_months,
      heliosIncludesCpe: c.helios_includes_cpe,
    })),
  };
}

/** Working (possibly unapproved) defaults — builder preview, not sell surfaces. */
export function workingBundleTemplateFromLine(line: ProductLineWithRelations): BundleTemplate {
  return {
    code: line.code,
    name: line.name,
    productLineCode: line.code,
    billedInclVat: line.billed_incl_vat_zar ?? line.list_arpu_incl_vat_zar ?? 0,
    defaultTermMonths: line.default_term_months,
    defaultHeliosIncludesCpe: line.default_helios_includes_cpe,
    defaultM365Seats: line.default_m365_seats,
    defaultConnectivityCostExcl: line.default_connectivity_cost_excl ?? 0,
    catalogueListExcl: line.list_arpu_zar ?? undefined,
    packageSku: line.skus.find((s) => s.sku)?.sku ?? line.published_defaults?.packageSku ?? null,
    publishedPackageId: line.published_package_id,
    components: line.bundle_components.map((c) => ({
      role: c.component_role,
      costExcl: c.default_cost_excl,
      amortiseMonths: c.amortise_months,
      heliosIncludesCpe: c.helios_includes_cpe,
    })),
  };
}
