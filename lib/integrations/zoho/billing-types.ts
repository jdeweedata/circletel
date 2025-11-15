/**
 * Zoho Billing API Types
 *
 * TypeScript interfaces for Zoho Billing Plans, Items, Subscriptions
 * Based on Zoho Billing API v1 documentation
 */

// ============================================================================
// Plans (Recurring Subscriptions)
// ============================================================================

export interface ZohoBillingPlan {
  plan_id: string;
  plan_code: string;
  name: string;
  description?: string;
  product_id?: string;

  // Pricing
  recurring_price: number;
  setup_fee?: number;
  setup_fee_account_id?: string;

  // Billing Cycle
  interval: number;
  interval_unit: 'days' | 'weeks' | 'months' | 'years';
  billing_cycles?: number; // 0 = forever, N = specific number
  trial_period?: number;
  trial_period_unit?: 'days' | 'weeks' | 'months';

  // Financial
  currency_code: string;
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  tax_exemption_id?: string;

  // Status & Lifecycle
  status: 'active' | 'inactive' | 'deleted';
  created_time?: string;
  updated_time?: string;

  // Custom Fields (CircleTel-specific)
  custom_fields?: {
    cf_service_type?: string;
    cf_product_category?: string;
    cf_market_segment?: string;
    cf_provider?: string;
    cf_download_speed_mbps?: number;
    cf_upload_speed_mbps?: number;
    cf_technology?: string;
    cf_data_limit?: string;
    cf_installation_sla_days?: number;
    cf_valid_from?: string;
    cf_valid_to?: string;
    cf_is_featured?: boolean;
    cf_promo_price?: number;
    reference_id?: string; // CircleTel service_packages.id
  };
}

export interface CreatePlanPayload {
  plan_code: string;
  name: string;
  description?: string;
  recurring_price: number;
  interval: number;
  interval_unit: 'days' | 'weeks' | 'months' | 'years';
  billing_cycles?: number;
  setup_fee?: number;
  currency_code?: string; // Default: ZAR
  tax_id?: string;
  status?: 'active' | 'inactive';
  custom_fields?: Record<string, any>;
}

export interface UpdatePlanPayload {
  name?: string;
  description?: string;
  recurring_price?: number;
  setup_fee?: number;
  status?: 'active' | 'inactive';
  custom_fields?: Record<string, any>;
}

// ============================================================================
// Items (One-Time Charges)
// ============================================================================

export interface ZohoBillingItem {
  item_id: string;
  item_name: string;
  sku?: string;
  description?: string;
  product_type?: string;

  // Pricing
  rate: number;
  unit?: string;

  // Tax
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  tax_exemption_id?: string;

  // Item Type
  item_type: 'goods' | 'service' | 'digital_service';

  // Accounting
  account_id?: string;
  account_name?: string;

  // Inventory (for goods)
  track_inventory?: boolean;
  initial_stock?: number;
  reorder_level?: number;

  // Status
  status: 'active' | 'inactive';
  created_time?: string;
  updated_time?: string;

  // Custom Fields
  custom_fields?: {
    cf_service_type?: string;
    cf_tax_inclusive?: boolean;
    reference_id?: string; // CircleTel service_packages.id
  };
}

export interface CreateItemPayload {
  item_name: string;
  sku?: string;
  description?: string;
  rate: number;
  item_type?: 'goods' | 'service' | 'digital_service';
  unit?: string;
  tax_id?: string;
  account_id?: string;
  status?: 'active' | 'inactive';
  custom_fields?: Record<string, any>;
}

export interface UpdateItemPayload {
  item_name?: string;
  description?: string;
  rate?: number;
  tax_id?: string;
  status?: 'active' | 'inactive';
  custom_fields?: Record<string, any>;
}

// ============================================================================
// Subscriptions
// ============================================================================

export interface ZohoBillingSubscription {
  subscription_id: string;
  subscription_number: string;
  customer_id: string;
  customer_name?: string;

  // Plan
  plan_id: string;
  plan_code: string;
  plan_name?: string;
  plan_description?: string;

  // Pricing
  amount: number;
  currency_code: string;

  // Billing Cycle
  interval: number;
  interval_unit: 'days' | 'weeks' | 'months' | 'years';

  // Dates
  starts_at?: string;
  trial_starts_at?: string;
  trial_ends_at?: string;
  activated_at?: string;
  expires_at?: string;
  cancelled_at?: string;

  // Status
  status: 'trial' | 'active' | 'non_renewing' | 'expired' | 'cancelled' | 'unpaid';

  // Add-ons (One-time items)
  addons?: Array<{
    addon_code: string;
    addon_name: string;
    addon_description?: string;
    quantity: number;
    price: number;
    type: 'recurring' | 'one_time';
  }>;

  // Metadata
  created_time?: string;
  updated_time?: string;
  custom_fields?: Record<string, any>;
}

export interface CreateSubscriptionPayload {
  customer_id: string;
  plan_id: string;
  starts_at?: string; // ISO 8601 date
  trial_days?: number;
  auto_collect?: boolean;
  payment_terms?: number;
  payment_terms_label?: string;

  // Add-ons (one-time items like installation, hardware)
  addons?: Array<{
    addon_code: string;
    quantity?: number;
    price?: number;
    type?: 'recurring' | 'one_time';
  }>;

  // Custom Fields
  custom_fields?: Record<string, any>;
}

// ============================================================================
// Invoices
// ============================================================================

export interface ZohoBillingInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  subscription_id?: string;

  // Amounts
  total: number;
  balance: number;
  currency_code: string;

  // Status
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'void' | 'overdue' | 'partially_paid';
  payment_made?: number;

  // Dates
  date: string;
  due_date: string;
  payment_expected_date?: string;

  // Line Items
  line_items?: Array<{
    item_id: string;
    item_name: string;
    description?: string;
    quantity: number;
    rate: number;
    amount: number;
    tax_id?: string;
    tax_name?: string;
    tax_percentage?: number;
  }>;

  // Metadata
  created_time?: string;
  updated_time?: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ZohoBillingApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

export interface ZohoBillingListResponse<T> {
  code: number;
  message: string;
  data?: {
    plans?: T[];
    items?: T[];
    subscriptions?: T[];
    invoices?: T[];
    page_context?: {
      page: number;
      per_page: number;
      has_more_page: boolean;
      total: number;
    };
  };
}

export interface ZohoBillingError {
  code: number;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

// ============================================================================
// Helper Types
// ============================================================================

export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export interface BillingCycleConfig {
  interval: number;
  interval_unit: 'days' | 'weeks' | 'months' | 'years';
}

export const BILLING_CYCLES: Record<BillingCycle, BillingCycleConfig> = {
  monthly: { interval: 1, interval_unit: 'months' },
  quarterly: { interval: 3, interval_unit: 'months' },
  semi_annual: { interval: 6, interval_unit: 'months' },
  annual: { interval: 12, interval_unit: 'months' },
};
