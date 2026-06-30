export type OfferSourceType =
  | 'service_package'
  | 'hardware'
  | 'mtn_deal'
  | 'supplier_product'
  | 'labour'
  | 'recurring';

export type OfferLifecycleState =
  | 'idea'
  | 'draft'
  | 'priced'
  | 'approved'
  | 'active'
  | 'archived';

export type OfferGuardrailStatus = 'pass' | 'warning' | 'fail';

export type OfferCustomerType = 'consumer' | 'business' | 'both';

export type OfferComponentRole = 'primary' | 'addon' | 'required';

export interface OfferComponentDraft {
  sourceType: OfferSourceType;
  sourceId: string;       // id in the source table
  qty: number;
  role: OfferComponentRole;
  unitCost: number;       // ZAR, cost-of-sale for this component
  unitPrice: number;      // ZAR, contribution to the offer sell price
  label: string;
}

export interface OfferDraft {
  slug: string;
  title: string;
  customerType: OfferCustomerType;
  basePrice: number;            // resolved sell price (ZAR)
  channelVisibility: string[];  // e.g. ['direct']
  sourceUid: string;            // UnifiedProduct.uid provenance
  sourceUpdatedAt: string | null; // ISO; latest source updated_at
  components: OfferComponentDraft[];
}

export interface CostBuildupLine {
  label: string;
  sourceType: OfferSourceType;
  unitCost: number;
  qty: number;
  lineCost: number;       // unitCost * qty
}

/** Input to the pure resolver — no DB ids/timestamps. */
export interface OfferPricingSnapshotInput {
  resolvedPrice: number;
  costBuildup: CostBuildupLine[];
  totalCost: number;
  marginPct: number;
  guardrailStatus: OfferGuardrailStatus;
}

/** Persisted snapshot (resolver output + offer id + computedAt). */
export interface OfferPricingSnapshot extends OfferPricingSnapshotInput {
  offerId: string;
  computedAt: string;     // ISO
}

/** Public, sanitized offer for the storefront (no cost/margin/provenance). */
export interface PublicOffer {
  slug: string;
  title: string;
  customerType: OfferCustomerType;
  priceInclVat: number;   // ZAR incl. 15% VAT — the only price ever shown
  vatRate: number;        // 0.15
  vatLabel: string;       // "incl. VAT"
  description?: string;   // from media.description (string) only
  image?: string;         // from media.image (string) only
}

/** Detail-page shape — identical to PublicOffer in Plan 2. */
export type PublicOfferDetail = PublicOffer;
