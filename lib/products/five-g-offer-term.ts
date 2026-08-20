/**
 * CircleConnect 5G storefront term labels and August 2026 Helios catalogue numbers.
 *
 * Public cards must show 24-month + router vs month-to-month SIM only.
 * Helios book SKUs are VAT-inclusive pass-through. OP19627 public promos add a
 * cost-to-serve overlay (support + admin) and still undercut MTN shop.
 */

export type FiveGOfferTermKind = 'contract_router' | 'mtm_sim' | 'unknown';

export interface FiveGOfferTerm {
  kind: FiveGOfferTermKind;
  label: string;
  priceHint: string;
}

export interface FiveGOfferMetadata {
  router_included?: boolean;
  contract_type?: string;
  contract_duration?: string;
  data_limit?: string;
  data_cap?: string;
  data_cap_gb?: number;
  capped?: boolean;
  fup_limit_gb?: number;
}

export interface CircleConnect5GCatalogueRow {
  sku: string;
  dealId: string;
  kind: Exclude<FiveGOfferTermKind, 'unknown'>;
  costInclVat: number;
  sellInclVat: number;
}

export interface Op19627Promo {
  sku: string;
  dealId: string;
  kind: 'contract_router';
  costInclVat: number;
  promoSellInclVat: number;
  mtnRetailInclVat: number;
  ends: string;
}

/**
 * CircleTel-only OP19627 promos. Ends 30 Sep 2026.
 * Sell = SkyTel cost + CTS overlay (R50 / R70), still R50 under MTN shop.
 * Combined take stays below the 25% floor — MD promo exception vs pass-through.
 */
export const OP19627_PROMOS: Op19627Promo[] = [
  {
    sku: 'CC-OP-UNC-20',
    dealId: 'EBUOP:19627000',
    kind: 'contract_router',
    costInclVat: 499,
    promoSellInclVat: 549,
    mtnRetailInclVat: 599,
    ends: '2026-09-30',
  },
  {
    sku: 'CC-5G-CON-060',
    dealId: 'EBUOP:19627001',
    kind: 'contract_router',
    costInclVat: 579,
    promoSellInclVat: 649,
    mtnRetailInclVat: 699,
    ends: '2026-09-30',
  },
];

/** Live Helios Deal IDs (in-stock CPE where a router is included). Promo ends 6 Sep 2026. */
export const CIRCLECONNECT_5G_CATALOGUE: CircleConnect5GCatalogueRow[] = [
  {
    sku: 'CC-5G-CON-035',
    dealId: '202604EBU0002',
    kind: 'contract_router',
    costInclVat: 489,
    sellInclVat: 489,
  },
  {
    sku: 'CC-5G-M2M-035',
    dealId: '2026EBU00221',
    kind: 'mtm_sim',
    costInclVat: 539,
    sellInclVat: 539,
  },
  {
    sku: 'CC-5G-M2M-FWA',
    dealId: '2026EBU00223',
    kind: 'mtm_sim',
    costInclVat: 649,
    sellInclVat: 649,
  },
  {
    sku: 'CC-5G-CON-060',
    dealId: 'EBUOP:19627001',
    kind: 'contract_router',
    costInclVat: 579,
    sellInclVat: 649,
  },
  {
    sku: 'CC-5G-M2M-060',
    dealId: '2026EBU00224',
    kind: 'mtm_sim',
    costInclVat: 759,
    sellInclVat: 759,
  },
  {
    sku: 'CC-5G-CON-BE',
    dealId: '202604EBU0005',
    kind: 'contract_router',
    costInclVat: 1029,
    sellInclVat: 1029,
  },
  {
    sku: 'CC-5G-M2M-BE',
    dealId: '2026EBU00225',
    kind: 'mtm_sim',
    costInclVat: 1079,
    sellInclVat: 1079,
  },
];

export function grossMarginPct(sellInclVat: number, costInclVat: number): number {
  if (sellInclVat <= 0) return 0;
  return Number((((sellInclVat - costInclVat) / sellInclVat) * 100).toFixed(1));
}

export function getFiveGOfferTerm(metadata?: FiveGOfferMetadata | null): FiveGOfferTerm {
  const type = `${metadata?.contract_type || ''} ${metadata?.contract_duration || ''}`.toLowerCase();
  const router = metadata?.router_included === true;
  const isMtm = type.includes('month-to-month') || type.includes('month to month');
  const is24 = type.includes('24');

  if (router && (is24 || !isMtm)) {
    return {
      kind: 'contract_router',
      label: '24-month + router',
      priceHint: 'per month incl. VAT · 24-month contract',
    };
  }

  if (!router && (isMtm || !is24)) {
    return {
      kind: 'mtm_sim',
      label: 'Month-to-month SIM only',
      priceHint: 'per month incl. VAT · no contract',
    };
  }

  return {
    kind: 'unknown',
    label: '',
    priceHint: 'per month incl. VAT',
  };
}

export function getFiveGCardDataCap(metadata?: FiveGOfferMetadata | null): {
  displayData: string;
  unit: 'GB' | null;
  caption: string;
} {
  const dataLimit = metadata?.data_limit;
  const hardCapped =
    metadata?.capped === true ||
    /hard cap/i.test(metadata?.data_cap || '') ||
    (typeof dataLimit === 'string' &&
      dataLimit.toLowerCase() !== 'unlimited' &&
      dataLimit !== '∞' &&
      dataLimit.trim() !== '');

  if (hardCapped) {
    const gb =
      metadata?.data_cap_gb ||
      Number(String(metadata?.data_cap || dataLimit || '').replace(/[^\d]/g, '')) ||
      null;
    if (gb) {
      return { displayData: String(gb), unit: 'GB', caption: 'Monthly Data' };
    }
  }

  return { displayData: '∞', unit: null, caption: 'Uncapped' };
}
