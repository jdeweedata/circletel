// TypeScript types for MTN Dealer Products (Arlan Communications deals)
// These mirror the Supabase schema defined in 20251201000001_create_mtn_dealer_products.sql

export type MTNDealerTechnology = 'LTE' | '5G' | 'LTE/5G';
export type MTNDealerContractTerm = 0 | 12 | 24 | 36;
export type MTNDealerDeviceStatus = 'Available' | 'Out of Stock' | 'EOL' | 'CTB';
export type MTNDealerProductStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type MTNDealerMarkupType = 'percentage' | 'fixed';

export interface MTNDealerProduct {
  id: string;
  
  // Deal Identification
  deal_id: string;
  eppix_package: string | null;
  eppix_tariff: string | null;
  
  // Product Classification
  price_plan: string;
  package_description: string | null;
  tariff_description: string | null;
  
  // Technology
  technology: MTNDealerTechnology;
  
  // Contract Terms
  contract_term: MTNDealerContractTerm;
  contract_term_label: string; // Generated: "Month-to-Month", "12 Months", etc.
  
  // Device Information
  has_device: boolean;
  device_name: string | null;
  device_status: MTNDealerDeviceStatus | null;
  once_off_pay_in_incl_vat: number;
  
  // Pricing
  mtn_price_incl_vat: number;
  mtn_price_excl_vat: number;
  markup_type: MTNDealerMarkupType;
  markup_value: number;
  selling_price_excl_vat: number; // Generated
  selling_price_incl_vat: number; // Generated
  
  // Bundle Information
  data_bundle: string | null;
  data_bundle_gb: number | null;
  anytime_minutes: string | null;
  anytime_minutes_value: number | null;
  on_net_minutes: string | null;
  on_net_minutes_value: number | null;
  sms_bundle: string | null;
  sms_bundle_value: number | null;
  
  // Inclusive Benefits
  inclusive_minutes: string | null;
  inclusive_data: string | null;
  inclusive_sms: string | null;
  inclusive_in_group_calling: string | null;
  inclusive_on_net_minutes: string | null;
  
  // Freebies
  freebies_device: string | null;
  freebies_priceplan: string | null;
  free_sim: boolean;
  free_cli: boolean;
  free_itb: boolean;
  
  // Deal Period
  promo_start_date: string | null;
  promo_end_date: string | null;
  // Note: is_current_deal is computed at query time, not stored
  
  // Channel Availability
  channel: string;
  available_on_helios: boolean;
  available_on_ilula: boolean;
  
  // Commission (Generated based on Arlan contract)
  commission_tier: string; // Generated: "R0-R99.99", "R500-R999.99", etc.
  mtn_commission_rate: number; // Generated: 4.75%, 9.75%, etc.
  circletel_commission_share: number; // Default 30%
  
  // Status
  status: MTNDealerProductStatus;
  inventory_status: string;
  
  // Metadata
  metadata: Record<string, unknown>;
  import_batch_id: string | null;
  source_file: string | null;
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Commission calculation result
export interface MTNDealerCommissionCalculation {
  deal_id: string;
  price_plan: string;
  contract_term: number;
  monthly_subscription: number;
  total_contract_value: number;
  mtn_commission_rate: number;
  mtn_commission_to_arlan: number;
  circletel_share_rate: number;
  circletel_commission: number;
  circletel_commission_incl_vat: number;
  quantity: number;
  total_circletel_commission: number;
}

// View type for commission calculator
export interface MTNDealerCommissionView extends MTNDealerProduct {
  total_contract_value: number;
  mtn_commission_to_arlan: number;
  circletel_commission: number;
  circletel_commission_incl_vat: number;
  effective_commission_rate: number;
}

// Filter options for product listing
export interface MTNDealerProductFilters {
  technology?: MTNDealerTechnology;
  contract_term?: MTNDealerContractTerm;
  has_device?: boolean;
  status?: MTNDealerProductStatus;
  commission_tier?: string;
  min_price?: number;
  max_price?: number;
  is_current_deal?: boolean;
  search?: string;
  promo_start_date?: string;
  promo_end_date?: string;
  device_status?: MTNDealerDeviceStatus;
}

// Category summary for filtering UI
export interface MTNDealerProductCategory {
  technology: MTNDealerTechnology;
  contract_term: MTNDealerContractTerm;
  contract_term_label: string;
  has_device: boolean;
  device_category: string;
  commission_tier: string;
  product_count: number;
  min_price: number;
  max_price: number;
  avg_price: number;
}

// Deal period summary
export interface MTNDealerDealPeriod {
  promo_start_date: string;
  promo_end_date: string;
  deal_count: number;
  active_deals: number;
  deals_with_device: number;
  sim_only_deals: number;
  min_price: number;
  max_price: number;
}

// Import batch tracking
export interface MTNDealerImportBatch {
  id: string;
  batch_id: string;
  source_file: string;
  import_date: string;
  total_records: number;
  imported_records: number;
  skipped_records: number;
  error_records: number;
  errors: Record<string, unknown>[];
  imported_by: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completed_at: string | null;
}

// Form data for creating/updating products
export interface MTNDealerProductFormData {
  deal_id: string;
  eppix_package?: string;
  eppix_tariff?: string;
  price_plan: string;
  package_description?: string;
  tariff_description?: string;
  technology: MTNDealerTechnology;
  contract_term: MTNDealerContractTerm;
  has_device: boolean;
  device_name?: string;
  device_status?: MTNDealerDeviceStatus;
  once_off_pay_in_incl_vat?: number;
  mtn_price_incl_vat: number;
  mtn_price_excl_vat: number;
  markup_type?: MTNDealerMarkupType;
  markup_value?: number;
  data_bundle?: string;
  anytime_minutes?: string;
  on_net_minutes?: string;
  sms_bundle?: string;
  inclusive_minutes?: string;
  inclusive_data?: string;
  inclusive_sms?: string;
  freebies_device?: string;
  freebies_priceplan?: string;
  free_sim?: boolean;
  free_cli?: boolean;
  free_itb?: boolean;
  promo_start_date?: string;
  promo_end_date?: string;
  channel?: string;
  available_on_helios?: boolean;
  available_on_ilula?: boolean;
  circletel_commission_share?: number;
  status?: MTNDealerProductStatus;
  inventory_status?: string;
}

// Commission tier configuration (from Arlan contract)
export const MTN_COMMISSION_TIERS = [
  { tier: 'R0-R99.99', min: 0, max: 99.99, mtn_rate: 4.75, circletel_share: 30, effective_rate: 1.425 },
  { tier: 'R100-R199.99', min: 100, max: 199.99, mtn_rate: 5.75, circletel_share: 30, effective_rate: 1.725 },
  { tier: 'R200-R299.99', min: 200, max: 299.99, mtn_rate: 7.25, circletel_share: 30, effective_rate: 2.175 },
  { tier: 'R300-R499.99', min: 300, max: 499.99, mtn_rate: 8.75, circletel_share: 30, effective_rate: 2.625 },
  { tier: 'R500-R999.99', min: 500, max: 999.99, mtn_rate: 9.75, circletel_share: 30, effective_rate: 2.925 },
  { tier: 'R1000-R1999.99', min: 1000, max: 1999.99, mtn_rate: 11.75, circletel_share: 30, effective_rate: 3.525 },
  { tier: 'R2000+', min: 2000, max: Infinity, mtn_rate: 13.75, circletel_share: 30, effective_rate: 4.125 },
] as const;

// Helper function to get commission tier for a price
export function getCommissionTier(priceInclVat: number) {
  return MTN_COMMISSION_TIERS.find(
    tier => priceInclVat >= tier.min && priceInclVat <= tier.max
  ) || MTN_COMMISSION_TIERS[MTN_COMMISSION_TIERS.length - 1];
}

// Helper function to calculate commission
export function calculateCommission(
  priceInclVat: number,
  contractTerm: number,
  quantity: number = 1,
  circletelShare: number = 30
) {
  const tier = getCommissionTier(priceInclVat);
  const totalContractValue = priceInclVat * contractTerm;
  const mtnCommission = totalContractValue * (tier.mtn_rate / 100);
  const circletelCommission = mtnCommission * (circletelShare / 100);
  
  return {
    tier: tier.tier,
    mtn_rate: tier.mtn_rate,
    circletel_share: circletelShare,
    effective_rate: tier.mtn_rate * (circletelShare / 100),
    total_contract_value: totalContractValue,
    mtn_commission: mtnCommission,
    circletel_commission: circletelCommission,
    circletel_commission_incl_vat: circletelCommission * 1.15,
    quantity,
    total_circletel_commission: circletelCommission * quantity,
  };
}

// Contract term options for UI
export const CONTRACT_TERM_OPTIONS = [
  { value: 0, label: 'Month-to-Month' },
  { value: 12, label: '12 Months' },
  { value: 24, label: '24 Months' },
  { value: 36, label: '36 Months' },
] as const;

// Technology options for UI
export const TECHNOLOGY_OPTIONS = [
  { value: 'LTE', label: 'LTE' },
  { value: '5G', label: '5G' },
  { value: 'LTE/5G', label: 'LTE/5G' },
] as const;

// Device status options for UI
export const DEVICE_STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'Out of Stock', label: 'Out of Stock' },
  { value: 'EOL', label: 'End of Life' },
  { value: 'CTB', label: 'CTB' },
] as const;

// Product status options for UI
export const PRODUCT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
] as const;
