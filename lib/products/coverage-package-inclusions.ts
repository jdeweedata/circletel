import {
  OP19627_PROMOS,
  getFiveGCardDataCap,
  getFiveGOfferTerm,
  type FiveGOfferMetadata,
} from '@/lib/products/five-g-offer-term';
import {
  appendTermsAndConditions,
  type TermsInfoItem,
} from '@/lib/products/terms-info';

export interface CoveragePackageInclusionsInput {
  sku?: string;
  name?: string;
  speed_down?: number;
  speed_up?: number;
  features?: string[];
  metadata?: (FiveGOfferMetadata & { router_model?: string }) | null;
}

export interface CoveragePackageTermGroup<T extends CoveragePackageInclusionsInput> {
  contractRouter: T[];
  simOnly: T[];
  other: T[];
}

function formatFup(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1).replace(/\.0$/, '')}TB`;
  }
  return `${gb}GB`;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isDuplicate(text: string, existing: string[]): boolean {
  const needle = normalize(text);
  return existing.some((item) => {
    const hay = normalize(item);
    return hay === needle || hay.includes(needle) || needle.includes(hay);
  });
}

function dataLine(metadata?: CoveragePackageInclusionsInput['metadata']): string | null {
  const cap = getFiveGCardDataCap(metadata);
  const fupGb = metadata?.fup_limit_gb;

  if (cap.unit === 'GB') {
    return `${cap.displayData} GB monthly hard cap`;
  }

  if (fupGb && fupGb > 0) {
    return `Uncapped data with ${formatFup(fupGb)} Fair Usage Policy`;
  }

  if (cap.caption === 'Uncapped') {
    return 'Uncapped data';
  }

  return null;
}

function routerLine(metadata?: CoveragePackageInclusionsInput['metadata']): string | null {
  const term = getFiveGOfferTerm(metadata);
  if (term.kind === 'mtm_sim' || metadata?.router_included === false) {
    return 'SIM only — bring your own compatible 5G router';
  }
  if (metadata?.router_included) {
    const model = metadata.router_model?.trim();
    return model ? `Free ${model} router included` : 'Free router included';
  }
  return null;
}

function speedLine(speedDown?: number, speedUp?: number): string | null {
  if (!speedDown || speedDown <= 0) return null;
  if (speedUp && speedUp > 0) {
    return `${speedDown} Mbps download / ${speedUp} Mbps upload`;
  }
  return `${speedDown} Mbps download`;
}

/**
 * Catalogue-true "what's included" for the coverage-results sidebar.
 * Metadata (term, router, FUP/cap, speeds) leads; leftover unique features follow.
 */
export function getCoveragePackageInclusions(
  pkg: CoveragePackageInclusionsInput
): TermsInfoItem[] {
  const metadata = pkg.metadata ?? undefined;
  const term = getFiveGOfferTerm(metadata);
  const lines: string[] = [];

  if (term.label) lines.push(term.label);

  const router = routerLine(metadata);
  if (router) lines.push(router);

  const data = dataLine(metadata);
  if (data) lines.push(data);

  const speeds = speedLine(pkg.speed_down, pkg.speed_up);
  if (speeds) lines.push(speeds);

  for (const feature of pkg.features || []) {
    if (!feature?.trim()) continue;
    if (/\b0\s*mbps\b/i.test(feature)) continue;
    if (isDuplicate(feature, lines)) continue;
    lines.push(feature.trim());
  }

  return appendTermsAndConditions(lines);
}

export function getCoveragePromoBadge(
  sku?: string,
  promotionPrice?: number,
  _promotionMonths?: number
): string | undefined {
  const promo = OP19627_PROMOS.find((row) => row.sku === sku);
  if (promo) {
    const [, month, day] = promo.ends.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Promo to ${day} ${months[month - 1]}`;
  }
  if (promotionPrice != null) return 'PROMO';
  return undefined;
}

export function groupCoveragePackagesByTerm<T extends CoveragePackageInclusionsInput>(
  packages: T[]
): CoveragePackageTermGroup<T> {
  const contractRouter: T[] = [];
  const simOnly: T[] = [];
  const other: T[] = [];

  for (const pkg of packages) {
    const kind = getFiveGOfferTerm(pkg.metadata).kind;
    if (kind === 'contract_router') contractRouter.push(pkg);
    else if (kind === 'mtm_sim') simOnly.push(pkg);
    else other.push(pkg);
  }

  return { contractRouter, simOnly, other };
}
