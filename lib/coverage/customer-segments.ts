/**
 * Customer segment logic for the public coverage check.
 *
 * The `?type=` URL param carries the segment chosen on the homepage hero
 * (Home / Work from home / Business). `service_packages.customer_type`
 * ('consumer' | 'business' | 'both' | 'soho') is the governing filter field
 * — `market_segment` is inconsistently populated and must NOT be used.
 */

export type CoverageSegment = 'residential' | 'wfh' | 'business';

const SEGMENT_CUSTOMER_TYPES: Record<CoverageSegment, string[]> = {
  residential: ['consumer', 'both'],
  wfh: ['soho', 'consumer', 'both'],
  business: ['business', 'both'],
};

export function normalizeSegment(type: string | null | undefined): CoverageSegment {
  return type === 'business' || type === 'wfh' ? type : 'residential';
}

export function customerTypesForSegment(segment: CoverageSegment): string[] {
  return SEGMENT_CUSTOMER_TYPES[segment];
}

/**
 * WFH results lead with SOHO (WorkConnect) packages; within each group the
 * API's price-ascending order is preserved. Other segments are untouched.
 */
export function sortPackagesForSegment<T extends { customer_type?: string; price: number }>(
  segment: CoverageSegment,
  packages: T[]
): T[] {
  if (segment !== 'wfh') return packages;
  return [...packages].sort((a, b) => {
    const aSoho = a.customer_type === 'soho' ? 0 : 1;
    const bSoho = b.customer_type === 'soho' ? 0 : 1;
    return aSoho - bSoho || a.price - b.price;
  });
}

/**
 * Business packages (BizFibreConnect, SkyFibre SME, …) onboard via the B2B
 * quote/KYC pipeline, never consumer self-checkout.
 */
export function isQuoteOnlyPackage(pkg: { customer_type?: string }): boolean {
  return pkg.customer_type === 'business';
}

/** Maps the hero's SegmentType ('home' | 'wfh' | 'business') to the URL type. */
export function heroSegmentToUrlType(segment: 'home' | 'wfh' | 'business'): CoverageSegment {
  return segment === 'home' ? 'residential' : segment;
}
