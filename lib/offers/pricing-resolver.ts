import type {
  OfferDraft,
  CostBuildupLine,
  OfferGuardrailStatus,
  OfferPricingSnapshotInput,
} from '@/lib/types/offer';

const DEFAULT_MARGIN_FLOOR_PCT = 25;
const WARNING_BAND_PCT = 5;

function computeMarginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

function classifyGuardrail(
  price: number,
  marginPct: number,
  floorPct: number,
): OfferGuardrailStatus {
  if (price <= 0) return 'fail';
  if (marginPct < floorPct) return 'fail';
  if (marginPct < floorPct + WARNING_BAND_PCT) return 'warning';
  return 'pass';
}

export function resolveOfferPricing(
  draft: OfferDraft,
  opts: { marginFloorPct?: number } = {},
): OfferPricingSnapshotInput {
  const floorPct = opts.marginFloorPct ?? DEFAULT_MARGIN_FLOOR_PCT;

  const costBuildup: CostBuildupLine[] = draft.components.map((c) => ({
    label: c.label,
    sourceType: c.sourceType,
    unitCost: c.unitCost,
    qty: c.qty,
    lineCost: Math.round(c.unitCost * c.qty * 100) / 100,
  }));

  const totalCost = Math.round(
    costBuildup.reduce((sum, l) => sum + l.lineCost, 0) * 100,
  ) / 100;

  const resolvedPrice = draft.basePrice;
  const marginPct = computeMarginPct(resolvedPrice, totalCost);
  const guardrailStatus = classifyGuardrail(resolvedPrice, marginPct, floorPct);

  return { resolvedPrice, costBuildup, totalCost, marginPct, guardrailStatus };
}
