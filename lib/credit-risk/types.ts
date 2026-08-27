export const CREDIT_DECISIONS = [
  'UNCHECKED',
  'HARD_FAIL',
  'FAIL',
  'MARGINAL',
  'PASS',
] as const;

export type CreditDecision = (typeof CREDIT_DECISIONS)[number];

export const PACKAGE_EXPOSURES = ['low', 'medium', 'high'] as const;
export type PackageExposure = (typeof PACKAGE_EXPOSURES)[number];

export interface CreditFlags {
  debt_review?: boolean;
  debt_review_date?: string | null;
  sequestration?: boolean;
  admin_order?: boolean;
  judgements?: boolean;
  defaults?: boolean;
  score?: number | null;
  no_score?: boolean;
  avs_acc_exists?: boolean | null;
  avs_id_match?: boolean | null;
}

export interface OrderCreditReview {
  id?: string;
  consumer_order_id: string;
  decision: CreditDecision;
  bureau?: string | null;
  report_id?: string | null;
  transaction_id?: string | null;
  purpose?: string | null;
  requested_at?: string | null;
  flags: CreditFlags;
  financed_router_allowed: boolean;
  term_24_month_allowed: boolean;
  hardware_prepaid: boolean;
  alternatives: string[];
  private_note?: string | null;
  pdf_storage_path?: string | null;
  override_reason?: string | null;
  override_by?: string | null;
  override_signoffs?: { role: 'md' | 'cfo'; adminId: string }[] | null;
  reviewed_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteCreditReview extends Omit<OrderCreditReview, 'consumer_order_id'> {
  business_quote_id: string;
}

export interface CreditReviewInput {
  consumer_order_id?: string;
  business_quote_id?: string;
  bureau?: string | null;
  report_id?: string | null;
  transaction_id?: string | null;
  purpose?: string | null;
  requested_at?: string | null;
  flags?: CreditFlags;
  decision?: CreditDecision;
  hardware_prepaid?: boolean;
  private_note?: string | null;
  pdf_storage_path?: string | null;
  override_reason?: string | null;
  override_by?: string | null;
  override_signoffs?: { role: 'md' | 'cfo'; adminId: string }[] | null;
  reviewed_by?: string | null;
  updated_by?: string | null;
  package_price?: number;
  router_included?: boolean;
}
