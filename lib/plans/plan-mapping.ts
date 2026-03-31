export const PLAN_TO_PRODUCT: Record<string, { sanitySlug: string; tierName: string }> = {
  'skyfibre-home-plus':    { sanitySlug: 'skyfibre-home', tierName: 'SkyFibre Home Plus' },
  'skyfibre-home-max':     { sanitySlug: 'skyfibre-home', tierName: 'SkyFibre Home Max' },
  'skyfibre-home-ultra':   { sanitySlug: 'skyfibre-home', tierName: 'SkyFibre Home Ultra' },
  'skyfibre-home-pro-100': { sanitySlug: 'skyfibre-home', tierName: 'SkyFibre Home Pro' },
};

export function resolvePlan(planId: string): { sanitySlug: string; tierName: string } | null {
  return PLAN_TO_PRODUCT[planId] ?? null;
}
