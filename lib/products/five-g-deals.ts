import { createClient } from '@/lib/supabase/server';
import { groupCoveragePackagesByTerm } from '@/lib/products/coverage-package-inclusions';
import {
  OP19627_PROMOS,
  getFiveGCardDataCap,
  getFiveGOfferTerm,
  type FiveGOfferMetadata,
} from '@/lib/products/five-g-offer-term';

export const HUAWEI_H155_386 = {
  image: '/images/hardware/cpe/huawei-h155-386.png',
  alt: 'Huawei H155-386 5G CPE router',
  model: 'Huawei H155-386 5G CPE',
} as const;

export const CIRCLETEL_NANO_SIM = {
  image: '/images/hardware/sim/circletel-nano-sim.png',
  alt: 'CircleTel 5G nano SIM',
} as const;

export const FIVE_G_HERO = {
  image: '/images/hardware/cpe/huawei-h155-386-desk.png',
  alt: 'Huawei H155-386 5G router on a home desk',
} as const;

export const FIVE_G_FEATURED_SKUS = ['CC-5G-CON-060', 'CC-OP-UNC-20'] as const;

export const FIVE_G_PROMO_PAGES = {
  'circleconnect-5g-60-mbps': {
    sku: 'CC-5G-CON-060',
    cpeImage: HUAWEI_H155_386.image,
    cpeAlt: HUAWEI_H155_386.alt,
  },
  'circleconnect-uncapped-20-mbps': {
    sku: 'CC-OP-UNC-20',
    cpeImage: HUAWEI_H155_386.image,
    cpeAlt: HUAWEI_H155_386.alt,
  },
} as const;

export type FiveGPromoSlug = keyof typeof FIVE_G_PROMO_PAGES;

export type FiveGDealMetadata = FiveGOfferMetadata & {
  router_model?: string;
};

export interface FiveGDealPackage {
  id: string;
  sku: string;
  slug: string | null;
  name: string;
  description?: string | null;
  service_type?: string | null;
  speed_down?: number;
  speed_up?: number;
  price?: number | string | null;
  promotion_price?: number | string | null;
  base_price_zar?: number | string | null;
  features?: string[];
  metadata?: FiveGDealMetadata | null;
  is_featured?: boolean;
  sort_order?: number;
}

export interface FiveGPriceSource {
  price?: number | string | null;
  promotion_price?: number | string | null;
  base_price_zar?: number | string | null;
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getFiveGListingTitle(
  product: Pick<FiveGDealPackage, 'sku' | 'name' | 'speed_down'>,
  variant: 'featured' | 'compact'
): string {
  if (variant === 'featured') {
    if (product.sku === 'CC-5G-CON-060') return '5G 60 + Huawei CPE';
    if (product.sku === 'CC-OP-UNC-20') return 'Uncapped 20 Mbps + Huawei CPE';
  }

  const raw = product.name.replace(/^CircleConnect\s+/i, '').replace(/\s+SIM Only$/i, '').trim();
  if (/best effort/i.test(raw)) return 'Best Effort';
  if (/fwa/i.test(raw)) {
    const gb = raw.match(/(\d+)\s*GB/i);
    return gb ? `FWA ${gb[1]}GB` : 'FWA';
  }
  if (product.speed_down && product.speed_down > 0) return `${product.speed_down} Mbps`;
  return raw;
}

export function getFiveGSpecLabel(product: FiveGDealPackage): string {
  const cap = getFiveGCardDataCap(product.metadata);
  if (cap.unit === 'GB') return `${cap.displayData}GB`;
  const fup = product.metadata?.fup_limit_gb;
  if (fup && fup > 0) {
    const label = fup >= 1000 ? `${(fup / 1000).toFixed(1).replace(/\.0$/, '')}TB` : `${fup}GB`;
    return `FUP ${label}`;
  }
  return 'Uncapped';
}

export function getFiveGContractRouterCards(packages: FiveGDealPackage[]): FiveGDealPackage[] {
  return packages
    .filter((row) => getFiveGOfferTerm(row.metadata).kind === 'contract_router')
    .filter((row) => row.sku !== 'CC-OP-UNC-20')
    .sort((a, b) => (a.speed_down || 0) - (b.speed_down || 0) || getFiveGSellPrice(a) - getFiveGSellPrice(b));
}

export function formatFiveGPrice(amount: number): string {
  return `R${Math.round(amount).toLocaleString('en-US')}`;
}

export function getFiveGListPrice(product: FiveGPriceSource): number {
  return toNumber(product.price ?? product.base_price_zar);
}

export function getFiveGSellPrice(product: FiveGPriceSource): number {
  const list = getFiveGListPrice(product);
  const promo = toNumber(product.promotion_price);
  if (promo > 0 && (list <= 0 || promo < list)) return promo;
  return list;
}

export function isFiveGPromoSlug(slug: string): slug is FiveGPromoSlug {
  return Object.prototype.hasOwnProperty.call(FIVE_G_PROMO_PAGES, slug);
}

export function getFiveGPromoPage(slug: string) {
  if (!isFiveGPromoSlug(slug)) return null;
  return FIVE_G_PROMO_PAGES[slug];
}

export function getOp19627Promo(sku?: string | null) {
  if (!sku) return undefined;
  return OP19627_PROMOS.find((row) => row.sku === sku);
}

export function parseFiveGMetadata(metadata: unknown): FiveGDealMetadata {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as FiveGDealMetadata;
    } catch {
      return {};
    }
  }
  return metadata as FiveGDealMetadata;
}

export function toFiveGDealPackage(row: Record<string, unknown> | FiveGDealPackage): FiveGDealPackage {
  return {
    id: String(row.id ?? row.sku ?? ''),
    sku: String(row.sku ?? ''),
    slug: typeof row.slug === 'string' ? row.slug : null,
    name: String(row.name ?? ''),
    description: typeof row.description === 'string' ? row.description : null,
    service_type: typeof row.service_type === 'string' ? row.service_type : null,
    speed_down: row.speed_down == null ? undefined : Number(row.speed_down),
    speed_up: row.speed_up == null ? undefined : Number(row.speed_up),
    price: (row.price as number | string | null | undefined) ?? null,
    promotion_price: (row.promotion_price as number | string | null | undefined) ?? null,
    base_price_zar: (row.base_price_zar as number | string | null | undefined) ?? null,
    features: Array.isArray(row.features) ? (row.features as string[]) : undefined,
    metadata: parseFiveGMetadata(row.metadata),
    is_featured: Boolean(row.is_featured),
    sort_order: row.sort_order == null ? undefined : Number(row.sort_order),
  };
}

export function splitFiveGDeals(packages: FiveGDealPackage[]) {
  const featured = FIVE_G_FEATURED_SKUS.map((sku) =>
    packages.find((row) => row.sku === sku)
  ).filter((row): row is FiveGDealPackage => Boolean(row));

  const remaining = packages.filter(
    (row) => !FIVE_G_FEATURED_SKUS.includes(row.sku as (typeof FIVE_G_FEATURED_SKUS)[number])
  );
  const grouped = groupCoveragePackagesByTerm(remaining);

  return {
    featured,
    contractRouter: grouped.contractRouter,
    simOnly: grouped.simOnly,
    other: grouped.other,
  };
}

export async function getFiveGDealsPackages(): Promise<FiveGDealPackage[]> {
  const supabase = await createClient();
  const promoSkus = OP19627_PROMOS.map((row) => row.sku);

  const [fiveGResult, promoResult] = await Promise.all([
    supabase
      .from('service_packages')
      .select('*')
      .eq('active', true)
      .ilike('service_type', '%5G%')
      .order('sort_order', { ascending: true })
      .order('price', { ascending: true }),
    supabase.from('service_packages').select('*').eq('active', true).in('sku', promoSkus),
  ]);

  if (fiveGResult.error) {
    console.error('getFiveGDealsPackages 5G query failed', fiveGResult.error);
  }
  if (promoResult.error) {
    console.error('getFiveGDealsPackages promo query failed', promoResult.error);
  }

  const byId = new Map<string, FiveGDealPackage>();
  for (const row of [...(promoResult.data || []), ...(fiveGResult.data || [])]) {
    const pkg = toFiveGDealPackage(row as Record<string, unknown>);
    byId.set(pkg.id || pkg.sku, pkg);
  }

  return Array.from(byId.values());
}
