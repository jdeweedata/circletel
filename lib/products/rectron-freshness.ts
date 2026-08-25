/** Rectron price list used as the CPE source for CircleConnect / OTG bundles. */
export const RECTRON_PRICE_LIST_CUTOFF = '2026-08-11';

export function isRectronCatalogueFresh(
  lastSyncedAt: string | null | undefined,
  cutoff = RECTRON_PRICE_LIST_CUTOFF
): boolean {
  if (!lastSyncedAt) return false;
  return lastSyncedAt.slice(0, 10) >= cutoff;
}
