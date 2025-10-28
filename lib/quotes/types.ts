/**
 * Business Quotes System - TypeScript Types
 *
 * Comprehensive type definitions for the CircleTel business quote system
 * covering quotes, line items, signatures, versions, and terms.
 */

// =====================================================
// ENUMS
// =====================================================

export type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired';

export type QuoteItemType = 'primary' | 'secondary' | 'additional';

export type SignatureType = 'drawn' | 'typed';

export type CustomerType = 'smme' | 'enterprise';

export type ContractTerm = 12 | 24 | 36;

// =====================================================
// DATABASE ENTITIES
// =====================================================

/**
 * Main business quote entity
 */
export interface BusinessQuote {
  id: string;
  quote_number: string;

  // Customer information
  customer_id: string | null;
  lead_id: string | null;
  customer_type: CustomerType;

  // Company details
  company_name: string;
  registration_number: string | null;
  vat_number: string | null;

  // Contact details
  contact_name: string;
  contact_email: string;
  contact_phone: string;

  // Service location
  service_address: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;

  // Quote details
  status: QuoteStatus;
  contract_term: ContractTerm;

  // Pricing
  subtotal_monthly: number;
  subtotal_installation: number;
  custom_discount_percent: number;
  custom_discount_amount: number;
  custom_discount_reason: string | null;
  vat_amount_monthly: number;
  vat_amount_installation: number;
  total_monthly: number;
  total_installation: number;

  // Notes
  admin_notes: string | null;
  customer_notes: string | null;

  // Validity
  valid_until: string; // ISO date string

  // Workflow tracking
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  expired_at: string | null;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Quote line item (service)
 */
export interface BusinessQuoteItem {
  id: string;
  quote_id: string;

  // Package reference
  package_id: string;
  item_type: QuoteItemType;

  // Pricing
  quantity: number;
  monthly_price: number;
  installation_price: number;
  custom_pricing: boolean;

  // Service details (denormalized)
  service_name: string;
  service_type: string;
  product_category: string;
  speed_down: number | null;
  speed_up: number | null;
  data_cap_gb: number | null;

  // Additional info
  notes: string | null;
  display_order: number;

  // Audit
  created_at: string;
  updated_at: string;
}

/**
 * Quote version history
 */
export interface BusinessQuoteVersion {
  id: string;
  quote_id: string;
  version_number: number;

  // Snapshot
  quote_data: {
    quote: BusinessQuote;
    items: BusinessQuoteItem[];
  };

  // Change tracking
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
}

/**
 * Digital signature
 */
export interface BusinessQuoteSignature {
  id: string;
  quote_id: string;

  // Signer information
  signer_name: string;
  signer_email: string;
  signer_id_number: string;
  signer_position: string | null;

  // Signature data
  signature_type: SignatureType;
  signature_data: string; // Base64

  // Compliance
  fica_documents_confirmed: boolean;
  cipc_documents_confirmed: boolean;
  terms_accepted: boolean;

  // Audit trail
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
  verified_at: string | null;
  verified_by: string | null;
}

/**
 * Terms & conditions template
 */
export interface BusinessQuoteTerms {
  id: string;
  service_type: string;
  contract_term: ContractTerm | null;
  title: string;
  terms_text: string;
  version: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Create quote request
 */
export interface CreateQuoteRequest {
  lead_id: string;
  customer_type: CustomerType;
  company_name: string;
  registration_number?: string;
  vat_number?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  service_address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contract_term: ContractTerm;
  items: CreateQuoteItemRequest[];
  customer_notes?: string;
}

/**
 * Create quote item request
 */
export interface CreateQuoteItemRequest {
  package_id: string;
  item_type: QuoteItemType;
  quantity?: number;
  notes?: string;
}

/**
 * Update quote request
 */
export interface UpdateQuoteRequest {
  company_name?: string;
  registration_number?: string;
  vat_number?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  service_address?: string;
  contract_term?: ContractTerm;
  custom_discount_percent?: number;
  custom_discount_amount?: number;
  custom_discount_reason?: string;
  admin_notes?: string;
  customer_notes?: string;
  valid_until?: string;
}

/**
 * Quote with items (joined)
 */
export interface QuoteWithItems extends BusinessQuote {
  items: BusinessQuoteItem[];
}

/**
 * Quote with full details
 */
export interface QuoteDetails extends QuoteWithItems {
  signature: BusinessQuoteSignature | null;
  versions: BusinessQuoteVersion[];
  approved_by_admin?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

/**
 * Quote summary for lists
 */
export interface QuoteSummary {
  id: string;
  quote_number: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  status: QuoteStatus;
  total_monthly: number;
  total_installation: number;
  service_count: number;
  created_at: string;
  valid_until: string;
  customer_type: CustomerType;
}

/**
 * Sign quote request
 */
export interface SignQuoteRequest {
  quote_id: string;
  signer_name: string;
  signer_email: string;
  signer_id_number: string;
  signer_position?: string;
  signature_type: SignatureType;
  signature_data: string; // Base64 canvas or typed name
  fica_documents_confirmed: boolean;
  cipc_documents_confirmed: boolean;
  terms_accepted: boolean;
}

/**
 * Quote analytics data
 */
export interface QuoteAnalytics {
  total_quotes: number;
  quotes_by_status: Record<QuoteStatus, number>;
  conversion_rate: number; // accepted / sent
  average_monthly_value: number;
  average_installation_value: number;
  average_time_to_acceptance_days: number;
  popular_packages: Array<{
    package_id: string;
    package_name: string;
    count: number;
  }>;
  quotes_by_customer_type: Record<CustomerType, number>;
  quotes_by_contract_term: Record<ContractTerm, number>;
}

/**
 * Quote filters for admin dashboard
 */
export interface QuoteFilters {
  status?: QuoteStatus | QuoteStatus[];
  customer_type?: CustomerType;
  created_after?: string;
  created_before?: string;
  valid_until_after?: string;
  valid_until_before?: string;
  search?: string; // Search by company name, contact, quote number
  approved_by?: string;
  min_monthly_value?: number;
  max_monthly_value?: number;
}

// =====================================================
// FORM TYPES
// =====================================================

/**
 * Quote builder form data
 */
export interface QuoteBuilderFormData {
  // Step 1: Company details
  customer_type: CustomerType;
  company_name: string;
  registration_number: string;
  vat_number: string;

  // Step 2: Contact details
  contact_name: string;
  contact_email: string;
  contact_phone: string;

  // Step 3: Service location
  service_address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Step 4: Contract terms
  contract_term: ContractTerm;

  // Step 5: Services
  services: QuoteServiceSelection[];

  // Optional
  customer_notes?: string;
}

/**
 * Service selection in quote builder
 */
export interface QuoteServiceSelection {
  package_id: string;
  package_name: string;
  service_type: string;
  product_category: string;
  item_type: QuoteItemType;
  quantity: number;
  monthly_price: number;
  installation_price: number;
  speed_down?: number;
  speed_up?: number;
  notes?: string;
}

// =====================================================
// UI STATE TYPES
// =====================================================

/**
 * Quote builder wizard step
 */
export type QuoteBuilderStep =
  | 'company-details'
  | 'contact-details'
  | 'service-location'
  | 'contract-terms'
  | 'select-services'
  | 'review';

/**
 * Quote action result
 */
export interface QuoteActionResult {
  success: boolean;
  error?: string;
  quote?: QuoteWithItems;
  message?: string;
}

/**
 * Quote status badge config
 */
export interface QuoteStatusConfig {
  label: string;
  color: 'gray' | 'yellow' | 'blue' | 'green' | 'red';
  icon?: string;
  description: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Pricing breakdown
 */
export interface PricingBreakdown {
  subtotal_monthly: number;
  subtotal_installation: number;
  discount: number;
  discount_reason?: string;
  vat_monthly: number;
  vat_installation: number;
  total_monthly: number;
  total_installation: number;
  total_upfront: number;
  total_contract_value: number; // total_monthly * contract_term + total_installation
}

/**
 * Coverage details for quote
 */
export interface QuoteCoverageDetails {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  available_services: string[];
  providers: string[];
  coverage_confidence: 'high' | 'medium' | 'low';
}

/**
 * Installation estimate
 */
export interface InstallationEstimate {
  estimated_cost: string;
  estimated_days: string;
  notes: string;
  requires_site_survey: boolean;
}

// =====================================================
// CONSTANTS
// =====================================================

export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, QuoteStatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'gray',
    description: 'Quote is being prepared'
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'yellow',
    description: 'Awaiting admin review'
  },
  approved: {
    label: 'Approved',
    color: 'blue',
    description: 'Approved and ready to send'
  },
  sent: {
    label: 'Sent',
    color: 'blue',
    description: 'Quote sent to customer'
  },
  viewed: {
    label: 'Viewed',
    color: 'blue',
    description: 'Customer viewed the quote'
  },
  accepted: {
    label: 'Accepted',
    color: 'green',
    description: 'Customer accepted and signed'
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    description: 'Quote was rejected'
  },
  expired: {
    label: 'Expired',
    color: 'gray',
    description: 'Quote validity period ended'
  }
};

export const CONTRACT_TERMS: ContractTerm[] = [12, 24, 36];

export const ITEM_TYPE_LABELS: Record<QuoteItemType, string> = {
  primary: 'Primary Service',
  secondary: 'Secondary/Backup Service',
  additional: 'Additional Service'
};

export const VAT_RATE = 0.15; // 15% VAT for South Africa
