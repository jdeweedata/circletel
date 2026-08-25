/**
 * Pure types for service × billing-cycle three-way match
 * (ISP platform ↔ Zoho Books ↔ Netcash).
 */

export type CycleMatchState = 'matched_3' | 'matched_2' | 'unmatched';

export type LeakType =
  | 'never_invoiced'
  | 'under_contract'
  | 'promo_expired'
  | 'cancelled_still_billing';

export type RecommendedAction =
  | 'create_invoice'
  | 'credit_note'
  | 'debit_note'
  | 'request_mandate'
  | 'open_exception'
  | 'none';

export type ServiceStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

export interface CycleMatchInput {
  serviceId: string;
  customerId: string;
  serviceStatus: ServiceStatus;
  serviceActive: boolean;
  packageName: string;
  monthlyPrice: number;
  platformExVat: number;
  platformInclVat: number;
  zohoExVat: number | null;
  zohoInclVat: number | null;
  zohoInvoiceId: string | null;
  zohoInvoiceNumber: string | null;
  zohoBooksInvoiceId: string | null;
  netcashAmount: number | null;
  netcashRef: string | null;
  promoExpiredStillDiscounted: boolean;
}

export interface PairwiseVerdict {
  ok: boolean;
  platform?: number | null;
  zoho?: number | null;
  netcash?: number | null;
  delta: number | null;
  label: string;
}

export interface CycleMatchPairwise {
  platformToZoho: PairwiseVerdict;
  zohoToNetcash: PairwiseVerdict;
  platformToNetcash: PairwiseVerdict;
}

export interface FieldDiffRow {
  field: string;
  platform: string;
  zoho: string;
  netcash: string;
  mismatch: boolean;
}

export interface ScoredCycleMatch {
  serviceId: string;
  customerId: string;
  matchState: CycleMatchState;
  legsPresent: 0 | 1 | 2 | 3;
  pairwise: CycleMatchPairwise;
  leakType: LeakType | null;
  signedVariance: number;
  exposure: number;
  recommendedAction: RecommendedAction;
  diagnosis: string;
  patternKey: string | null;
  fieldDiff: FieldDiffRow[];
  platformExVat: number;
  platformInclVat: number;
  zohoExVat: number | null;
  zohoInclVat: number | null;
  zohoInvoiceId: string | null;
  zohoInvoiceNumber: string | null;
  zohoBooksInvoiceId: string | null;
  netcashAmount: number | null;
  netcashRef: string | null;
  packageName: string;
  serviceStatus: ServiceStatus;
  serviceActive: boolean;
}

export interface FunnelStage {
  count: number;
  amount: number;
  dropCount: number;
  dropAmount: number;
}

export interface FunnelLeakCard {
  count: number;
  amount: number;
}

export interface CycleFunnel {
  stages: {
    activeOnNetwork: FunnelStage;
    contracted: FunnelStage;
    invoiced: FunnelStage;
    collected: FunnelStage;
  };
  leaks: Record<LeakType, FunnelLeakCard>;
  leakageTotal: number;
  billedAndCollectedPct: number;
}
