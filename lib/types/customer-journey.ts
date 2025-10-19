/**
 * Type definitions for Customer Journey System
 * Covers B2C Consumer and B2B SMME flows
 */

// =============================================================================
// ENUMS
// =============================================================================

export type CustomerType = 'consumer' | 'smme' | 'enterprise';

export type LeadSource =
  | 'coverage_checker'
  | 'business_inquiry'
  | 'website_form'
  | 'referral'
  | 'marketing_campaign'
  | 'social_media'
  | 'direct_sales'
  | 'other';

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'payment_received'
  | 'kyc_pending'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'credit_check_pending'
  | 'credit_check_approved'
  | 'credit_check_rejected'
  | 'installation_scheduled'
  | 'installation_in_progress'
  | 'installation_completed'
  | 'active'
  | 'on_hold'
  | 'cancelled'
  | 'failed';

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted_to_order';

export type KycDocumentType =
  | 'id_document'
  | 'proof_of_address'
  | 'bank_statement'
  | 'company_registration'
  | 'tax_certificate'
  | 'vat_certificate'
  | 'director_id'
  | 'shareholder_agreement'
  | 'other';

export type KycVerificationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'requires_update';

export type CoverageLeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'not_interested'
  | 'coverage_available'
  | 'converted_to_order'
  | 'lost'
  | 'follow_up_scheduled';

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'failed' | 'refunded';

export type PaymentMethod = 'eft' | 'card' | 'debit_order' | 'cash';

export type ContactPreference = 'email' | 'phone' | 'whatsapp' | 'sms';

export type NotificationMethod = 'email' | 'sms' | 'whatsapp' | 'push';

// =============================================================================
// COVERAGE LEADS
// =============================================================================

export interface CoverageLead {
  id: string;

  // Customer Information
  customer_type: CustomerType;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string | null;

  // Address Information
  address: string;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;

  // Lead Tracking
  lead_source: LeadSource;
  source_campaign?: string | null;
  referral_code?: string | null;

  // Coverage Check Details
  coverage_check_id?: string | null;
  requested_service_type?: string | null;
  requested_speed?: string | null;
  budget_range?: string | null;

  // CRM Integration
  zoho_lead_id?: string | null;
  zoho_synced_at?: string | null;
  zoho_sync_status?: string | null;
  zoho_sync_error?: string | null;

  // Follow-up Tracking
  contact_preference?: ContactPreference;
  best_contact_time?: string | null;
  follow_up_notes?: string | null;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  follow_up_count?: number;

  // Status
  status: CoverageLeadStatus;
  converted_to_order_id?: string | null;

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateCoverageLeadInput {
  customer_type: CustomerType;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string;
  address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  coordinates?: { lat: number; lng: number };
  lead_source: LeadSource;
  source_campaign?: string;
  referral_code?: string;
  coverage_check_id?: string;
  requested_service_type?: string;
  requested_speed?: string;
  budget_range?: string;
  contact_preference?: ContactPreference;
  best_contact_time?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// CONSUMER ORDERS
// =============================================================================

export interface ConsumerOrder {
  id: string;
  order_number: string;

  // Customer Information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone?: string | null;

  // Installation Address
  installation_address: string;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  special_instructions?: string | null;

  // Billing Address
  billing_same_as_installation: boolean;
  billing_address?: string | null;
  billing_suburb?: string | null;
  billing_city?: string | null;
  billing_province?: string | null;
  billing_postal_code?: string | null;

  // Product Selection
  service_package_id?: string | null;
  package_name: string;
  package_speed: string;
  package_price: number;
  installation_fee: number;
  router_included: boolean;
  router_rental_fee?: number | null;

  // Coverage Details
  coverage_check_id?: string | null;
  coverage_lead_id?: string | null;

  // Payment Information
  payment_method?: PaymentMethod | null;
  payment_status: PaymentStatus;
  payment_reference?: string | null;
  payment_date?: string | null;
  total_paid: number;

  // Order Status
  status: OrderStatus;

  // Installation Details
  preferred_installation_date?: string | null;
  installation_scheduled_date?: string | null;
  installation_time_slot?: string | null;
  installation_completed_date?: string | null;
  technician_notes?: string | null;

  // Activation Details
  activation_date?: string | null;
  account_number?: string | null;
  connection_id?: string | null;

  // Communication Preferences
  contact_preference: ContactPreference;
  marketing_opt_in: boolean;
  whatsapp_opt_in: boolean;

  // Order Source
  lead_source: LeadSource;
  source_campaign?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;

  // Metadata
  metadata?: Record<string, any>;
  internal_notes?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateConsumerOrderInput {
  // Customer Information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;

  // Installation Address
  installation_address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  coordinates?: { lat: number; lng: number };
  special_instructions?: string;

  // Billing Address
  billing_same_as_installation?: boolean;
  billing_address?: string;
  billing_suburb?: string;
  billing_city?: string;
  billing_province?: string;
  billing_postal_code?: string;

  // Product Selection
  service_package_id: string;
  package_name: string;
  package_speed: string;
  package_price: number;
  installation_fee: number;
  router_included?: boolean;
  router_rental_fee?: number;

  // Coverage Details
  coverage_check_id?: string;
  coverage_lead_id?: string;

  // Installation Details
  preferred_installation_date?: string;

  // Communication Preferences
  contact_preference?: ContactPreference;
  marketing_opt_in?: boolean;
  whatsapp_opt_in?: boolean;

  // Order Source
  lead_source?: LeadSource;
  source_campaign?: string;
  referral_code?: string;
  referred_by?: string;

  // Metadata
  metadata?: Record<string, any>;
}

// =============================================================================
// BUSINESS QUOTES
// =============================================================================

export interface BusinessQuote {
  id: string;
  quote_number: string;

  // Company Information
  company_name: string;
  company_registration_number?: string | null;
  vat_number?: string | null;
  industry?: string | null;
  company_size?: string | null;

  // Contact Person
  contact_first_name: string;
  contact_last_name: string;
  contact_title?: string | null;
  contact_email: string;
  contact_phone: string;
  contact_alternate_phone?: string | null;

  // Business Address
  business_address: string;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;

  // Service Requirements
  service_package_id?: string | null;
  package_name: string;
  package_speed: string;
  number_of_connections: number;
  additional_services?: string[] | null;

  // Pricing
  monthly_recurring: number;
  installation_fee: number;
  router_cost?: number | null;
  additional_costs?: Array<{
    item: string;
    amount: number;
  }>;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
  vat_amount: number;
  total_amount: number;

  // Quote Details
  status: QuoteStatus;
  valid_until: string;
  terms_and_conditions?: string | null;
  payment_terms: string;
  contract_duration: number;

  // Coverage Details
  coverage_check_id?: string | null;
  coverage_lead_id?: string | null;

  // Sales Tracking
  sales_rep_id?: string | null;
  sales_rep_name?: string | null;
  lead_source: LeadSource;
  source_campaign?: string | null;

  // Quote Interaction
  sent_at?: string | null;
  viewed_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;

  // Conversion
  converted_to_order: boolean;
  converted_to_order_id?: string | null;
  conversion_date?: string | null;

  // CRM Integration
  zoho_quote_id?: string | null;
  zoho_synced_at?: string | null;

  // Metadata
  metadata?: Record<string, any>;
  internal_notes?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessQuoteInput {
  // Company Information
  company_name: string;
  company_registration_number?: string;
  vat_number?: string;
  industry?: string;
  company_size?: string;

  // Contact Person
  contact_first_name: string;
  contact_last_name: string;
  contact_title?: string;
  contact_email: string;
  contact_phone: string;
  contact_alternate_phone?: string;

  // Business Address
  business_address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  coordinates?: { lat: number; lng: number };

  // Service Requirements
  service_package_id: string;
  package_name: string;
  package_speed: string;
  number_of_connections?: number;
  additional_services?: string[];

  // Pricing
  monthly_recurring: number;
  installation_fee: number;
  router_cost?: number;
  additional_costs?: Array<{ item: string; amount: number }>;
  discount_percent?: number;
  discount_amount?: number;

  // Quote Details
  valid_until: string;
  terms_and_conditions?: string;
  payment_terms?: string;
  contract_duration?: number;

  // Coverage Details
  coverage_check_id?: string;
  coverage_lead_id?: string;

  // Sales Tracking
  sales_rep_id?: string;
  sales_rep_name?: string;
  lead_source?: LeadSource;
  source_campaign?: string;

  // Metadata
  metadata?: Record<string, any>;
  internal_notes?: string;
}

// =============================================================================
// KYC DOCUMENTS
// =============================================================================

export interface KycDocument {
  id: string;

  // Document Owner
  customer_type: CustomerType;
  consumer_order_id?: string | null;
  business_quote_id?: string | null;

  // Customer Information
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  company_name?: string | null;

  // Document Details
  document_type: KycDocumentType;
  document_title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;

  // Verification
  verification_status: KycVerificationStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
  rejection_reason?: string | null;

  // Security
  is_sensitive: boolean;
  encrypted: boolean;
  access_log?: Array<{
    user_id: string;
    accessed_at: string;
    action: string;
  }>;

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface UploadKycDocumentInput {
  customer_type: CustomerType;
  consumer_order_id?: string;
  business_quote_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name?: string;
  document_type: KycDocumentType;
  document_title: string;
  file: File;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// ORDER STATUS HISTORY
// =============================================================================

export interface OrderStatusHistory {
  id: string;

  // Reference to Order/Quote
  entity_type: 'consumer_order' | 'business_quote' | 'coverage_lead';
  entity_id: string;

  // Status Change
  old_status?: string | null;
  new_status: string;
  status_changed_at: string;

  // Change Details
  changed_by?: string | null;
  change_reason?: string | null;
  automated: boolean;

  // Notification
  customer_notified: boolean;
  notification_sent_at?: string | null;
  notification_method?: NotificationMethod | null;

  // Additional Context
  metadata?: Record<string, any>;
  notes?: string | null;

  // Timestamps
  created_at: string;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export interface OrderSummary {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  package_name: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

export interface QuoteSummary {
  quote_id: string;
  quote_number: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  package_name: string;
  total_amount: number;
  status: QuoteStatus;
  valid_until: string;
  created_at: string;
}

export interface LeadSummary {
  lead_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  status: CoverageLeadStatus;
  lead_source: LeadSource;
  next_follow_up_at?: string | null;
  created_at: string;
}

// =============================================================================
// STATUS BADGE CONFIGURATIONS
// =============================================================================

export interface StatusBadgeConfig {
  label: string;
  color: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusBadgeConfig> = {
  pending: { label: 'Pending', color: 'default' },
  payment_pending: { label: 'Payment Pending', color: 'warning', icon: '💳' },
  payment_received: { label: 'Payment Received', color: 'success', icon: '✅' },
  kyc_pending: { label: 'KYC Pending', color: 'warning', icon: '📄' },
  kyc_approved: { label: 'KYC Approved', color: 'success', icon: '✅' },
  kyc_rejected: { label: 'KYC Rejected', color: 'error', icon: '❌' },
  credit_check_pending: { label: 'Credit Check Pending', color: 'warning', icon: '🔍' },
  credit_check_approved: { label: 'Credit Check Approved', color: 'success', icon: '✅' },
  credit_check_rejected: { label: 'Credit Check Rejected', color: 'error', icon: '❌' },
  installation_scheduled: { label: 'Installation Scheduled', color: 'info', icon: '📅' },
  installation_in_progress: { label: 'Installation in Progress', color: 'info', icon: '🔧' },
  installation_completed: { label: 'Installation Completed', color: 'success', icon: '✅' },
  active: { label: 'Active', color: 'success', icon: '🟢' },
  on_hold: { label: 'On Hold', color: 'warning', icon: '⏸️' },
  cancelled: { label: 'Cancelled', color: 'error', icon: '❌' },
  failed: { label: 'Failed', color: 'error', icon: '❌' },
};

export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, StatusBadgeConfig> = {
  draft: { label: 'Draft', color: 'default', icon: '📝' },
  sent: { label: 'Sent', color: 'info', icon: '📧' },
  viewed: { label: 'Viewed', color: 'info', icon: '👁️' },
  accepted: { label: 'Accepted', color: 'success', icon: '✅' },
  rejected: { label: 'Rejected', color: 'error', icon: '❌' },
  expired: { label: 'Expired', color: 'error', icon: '⏰' },
  converted_to_order: { label: 'Converted to Order', color: 'success', icon: '🎉' },
};

export const LEAD_STATUS_CONFIG: Record<CoverageLeadStatus, StatusBadgeConfig> = {
  new: { label: 'New', color: 'info', icon: '🆕' },
  contacted: { label: 'Contacted', color: 'info', icon: '📞' },
  interested: { label: 'Interested', color: 'success', icon: '👍' },
  not_interested: { label: 'Not Interested', color: 'default', icon: '👎' },
  coverage_available: { label: 'Coverage Available', color: 'success', icon: '📡' },
  converted_to_order: { label: 'Converted to Order', color: 'success', icon: '🎉' },
  lost: { label: 'Lost', color: 'error', icon: '❌' },
  follow_up_scheduled: { label: 'Follow-up Scheduled', color: 'warning', icon: '📅' },
};

export const KYC_STATUS_CONFIG: Record<KycVerificationStatus, StatusBadgeConfig> = {
  pending: { label: 'Pending Review', color: 'default', icon: '⏳' },
  under_review: { label: 'Under Review', color: 'info', icon: '🔍' },
  approved: { label: 'Approved', color: 'success', icon: '✅' },
  rejected: { label: 'Rejected', color: 'error', icon: '❌' },
  expired: { label: 'Expired', color: 'error', icon: '⏰' },
  requires_update: { label: 'Requires Update', color: 'warning', icon: '📝' },
};
