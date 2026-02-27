/**
 * CPQ System Types
 *
 * Type definitions for the Configure, Price, Quote system
 * Updated to match existing database schema
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type CPQSessionStatus =
  | 'draft'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'converted'
  | 'expired'
  | 'cancelled';

export type OwnerType = 'admin' | 'partner';
export type UserType = OwnerType; // Alias for compatibility

export type RoleType = 'admin' | 'partner';

export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type AdminRole =
  | 'super_admin'
  | 'director'
  | 'sales_manager'
  | 'sales_rep'
  | 'service_delivery_manager'
  | 'product_manager'
  | 'editor'
  | 'viewer'
  | 'service_delivery_administrator';

// Database uses these rule types
export type PricingRuleType =
  | 'volume'
  | 'discount'
  | 'bundle'
  | 'promotional'
  | 'commission'
  | 'margin';

// Database uses these adjustment types
export type AdjustmentType =
  | 'percentage'
  | 'fixed'
  | 'override';

// Legacy aliases
export type ActionType = AdjustmentType;

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type CustomerType = 'business' | 'residential' | 'enterprise';

export type ContentionLevel = 'best-effort' | '10:1' | '5:1' | '2:1' | 'dia';

export type SLALevel = 'standard' | 'premium' | 'carrier_grade';

// ============================================================================
// WIZARD STEP DATA
// ============================================================================

export interface NeedsAssessmentData {
  // Natural language input
  raw_input?: string;

  // Parsed requirements
  bandwidth_mbps?: number;
  budget_min?: number;
  budget_max?: number;
  contention?: ContentionLevel;
  sla_level?: SLALevel;
  failover_needed?: boolean;
  failover_bandwidth_mbps?: number;

  // Additional needs
  num_sites?: number;
  region?: string;
  industry?: string;
  use_case?: string;

  // AI metadata
  ai_parsed?: boolean;
  ai_confidence?: number;
}

export interface LocationSite {
  index: number;
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  coverage_checked?: boolean;
  coverage_result?: CoverageCheckResult;
}

export interface CoverageCheckResult {
  is_feasible: boolean;
  technologies: Array<{
    type: string;
    provider: string;
    available: boolean;
    speed_range?: { min: number; max: number };
  }>;
  recommended_technology?: string;
  checked_at: string;
}

export interface LocationCoverageData {
  sites: LocationSite[];
  all_sites_checked: boolean;
}

export interface SelectedPackage {
  package_id: string;
  package_name: string;
  site_index: number;
  base_price: number;
  quantity: number;
  contract_term_months: number;

  // AI recommendation info
  ai_recommended?: boolean;
  ai_confidence?: number;
  ai_reasoning?: string;
}

export interface PackageSelectionData {
  selected_packages: SelectedPackage[];
  ai_recommendations_shown: boolean;
}

export interface AddOn {
  add_on_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ConfigurationData {
  per_site_config: Array<{
    site_index: number;
    add_ons: AddOn[];
    custom_options: Record<string, unknown>;
  }>;
}

export interface DiscountApplication {
  package_id: string;
  site_index: number;
  discount_percent: number;
  discount_amount: number;
  applied_rules: string[];
  requires_approval: boolean;
}

export interface PricingDiscountsData {
  discounts: DiscountApplication[];
  total_discount_percent: number;
  total_discount_amount: number;
  subtotal: number;
  total: number;
  approval_requested?: boolean;
  approval_status?: ApprovalStatus;
  aiAnalysis?: AnalyzePricingResult;
}

export interface CustomerContact {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface CustomerDetailsData {
  company_name: string;
  registration_number?: string;
  vat_number?: string;
  industry?: string;
  billing_address?: string;
  primary_contact: CustomerContact;
  secondary_contact?: CustomerContact;
  notes?: string;
}

export interface ReviewSummaryData {
  summary_generated: boolean;
  pdf_preview_url?: string;
  final_review_notes?: string;
}

// ============================================================================
// AI TYPES
// ============================================================================

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIRecommendation {
  package_id: string;
  product_name: string;
  confidence: number; // 0-100
  rank: number; // 1, 2, 3
  reasoning: string;
  monthly_price: number;
  features: string[];
  match_scores: {
    bandwidth: number;
    budget: number;
    coverage: number;
    sla: number;
  };
}

export interface ParseNaturalLanguageResult {
  success: boolean;
  data?: NeedsAssessmentData;
  confidence?: number;
  tokens?: { input: number; output: number };
  response_time_ms?: number;
  error?: string;
}

export interface GetRecommendationsResult {
  success: boolean;
  recommendations?: AIRecommendation[];
  tokens?: { input: number; output: number };
  response_time_ms?: number;
  error?: string;
}

export interface UpsellOpportunity {
  product_id: string;
  product_name: string;
  additional_monthly: number;
  value_proposition: string;
}

export interface MarginAnalysis {
  current_margin: number;
  with_optimal_discount: number;
  industry_benchmark: number;
}

export interface AnalyzePricingResult {
  success: boolean;
  optimal_discount?: number; // AI-suggested discount %
  upsell_opportunities?: UpsellOpportunity[];
  margin_analysis?: MarginAnalysis;
  close_probability?: number; // 0-100
  suggestions?: string[];
  tokens?: { input: number; output: number };
  response_time_ms?: number;
  error?: string;
}

// ============================================================================
// SESSION & ITEMS (matches existing database schema)
// ============================================================================

/**
 * Step data stored in cpq_sessions.step_data JSONB column
 */
export interface CPQStepData {
  needs_assessment?: NeedsAssessmentData;
  location_coverage?: LocationCoverageData;
  package_selection?: PackageSelectionData;
  configuration?: ConfigurationData;
  pricing_discounts?: PricingDiscountsData;
  customer_details?: CustomerDetailsData;
  review_summary?: ReviewSummaryData;
}

export interface CPQSession {
  id: string;
  owner_type: OwnerType;
  owner_id: string;
  current_step: number;
  status: CPQSessionStatus;
  step_data: CPQStepData;
  ai_chat_history: AIMessage[];
  ai_recommendations: AIRecommendation[];
  total_discount_percent: number;
  discount_approved: boolean;
  discount_approved_by?: string;
  discount_approved_at?: string;
  converted_quote_id?: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;

  // Computed/derived fields for API responses
  user_type?: UserType; // Alias for owner_type
}

export interface CPQSessionItem {
  id: string;
  session_id: string;
  package_id: string;
  site_index: number;
  site_address?: string;
  site_coordinates?: { lat: number; lng: number };

  base_price: number;
  quantity: number;
  discount_percent: number;
  discount_amount: number;
  final_price: number;

  contract_term_months: number;
  add_ons: AddOn[];
  configuration: Record<string, unknown>;

  ai_recommended: boolean;
  ai_confidence?: number;
  ai_reasoning?: string;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// PRICING RULES (matches existing database schema)
// ============================================================================

export interface RuleConditions {
  // Volume conditions
  min_sites?: number;
  min_quantity?: number;
  max_quantity?: number;

  // Contract conditions
  min_contract_term?: number;
  max_contract_term?: number;

  // Bundle conditions
  requires_services?: string[];
  bundle_products?: string[];
  bundle_categories?: string[];

  // Customer conditions
  customer_type?: CustomerType;
  customer_types?: CustomerType[];

  // Partner conditions
  partner_tiers?: PartnerTier[];
}

export interface PricingRule {
  id: string;
  name: string; // Database uses 'name' not 'rule_name'
  description?: string;
  rule_type: PricingRuleType;
  conditions: RuleConditions;
  adjustment_type: AdjustmentType; // Database uses 'adjustment_type'
  adjustment_value: number; // Database uses 'adjustment_value' (negative for discounts)
  applies_to_product_ids?: string[];
  applies_to_partner_tiers?: PartnerTier[];
  applies_to_customer_types?: CustomerType[];
  can_stack: boolean; // Database uses 'can_stack'
  stack_priority: number; // Database uses 'stack_priority'
  valid_from?: string;
  valid_until?: string;
  is_active: boolean; // Database uses 'is_active'
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Aliases for backward compatibility
  rule_name?: string;
  action_type?: AdjustmentType;
  action_value?: number;
  stackable?: boolean;
  priority?: number;
  active?: boolean;
}

// ============================================================================
// DISCOUNT LIMITS (matches existing database schema)
// ============================================================================

export interface CategoryLimits {
  [category: string]: number; // category -> max discount percent
}

export interface DiscountLimit {
  id: string;
  role_type: RoleType;
  role_name: string;
  max_discount_percent: number;
  approval_threshold_percent: number;
  can_approve_discounts: boolean;
  max_approvable_discount: number;
  description?: string;
  is_active: boolean; // Database uses 'is_active'
  created_at: string;
  updated_at: string;

  // Backward compatibility aliases
  active?: boolean;
  category_limits?: CategoryLimits;
  requires_approval_from?: string[];
}

export interface DiscountLimitsResult {
  max_discount: number;
  approval_threshold: number;
  can_approve_discounts: boolean;
  max_approvable_discount: number;
  category_limits?: CategoryLimits;
  approvers: string[];
}

// ============================================================================
// APPROVALS
// ============================================================================

export interface CPQApproval {
  id: string;
  session_id: string;

  requested_discount_percent: number;
  approved_discount_percent?: number;
  justification?: string;

  requested_by_type: UserType;
  requested_by_admin_id?: string;
  requested_by_partner_id?: string;
  requested_at: string;

  status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;

  expires_at?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// RULE APPLICATIONS (AUDIT)
// ============================================================================

export interface RuleApplication {
  id: string;
  session_id: string;
  session_item_id?: string;
  rule_id: string;

  original_price: number;
  applied_value: number;
  resulting_price: number;

  applied_at: string;
  applied_by_type?: 'system' | 'admin' | 'partner';
  applied_by_id?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSessionRequest {
  user_type: UserType;
  admin_user_id?: string;
  partner_id?: string;
  initial_data?: Partial<NeedsAssessmentData>;
}

export interface CreateSessionResponse {
  success: boolean;
  session?: CPQSession;
  error?: string;
}

export interface UpdateSessionRequest {
  current_step?: number;
  completed_steps?: number[];
  needs_assessment?: Partial<NeedsAssessmentData>;
  location_coverage?: Partial<LocationCoverageData>;
  package_selection?: Partial<PackageSelectionData>;
  configuration?: Partial<ConfigurationData>;
  pricing_discounts?: Partial<PricingDiscountsData>;
  customer_details?: Partial<CustomerDetailsData>;
  review_summary?: Partial<ReviewSummaryData>;
  ai_chat_history?: AIMessage[];
  ai_recommendations?: AIRecommendation[];
}

export interface CheckEligibilityRequest {
  package_id: string;
  user_type: UserType;
  role_name: string;
  contract_term_months?: number;
  quantity?: number;
}

export interface CheckEligibilityResponse {
  eligible: boolean;
  reasons?: string[];
  applicable_rules?: PricingRule[];
  estimated_discount?: number;
}

export interface ValidatePricingRequest {
  session_id: string;
  discounts: Array<{
    package_id: string;
    site_index: number;
    discount_percent: number;
  }>;
  user_type: UserType;
  role_name: string;
}

export interface ValidatePricingResponse {
  valid: boolean;
  requires_approval: boolean;
  approval_required_for?: Array<{
    package_id: string;
    site_index: number;
    discount_percent: number;
    max_allowed: number;
  }>;
  errors?: string[];
}

// ============================================================================
// SERVICE PACKAGE (Reference type from existing system)
// ============================================================================

export interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description?: string;
  features?: string[];
  active: boolean;
  sort_order?: number;
  product_category?: string;
  customer_type?: CustomerType;
  network_provider_id?: string;
  requires_fttb_coverage?: boolean;
  compatible_providers?: string[];
  provider_specific_config?: Record<string, unknown>;
  provider_priority?: number;
  pricing?: Record<string, unknown>;
  slug?: string;
  sku?: string;
  metadata?: Record<string, unknown>;
  is_featured?: boolean;
  is_popular?: boolean;
  status?: string;
  bundle_components?: Record<string, unknown>;
  base_price_zar?: number;
}
