export const PLAN_TO_PRODUCT: Record<string, { productSlug: string; tierName: string; dbName: string }> = {
  'skyfibre-home-plus':    { productSlug: 'skyfibre-home', tierName: 'SkyFibre Home Plus',    dbName: 'SkyFibre Home Plus' },
  'skyfibre-home-max':     { productSlug: 'skyfibre-home', tierName: 'SkyFibre Home Max',     dbName: 'SkyFibre Home Max' },
  'skyfibre-home-ultra':   { productSlug: 'skyfibre-home', tierName: 'SkyFibre Home Ultra',   dbName: 'SkyFibre Home Ultra' },
  'skyfibre-home-pro-100': { productSlug: 'skyfibre-home', tierName: 'SkyFibre Home Pro',     dbName: 'SkyFibre Home Pro 100' },
};

export function resolvePlan(planId: string): { productSlug: string; tierName: string; dbName: string } | null {
  return PLAN_TO_PRODUCT[planId] ?? null;
}

/** Returns all plan entries for a given product slug — used to bulk-fetch DB prices for a product's pricing block. */
export function getPlansBySlug(productSlug: string): Array<{ tierName: string; dbName: string }> {
  return Object.values(PLAN_TO_PRODUCT).filter((p) => p.productSlug === productSlug);
}
