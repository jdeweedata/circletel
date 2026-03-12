/**
 * MITS CPQ Types
 *
 * Type definitions for the Managed IT Services Configure, Price, Quote system.
 * Matches mits_tier_catalogue, mits_m365_pricing, and mits_module_catalogue tables.
 */

// ============================================================================
// WIZARD STEPS
// ============================================================================

export type MITSWizardStep =
  | 'tier_selection'
  | 'm365_config'
  | 'add_ons'
  | 'pricing'
  | 'customer'
  | 'review';

export const MITS_WIZARD_STEPS: MITSWizardStep[] = [
  'tier_selection',
  'm365_config',
  'add_ons',
  'pricing',
  'customer',
  'review',
];

export const MITS_STEP_LABELS: Record<MITSWizardStep, string> = {
  tier_selection: 'Choose Tier',
  m365_config: 'Microsoft 365',
  add_ons: 'Add-Ons',
  pricing: 'Pricing',
  customer: 'Customer Details',
  review: 'Review & Quote',
};

/**
 * Tier codes in order (ESSENTIAL → PROFESSIONAL → PREMIUM → ENTERPRISE)
 * Used for filtering modules by `available_from_tier` — all tiers at or above
 * the module's minimum tier should see it.
 */
export const TIER_ORDER: string[] = [
  'MITS_ESSENTIAL',
  'MITS_PROFESSIONAL',
  'MITS_PREMIUM',
  'MITS_ENTERPRISE',
];

// ============================================================================
// DATABASE TABLE TYPES
// ============================================================================

/** Matches mits_tier_catalogue table */
export interface MITSTier {
  id: string;
  tier_code: string;
  tier_name: string;
  description: string | null;
  target_users_min: number;
  target_users_max: number;
  retail_price: number;
  connectivity_speed_dl: number;
  connectivity_speed_ul: number;
  static_ip_included: number;
  lte_failover_included: boolean;
  skyfibre_product_code: string | null;
  m365_licence_type: string;
  m365_included_licences: number;
  m365_additional_rate: number;
  support_hours: string;
  sla_response_p1: number;
  sla_response_p2: number;
  sla_response_p3: number;
  sla_resolution_p1: number;
  onsite_included: string;
  onsite_visit_rate: number | null;
  firewall_included: boolean;
  endpoint_protection: boolean;
  backup_storage_gb: number;
  security_training: string | null;
  uptime_guarantee: number;
  service_credit_rate: number;
  estimated_direct_cost: number;
  target_margin_percent: number;
  is_active: boolean;
  sort_order: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

/** Matches mits_m365_pricing table */
export interface MITSM365Pricing {
  id: string;
  licence_type: string;
  licence_name: string;
  retail_price: number;
  csp_cost: number;
  features: Record<string, unknown>;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

/** Matches mits_module_catalogue table */
export interface MITSModule {
  id: string;
  module_code: string;
  module_name: string;
  description: string | null;
  retail_price: number;
  direct_cost: number;
  billing_type: 'monthly' | 'once_off' | 'per_user';
  available_from_tier: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

/** A module selected by the user in the add-ons step */
export interface MITSSelectedModule {
  module_code: string;
  module_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  billing_type: 'monthly' | 'once_off' | 'per_user';
}

/** Tier selection step data */
export interface MITSTierSelectionData {
  user_count: number;
  selected_tier_code: string | null;
  /** User overrode the recommended tier */
  tier_overridden?: boolean;
}

/** Microsoft 365 configuration step data */
export interface MITSM365ConfigData {
  /** Number of additional licences beyond what's included in the tier */
  additional_licences: number;
  /** Customer's existing or desired M365 domain */
  domain?: string;
  /** Whether the customer already has an M365 tenant */
  existing_tenant?: boolean;
}

/** Add-ons step data */
export interface MITSAddOnsData {
  selected_modules: MITSSelectedModule[];
}

/** Pricing step data */
export interface MITSPricingData {
  contract_term_months: number;
  /** Manual discount override (0–100) */
  discount_percent: number;
  /** Computed: base tier price */
  base_tier_price: number;
  /** Computed: cost of additional M365 licences */
  additional_m365_price: number;
  /** Computed: monthly recurring add-on total */
  add_ons_mrc: number;
  /** Computed: once-off add-on total */
  add_ons_nrc: number;
  /** Computed: contract-based discount % (applied on top of manual discount) */
  contract_discount_percent: number;
  /** Computed: total monthly recurring charge before discount */
  subtotal_mrc: number;
  /** Computed: discount amount in Rands */
  discount_amount: number;
  /** Computed: final monthly recurring charge */
  total_mrc: number;
  /** Computed: gross margin % */
  gross_margin_percent: number;
}

/** Customer details step data */
export interface MITSCustomerData {
  company_name: string;
  registration_number?: string;
  vat_number?: string;
  industry?: string;
  billing_address: string;
  city: string;
  province: string;
  postal_code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  /** Coverage/feasibility check confirmed */
  coverage_checked: boolean;
  notes?: string;
}

/** Review step data */
export interface MITSReviewData {
  terms_accepted: boolean;
  summary_generated?: boolean;
  pdf_preview_url?: string;
  final_notes?: string;
}

/**
 * Full wizard state — stored in JSONB step_data column.
 * All sections are optional until the user reaches that step.
 */
export interface MITSStepData {
  tier_selection?: MITSTierSelectionData;
  m365_config?: MITSM365ConfigData;
  add_ons?: MITSAddOnsData;
  pricing?: MITSPricingData;
  customer?: MITSCustomerData;
  review?: MITSReviewData;
}

// ============================================================================
// PRICING CALCULATION TYPES
// ============================================================================

export interface MITSPricingInput {
  tier: MITSTier;
  additional_licences: number;
  selected_modules: MITSSelectedModule[];
  contract_term_months: number;
  /** Manual discount entered by sales rep (0–100) */
  manual_discount_percent: number;
}

export interface MITSPricingResult {
  base_tier_price: number;
  additional_m365_price: number;
  add_ons_mrc: number;
  add_ons_nrc: number;
  contract_discount_percent: number;
  subtotal_mrc: number;
  discount_amount: number;
  total_mrc: number;
  gross_margin_percent: number;
  /** Total direct cost for margin calculation */
  total_direct_cost: number;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface MITSValidationResult {
  valid: boolean;
  errors: string[];
}
