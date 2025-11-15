// TypeScript types for admin product catalogue (admin_products and related tables)
// These mirror the Supabase schema defined in 20251215000001_create_admin_product_catalogue.sql

export type AdminProductStatus = 'draft' | 'pending' | 'approved' | 'archived';
export type AdminProductCategory =
  | 'business_fibre'
  | 'fixed_wireless_business'
  | 'fixed_wireless_residential';

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  category: AdminProductCategory;
  service_type: string;
  description: string | null;
  long_description: string | null;
  speed_down: number;
  speed_up: number;
  is_symmetrical: boolean;
  contract_terms: number[];
  status: AdminProductStatus;
  version: number;
  is_current: boolean;
  sort_order: number;
  is_featured: boolean;
  created_by: string | null;
  updated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminProductPricingApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AdminProductPricing {
  id: string;
  product_id: string;
  price_regular: number;
  price_promo: number | null;
  installation_fee: number;
  hardware_contribution: number;
  router_rental: number;
  is_promotional: boolean;
  promo_start_date: string | null;
  promo_end_date: string | null;
  effective_from: string;
  effective_to: string | null;
  approval_status: AdminProductPricingApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProductFeature {
  id: string;
  product_id: string;
  feature_name: string;
  feature_value: string | null;
  feature_category: string;
  is_highlighted: boolean;
  sort_order: number;
  created_at: string;
}

export interface AdminProductHardware {
  id: string;
  product_id: string;
  hardware_model: string;
  hardware_type: string;
  specifications: Record<string, unknown> | null;
  retail_value: number | null;
  dealer_cost: number | null;
  is_included: boolean;
  created_at: string;
}

export interface AdminProductContext {
  product: AdminProduct;
  pricing: AdminProductPricing | null;
  features: AdminProductFeature[];
  hardware: AdminProductHardware[];
}
