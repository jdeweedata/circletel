/**
 * CPQ (Configure, Price, Quote) System Types
 *
 * Type definitions for the AI-powered quote configuration system
 * with role-based pricing controls.
 */

// ============================================================================
// Role & Permission Types
// ============================================================================

export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type AdminRole = 'sales_rep' | 'sales_manager' | 'director' | 'super_admin';

export type RoleType = 'partner' | 'admin';

export type CustomerType = 'residential' | 'business' | 'enterprise';

export type CoverageType = 'fibre' | '5g' | 'lte' | 'microwave' | 'tarana' | 'dfa';

// ============================================================================
// Discount Limits
// ============================================================================

export interface CPQDiscountLimit {
  id: string;
  role_type: RoleType;
  role_name: PartnerTier | AdminRole;
  max_discount_percent: number;
  approval_threshold_percent: number;
  can_approve_discounts: boolean;
  max_approvable_discount: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscountLimitsResult {
  maxDiscount: number;
  approvalThreshold: number;
  canApproveDiscounts: boolean;
  maxApprovableDiscount: number;
}

// ============================================================================
// Pricing Rules
// ============================================================================

export type PricingRuleType = 'discount' | 'markup' | 'bundle' | 'volume';

export type AdjustmentType = 'percentage' | 'fixed_amount';

export interface PricingRuleConditions {
  min_sites?: number;
  max_sites?: number;
  min_contract_term?: number;
  max_contract_term?: number;
  coverage_types?: CoverageType[];
  customer_type?: CustomerType;
  requires_services?: string[];
  min_monthly_value?: number;
  max_monthly_value?: number;
}

export interface CPQPricingRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: PricingRuleType;
  conditions: PricingRuleConditions;
  adjustment_type: AdjustmentType;
  adjustment_value: number;
  applies_to_product_ids: string[] | null;
  applies_to_partner_tiers: PartnerTier[] | null;
  applies_to_customer_types: CustomerType[] | null;
  can_stack: boolean;
  stack_priority: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicableRule {
  rule: CPQPricingRule;
  adjustmentAmount: number;
  reason: string;
}

// ============================================================================
// Product Eligibility
// ============================================================================

export interface CPQProductEligibility {
  id: string;
  product_id: string;
  coverage_types: CoverageType[];
  partner_tiers: PartnerTier[] | null;
  customer_types: CustomerType[];
  allowed_regions: string[] | null;
  excluded_regions: string[] | null;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EligibilityCheckResult {
  eligible: boolean;
  reasons: string[];
  restrictions?: {
    minQuantity?: number;
    maxQuantity?: number;
    allowedRegions?: string[];
  };
}

// ============================================================================
// CPQ Session & Wizard
// ============================================================================

export type CPQSessionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'converted'
  | 'abandoned'
  | 'expired';

export type CPQWizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const CPQ_WIZARD_STEPS = {
  NEEDS_ASSESSMENT: 1,
  LOCATION_COVERAGE: 2,
  PACKAGE_SELECTION: 3,
  CONFIGURE_CUSTOMIZE: 4,
  PRICING_DISCOUNTS: 5,
  CUSTOMER_DETAILS: 6,
  REVIEW_SUBMIT: 7,
} as const;

export interface NeedsAssessmentData {
  bandwidth_required?: number;
  contention?: 'best-effort' | '10:1' | '5:1' | '2:1' | 'dia';
  sla_level?: 'standard' | 'premium' | 'carrier_grade';
  failover_required?: boolean;
  contract_term?: number;
  budget_range?: { min: number; max: number };
  industry?: string;
  special_requirements?: string;
  ai_parsed_request?: string;
}

export interface LocationData {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  coverage_status: 'pending' | 'checking' | 'complete' | 'failed';
  coverage_results?: Record<string, unknown>;
  coverage_lead_id?: string;
}

export interface SelectedPackage {
  site_id: string;
  product_id: string;
  product_name: string;
  monthly_price: number;
  setup_fee: number;
  quantity: number;
  configuration?: Record<string, unknown>;
}

export interface ConfigurationData {
  add_ons: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  customizations: Record<string, unknown>;
}

export interface PricingData {
  subtotal: number;
  automatic_discounts: ApplicableRule[];
  manual_discount_percent: number;
  manual_discount_amount: number;
  total_discount_percent: number;
  total_discount_amount: number;
  final_monthly: number;
  final_setup: number;
  requires_approval: boolean;
  approval_requested?: boolean;
}

export interface CustomerDetailsData {
  company_name: string;
  trading_name?: string;
  registration_number?: string;
  vat_number?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  billing_address?: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  };
}

export interface ReviewData {
  terms_accepted: boolean;
  signature?: string;
  notes?: string;
}

export interface CPQStepData {
  needs_assessment: NeedsAssessmentData | null;
  locations: LocationData[];
  selected_packages: SelectedPackage[];
  configuration: ConfigurationData;
  pricing: PricingData;
  customer_details: CustomerDetailsData;
  review: ReviewData;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIRecommendation {
  product_id: string;
  product_name: string;
  confidence: number;
  reason: string;
  monthly_price: number;
  features: string[];
}

export interface CPQSession {
  id: string;
  owner_type: RoleType;
  owner_id: string;
  current_step: CPQWizardStep;
  status: CPQSessionStatus;
  step_data: CPQStepData;
  ai_chat_history: AIMessage[];
  ai_recommendations: AIRecommendation[];
  total_discount_percent: number;
  discount_approved: boolean;
  discount_approved_by: string | null;
  discount_approved_at: string | null;
  converted_quote_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// ============================================================================
// Approval Requests
// ============================================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface CPQApprovalRequest {
  id: string;
  session_id: string;
  requested_discount_percent: number;
  justification: string | null;
  requester_type: RoleType;
  requester_id: string;
  assigned_approver_id: string | null;
  status: ApprovalStatus;
  response_notes: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApprovalRequest {
  session_id: string;
  requested_discount_percent: number;
  justification?: string;
}

export interface ApprovalResponse {
  approved: boolean;
  notes?: string;
}

// ============================================================================
// Analytics
// ============================================================================

export interface CPQAnalyticsEntry {
  id: string;
  session_id: string;
  step_entered: number;
  step_completed: boolean;
  time_on_step_seconds: number | null;
  ai_interactions: number;
  ai_recommendations_shown: number;
  ai_recommendations_accepted: number;
  final_quote_value: number | null;
  final_discount_percent: number | null;
  approval_required: boolean;
  created_at: string;
}

export interface CPQAnalyticsSummary {
  total_sessions: number;
  completed_sessions: number;
  conversion_rate: number;
  avg_discount_percent: number;
  avg_time_to_complete_seconds: number;
  ai_adoption_rate: number;
  approval_rate: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Session Management
export interface CreateSessionRequest {
  owner_type: RoleType;
  owner_id: string;
}

export interface UpdateSessionRequest {
  current_step?: CPQWizardStep;
  status?: CPQSessionStatus;
  step_data?: Partial<CPQStepData>;
  ai_chat_history?: AIMessage[];
  ai_recommendations?: AIRecommendation[];
  total_discount_percent?: number;
}

// Rule Engine
export interface GetDiscountLimitsRequest {
  role_type: RoleType;
  role_name: PartnerTier | AdminRole;
}

export interface CheckEligibilityRequest {
  product_id: string;
  coverage_type: CoverageType;
  customer_type: CustomerType;
  partner_tier?: PartnerTier;
  region?: string;
  quantity?: number;
}

export interface ValidatePricingRequest {
  discount_percent: number;
  role_type: RoleType;
  role_name: PartnerTier | AdminRole;
  product_ids?: string[];
}

export interface ValidatePricingResult {
  valid: boolean;
  requires_approval: boolean;
  max_allowed_discount: number;
  approval_threshold: number;
  reasons: string[];
}

// AI Services
export interface ParseNaturalLanguageRequest {
  text: string;
  context?: {
    customer_type?: CustomerType;
    existing_services?: string[];
  };
}

export interface ParseNaturalLanguageResult {
  needs_assessment: NeedsAssessmentData;
  confidence: number;
  clarification_needed?: string[];
}

export interface GetRecommendationsRequest {
  needs_assessment: NeedsAssessmentData;
  locations: LocationData[];
  budget?: { min: number; max: number };
  customer_type: CustomerType;
}

export interface GetRecommendationsResult {
  recommendations: AIRecommendation[];
  rationale: string;
}

export interface AnalyzePricingRequest {
  selected_packages: SelectedPackage[];
  customer_details: CustomerDetailsData;
  current_discount: number;
  role_type: RoleType;
  role_name: PartnerTier | AdminRole;
}

export interface AnalyzePricingResult {
  optimal_discount: number;
  upsell_opportunities: Array<{
    product_id: string;
    product_name: string;
    additional_monthly: number;
    value_proposition: string;
  }>;
  margin_analysis: {
    current_margin: number;
    with_optimal_discount: number;
    industry_benchmark: number;
  };
  close_probability: number;
  suggestions: string[];
}

// ============================================================================
// Helper Types
// ============================================================================

export interface CPQError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CPQResponse<T> {
  success: boolean;
  data?: T;
  error?: CPQError;
}
