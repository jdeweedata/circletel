/**
 * Curated CPE filter for CircleConnect / OTG bundles.
 * Rectron is a component source — only MiFi / 5G CPE / LTE routers belong in the picker.
 */

const CPE_RE =
  /\b(mifi|mi-fi|cpe|router|lte|5g|4g|wireless|huawei|tozed|zyxel|vida|e5576|x100|fwa|broadband)\b/i;

const EXCLUDE_RE =
  /\b(memory|ssd|hdd|cpu|gpu|printer|toner|monitor|keyboard|mouse|ram|nvme|desktop|notebook|laptop)\b/i;

export interface CpeCandidate {
  sku: string;
  name: string;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
  manufacturer?: string | null;
  cost_price?: number | null;
}

export function isCpeDevice(row: CpeCandidate): boolean {
  const hay = [row.name, row.category, row.subcategory, row.description, row.manufacturer]
    .filter(Boolean)
    .join(' ');
  if (EXCLUDE_RE.test(hay) && !CPE_RE.test(hay)) return false;
  return CPE_RE.test(hay);
}

export function filterCpeDevices<T extends CpeCandidate>(rows: T[], limit = 40): T[] {
  return rows.filter(isCpeDevice).slice(0, limit);
}
