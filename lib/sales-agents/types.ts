/**
 * Sales Agents System - TypeScript Types
 *
 * Type definitions for sales agents, quote links, and acceptance workflow
 */

// =====================================================
// ENUMS
// =====================================================

export type AgentType = 'internal' | 'external' | 'partner';
export type AgentStatus = 'active' | 'inactive' | 'suspended';

// =====================================================
// DATABASE ENTITIES
// =====================================================

/**
 * Sales Agent entity
 */
export interface SalesAgent {
  id: string;

  // Authentication
  email: string;
  password_hash?: string;

  // Profile
  full_name: string;
  phone: string | null;
  company: string | null;
  agent_type: AgentType;

  // Commission & Performance
  commission_rate: number;
  total_quotes_created: number;
  total_quotes_accepted: number;
  total_revenue_generated: number;

  // Shareable Link
  unique_link_token: string;

  // Status
  status: AgentStatus;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Agent Quote Link (Shareable Link)
 */
export interface AgentQuoteLink {
  id: string;
  agent_id: string;

  // Link configuration
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  active: boolean;

  // Metadata
  created_at: string;
}

/**
 * Quote Acceptance Link
 */
export interface QuoteAcceptanceLink {
  id: string;
  quote_id: string;

  // Link configuration
  token: string;
  expires_at: string;

  // Tracking
  viewed_at: string | null;
  view_count: number;

  // Metadata
  created_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Create sales agent request
 */
export interface CreateSalesAgentRequest {
  email: string;
  full_name: string;
  phone?: string;
  company?: string;
  agent_type: AgentType;
  commission_rate?: number;
  password?: string; // For agents who will log in
}

/**
 * Update sales agent request
 */
export interface UpdateSalesAgentRequest {
  full_name?: string;
  phone?: string;
  company?: string;
  commission_rate?: number;
  status?: AgentStatus;
}

/**
 * Create agent quote link request
 */
export interface CreateAgentQuoteLinkRequest {
  agent_id: string;
  expires_at?: string;
  max_uses?: number;
}

/**
 * Quote request form data (from agent or shareable link)
 */
export interface QuoteRequestData {
  // Customer details
  customer_type: 'smme' | 'enterprise';
  company_name: string;
  registration_number?: string;
  vat_number?: string;

  // Contact details
  contact_name: string;
  contact_email: string;
  contact_phone: string;

  // Service location
  service_address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Coverage & packages
  coverage_lead_id?: string; // Link to coverage check result
  selected_packages: QuotePackageSelection[];

  // Contract details
  contract_term: 12 | 24 | 36;

  // Optional
  customer_notes?: string;
  agent_notes?: string;
}

/**
 * Package selection in quote request
 */
export interface QuotePackageSelection {
  package_id: string;
  item_type: 'primary' | 'secondary' | 'additional';
  quantity: number;
  notes?: string;
}

/**
 * Quote acceptance request
 */
export interface QuoteAcceptanceRequest {
  // Signature
  signer_name: string;
  signer_email: string;
  signer_id_number: string;
  signer_position?: string;
  signature_type: 'drawn' | 'typed';
  signature_data: string;

  // Compliance
  fica_documents_confirmed: boolean;
  cipc_documents_confirmed: boolean;
  terms_accepted: boolean;

  // Optional
  acceptance_notes?: string;
}

/**
 * Quote rejection request
 */
export interface QuoteRejectionRequest {
  rejection_reason: string;
  alternative_requested?: boolean;
}

// =====================================================
// EXTENDED TYPES (WITH RELATIONS)
// =====================================================

/**
 * Sales agent with performance metrics
 */
export interface SalesAgentWithMetrics extends SalesAgent {
  // Calculated metrics
  acceptance_rate: number; // Percentage
  average_quote_value: number;
  last_quote_created_at: string | null;
  active_quotes_count: number;
}

/**
 * Agent quote link with agent details
 */
export interface AgentQuoteLinkWithAgent extends AgentQuoteLink {
  agent: Pick<SalesAgent, 'id' | 'full_name' | 'email' | 'agent_type'>;
}

/**
 * Quote acceptance link with quote details
 */
export interface QuoteAcceptanceLinkWithQuote extends QuoteAcceptanceLink {
  quote: {
    id: string;
    quote_number: string;
    company_name: string;
    total_monthly: number;
    status: string;
  };
}

// =====================================================
// VALIDATION & UTILITY TYPES
// =====================================================

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  agent?: SalesAgent;
  link?: AgentQuoteLink;
  remaining_uses?: number;
}

/**
 * Agent performance summary
 */
export interface AgentPerformanceSummary {
  agent_id: string;
  agent_name: string;
  period_start: string;
  period_end: string;

  // Quote metrics
  quotes_created: number;
  quotes_sent: number;
  quotes_accepted: number;
  quotes_rejected: number;

  // Financial metrics
  total_revenue: number;
  total_commission: number;
  average_quote_value: number;

  // Performance metrics
  acceptance_rate: number;
  average_time_to_acceptance_hours: number;

  // Top packages sold
  top_packages: Array<{
    package_id: string;
    package_name: string;
    count: number;
    revenue: number;
  }>;
}

/**
 * Quote delivery method
 */
export type QuoteDeliveryMethod = 'email' | 'download' | 'shareable_link' | 'all';

/**
 * Quote delivery request
 */
export interface QuoteDeliveryRequest {
  quote_id: string;
  method: QuoteDeliveryMethod;
  recipient_email?: string; // For email method
  message?: string; // Optional message to client
}

/**
 * Quote delivery result
 */
export interface QuoteDeliveryResult {
  success: boolean;
  error?: string;
  email_sent?: boolean;
  pdf_url?: string;
  acceptance_link?: string;
  acceptance_token?: string;
}

// =====================================================
// FILTER & SEARCH TYPES
// =====================================================

/**
 * Sales agent filters
 */
export interface SalesAgentFilters {
  status?: AgentStatus | AgentStatus[];
  agent_type?: AgentType | AgentType[];
  search?: string; // Search by name, email, company
  min_commission_rate?: number;
  max_commission_rate?: number;
  created_after?: string;
  created_before?: string;
}

/**
 * Agent quotes filters
 */
export interface AgentQuotesFilters {
  agent_id: string;
  status?: string | string[];
  created_after?: string;
  created_before?: string;
  min_value?: number;
  max_value?: number;
}

// =====================================================
// CONSTANTS
// =====================================================

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  internal: 'Internal Sales Agent',
  external: 'External Sales Agent',
  partner: 'Partner Agent'
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended'
};

export const DEFAULT_COMMISSION_RATE = 5.0; // 5%
export const QUOTE_ACCEPTANCE_LINK_EXPIRY_DAYS = 30;
export const AGENT_QUOTE_LINK_DEFAULT_EXPIRY_DAYS = 90;

// =====================================================
// NOTIFICATION TYPES
// =====================================================

/**
 * Quote notification event
 */
export type QuoteNotificationEvent =
  | 'quote_created'
  | 'quote_sent'
  | 'quote_viewed'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'quote_expired';

/**
 * Quote notification payload
 */
export interface QuoteNotificationPayload {
  event: QuoteNotificationEvent;
  quote_id: string;
  quote_number: string;
  agent_id?: string;
  agent_name?: string;
  customer_name: string;
  customer_email: string;
  quote_value: number;
  additional_data?: Record<string, any>;
}
