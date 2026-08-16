/**
 * CircleConnect / OTG bundle pricing.
 * Store and compute excl VAT. Flyers are incl VAT.
 *
 * Direct cost = SkyTel net + CPE amortised (only if not already on the Helios deal) + M365 CSP.
 */

export const VAT_RATE = 0.15;
export const FINANCE_MARGIN_FLOOR_PCT = 25;

export const M365_BUSINESS_STANDARD = {
  name: 'Microsoft 365 Business Standard',
  retailExcl: 329,
  cspExcl: 270,
} as const;

export type BundleTemplateCode = 'otg' | 'circleconnect-5g-essential';

export interface BundleTemplate {
  code: BundleTemplateCode;
  name: string;
  productLineCode: string;
  billedInclVat: number;
  defaultTermMonths: 12 | 24;
  defaultHeliosIncludesCpe: boolean;
  defaultM365Seats: number;
  /** SkyTel / wholesale connectivity cost excl VAT */
  defaultConnectivityCostExcl: number;
  /** Catalogue list ARPU excl VAT (for drift vs flyer) */
  catalogueListExcl?: number;
}

export const BUNDLE_TEMPLATES: Record<BundleTemplateCode, BundleTemplate> = {
  otg: {
    code: 'otg',
    name: 'OTG — On the Go',
    productLineCode: 'otg',
    billedInclVat: 399,
    defaultTermMonths: 12,
    defaultHeliosIncludesCpe: false,
    defaultM365Seats: 1,
    defaultConnectivityCostExcl: 174, // ~20GB data SIM net; finance must confirm vs current Helios
  },
  'circleconnect-5g-essential': {
    code: 'circleconnect-5g-essential',
    name: 'CircleConnect 5G Essential',
    productLineCode: 'circleconnect-5g-essential',
    billedInclVat: 489,
    defaultTermMonths: 24,
    defaultHeliosIncludesCpe: true,
    defaultM365Seats: 0,
    defaultConnectivityCostExcl: 390.43,
    catalogueListExcl: 449,
  },
};

export interface BundlePriceInput {
  template: BundleTemplateCode;
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

export function priceBundle(input: BundlePriceInput): BundlePriceResult {
  const template = BUNDLE_TEMPLATES[input.template];
  const billedInclVat = input.billedInclVat ?? template.billedInclVat;
  const billedExclVat = inclToExcl(billedInclVat);
  const connectivityCostExcl = input.connectivityCostExcl ?? template.defaultConnectivityCostExcl;

  const cpeCharged = input.addCpeUpgrade || !input.heliosIncludesCpe;
  const cpeCashOutExcl = cpeCharged ? round2(Math.max(0, input.cpeCostExcl)) : 0;
  const cpeAmortisedMonthlyExcl =
    cpeCashOutExcl > 0 ? round2(cpeCashOutExcl / input.termMonths) : 0;

  const m365CspMonthlyExcl = round2(input.m365Seats * M365_BUSINESS_STANDARD.cspExcl);
  const m365RetailMonthlyExcl = round2(input.m365Seats * M365_BUSINESS_STANDARD.retailExcl);

  const directCostExcl = round2(
    connectivityCostExcl + cpeAmortisedMonthlyExcl + m365CspMonthlyExcl
  );
  const contributionExcl = round2(billedExclVat - directCostExcl);
  const marginPct =
    billedExclVat > 0 ? round2((contributionExcl / billedExclVat) * 100) : 0;

  const month1CashOutExcl = round2(connectivityCostExcl + cpeCashOutExcl + m365CspMonthlyExcl);

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
