/**
 * Product-line governance types — system of record for sales/finance/exec.
 * CPS/BRD/FSD remain git artifacts; these records point at them.
 */

export type ProductLineLifecycle =
  | 'idea'
  | 'draft'
  | 'active'
  | 'inactive'
  | 'archived';

export type ProductLineSellability =
  | 'sell_now'
  | 'selective'
  | 'attach_only'
  | 'collect_dont_scale'
  | 'not_gate_1'
  | 'sunset';

export type ProductLineRevenueModel =
  | 'circletel_mrr'
  | 'dealer_commission'
  | 'hybrid';

export type ProductLineChannel =
  | 'mtn_wholesale'
  | 'dfa'
  | 'skytel_dealer'
  | 'own_platform';

export type ProductDocStatus = 'missing' | 'draft' | 'current' | 'stale';

export type BundleComponentRole = 'connectivity' | 'cpe' | 'licence';

export type BundleComponentSource =
  | 'skytel_helios'
  | 'rectron'
  | 'm365_csp'
  | 'service_package';

export interface ProductLine {
  id: string;
  code: string;
  name: string;
  lifecycle_stage: ProductLineLifecycle;
  sellability: ProductLineSellability;
  revenue_model: ProductLineRevenueModel;
  channel: ProductLineChannel;
  gate1_eligible: boolean;
  msc_flag: boolean;
  target_market: string | null;
  list_arpu_zar: number | null;
  list_arpu_incl_vat_zar: number | null;
  min_margin_pct: number;
  cps_path: string | null;
  brd_path: string | null;
  fsd_path: string | null;
  cps_status: ProductDocStatus;
  brd_status: ProductDocStatus;
  fsd_status: ProductDocStatus;
  cps_version: string | null;
  brd_version: string | null;
  fsd_version: string | null;
  brd_required: boolean;
  fsd_required: boolean;
  finance_approved_at: string | null;
  finance_approved_by: string | null;
  finance_approval_notes: string | null;
  live_mrr_match: string | null;
  price_drift_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductLineSku {
  id: string;
  product_line_id: string;
  source_table: string;
  source_id: string;
  sku: string | null;
}

export interface ProductBundleComponent {
  id: string;
  product_line_id: string;
  component_role: BundleComponentRole;
  name: string;
  source: BundleComponentSource;
  helios_includes_cpe: boolean;
  default_monthly_excl: number | null;
  default_cost_excl: number | null;
  amortise_months: number | null;
  package_sku: string | null;
  sort_order: number;
}

export interface ProductLineWithRelations extends ProductLine {
  skus: ProductLineSku[];
  bundle_components: ProductBundleComponent[];
  live_mrr_zar?: number;
  billed_vs_list_drift?: string | null;
}

export interface LifecycleGateItem {
  label: string;
  ok: boolean;
  blocking: boolean;
  detail?: string;
}

export interface LifecycleGateResult {
  allowed: boolean;
  items: LifecycleGateItem[];
}

export const FINANCE_MARGIN_FLOOR_PCT = 25;
