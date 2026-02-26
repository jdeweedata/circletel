/**
 * Partner Feasibility Types
 *
 * Type definitions for the Partner Self-Service Feasibility Portal
 */

// ============================================================================
// STATUS TYPES
// ============================================================================

export type FeasibilityRequestStatus =
  | 'draft'
  | 'checking'
  | 'complete'
  | 'quote_generated'
  | 'expired';

export type CoverageCheckStatus =
  | 'pending'
  | 'checking'
  | 'complete'
  | 'failed';

export type ContentionType =
  | 'best-effort'
  | '10:1'
  | '5:1'
  | '2:1'
  | 'dia';

export type SLALevel =
  | 'standard'
  | 'premium'
  | 'carrier_grade';

export type AIRequestType =
  | 'chat'
  | 'extraction'
  | 'recommendation';

// ============================================================================
// CHAT INTERFACES
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  extracted_data?: Partial<ExtractedFeasibilityData>;
}

export interface ExtractedFeasibilityData {
  sites: ExtractedSite[];
  requirements: ExtractedRequirements;
  client: ExtractedClient;
}

export interface ExtractedSite {
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ExtractedRequirements {
  bandwidth_mbps?: number;
  budget_max_rands?: number;
  contention?: ContentionType;
  sla?: SLALevel;
  failover_needed?: boolean;
  failover_bandwidth_mbps?: number;
}

export interface ExtractedClient {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
}

// ============================================================================
// DATABASE INTERFACES
// ============================================================================

export interface PartnerFeasibilityRequest {
  id: string;
  partner_id: string;

  // Client Information
  client_company_name: string;
  client_contact_name?: string;
  client_email?: string;
  client_phone?: string;

  // Requirements
  bandwidth_required?: number;
  contention?: ContentionType;
  sla_level?: SLALevel;
  failover_required: boolean;
  contract_term: number;

  // Status
  status: FeasibilityRequestStatus;

  // Chat History
  chat_history: ChatMessage[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PartnerFeasibilitySite {
  id: string;
  request_id: string;

  // Location
  address: string;
  latitude?: number;
  longitude?: number;

  // Coverage
  coverage_status: CoverageCheckStatus;
  coverage_results?: CoverageResult[];

  // Packages
  selected_packages: SelectedPackage[];

  // Link to coverage infrastructure
  coverage_lead_id?: string;

  // Timestamps
  created_at: string;
}

export interface CoverageResult {
  technology: string;
  provider: string;
  is_feasible: boolean;
  confidence: number;
  packages?: PackageOption[];
  checked_at: string;
  error?: string;
}

export interface PackageOption {
  id: string;
  name: string;
  speed_down: number;
  speed_up: number;
  price: number;
  contention?: string;
  provider: string;
  technology: string;
}

export interface SelectedPackage {
  package_id: string;
  technology: string;
  price: number;
  name?: string;
}

export interface PartnerAIUsage {
  id: string;
  partner_id: string;
  request_type: AIRequestType;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  response_time_ms?: number;
  success: boolean;
  request_id?: string;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface ChatRequest {
  message: string;
  request_id?: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  extracted_data?: Partial<ExtractedFeasibilityData>;
  error?: string;
}

export interface CreateFeasibilityRequest {
  client_company_name: string;
  client_contact_name?: string;
  client_email?: string;
  client_phone?: string;
  bandwidth_required?: number;
  contention?: ContentionType;
  sla_level?: SLALevel;
  failover_required?: boolean;
  contract_term?: number;
  sites: CreateSiteInput[];
}

export interface CreateSiteInput {
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateFeasibilityResponse {
  success: boolean;
  request_id?: string;
  sites?: PartnerFeasibilitySite[];
  error?: string;
}

export interface FeasibilityStatusResponse {
  success: boolean;
  request?: PartnerFeasibilityRequest & {
    sites: PartnerFeasibilitySite[];
  };
  error?: string;
}

export interface FeasibilityHistoryResponse {
  success: boolean;
  requests?: Array<PartnerFeasibilityRequest & {
    site_count: number;
  }>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: string;
}

// ============================================================================
// UI STATE INTERFACES
// ============================================================================

export interface FeasibilityFormState {
  // Client
  client_company_name: string;
  client_contact_name: string;
  client_email: string;
  client_phone: string;

  // Requirements
  bandwidth_required: number | null;
  contention: ContentionType | null;
  sla_level: SLALevel | null;
  failover_required: boolean;
  contract_term: number;

  // Sites
  sites: FormSite[];
}

export interface FormSite {
  id: string; // Client-side ID for list management
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface FeasibilityUIState {
  // View state
  currentStep: 'chat' | 'form' | 'checking' | 'results';

  // Loading states
  isSubmitting: boolean;
  isChatLoading: boolean;

  // Request state
  request_id?: string;

  // Chat
  messages: ChatMessage[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONTENTION_OPTIONS: Array<{
  value: ContentionType;
  label: string;
  description: string;
}> = [
  {
    value: 'best-effort',
    label: 'Best Effort',
    description: 'Shared bandwidth, best value',
  },
  {
    value: '10:1',
    label: '10:1 Contention',
    description: 'Light sharing, good performance',
  },
  {
    value: '5:1',
    label: '5:1 Contention',
    description: 'Premium performance',
  },
  {
    value: '2:1',
    label: '2:1 Contention',
    description: 'Near-dedicated',
  },
  {
    value: 'dia',
    label: 'DIA (Dedicated)',
    description: 'Fully dedicated, guaranteed speeds',
  },
];

export const SLA_OPTIONS: Array<{
  value: SLALevel;
  label: string;
  description: string;
}> = [
  {
    value: 'standard',
    label: 'Standard',
    description: '99% uptime, next-day support',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: '99.5% uptime, 4-hour response',
  },
  {
    value: 'carrier_grade',
    label: 'Carrier Grade',
    description: '99.9% uptime, 2-hour response',
  },
];

export const BANDWIDTH_OPTIONS = [
  { value: 50, label: '50 Mbps' },
  { value: 100, label: '100 Mbps' },
  { value: 200, label: '200 Mbps' },
  { value: 500, label: '500 Mbps' },
  { value: 1000, label: '1 Gbps' },
];

export const CONTRACT_TERMS = [
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
  { value: 36, label: '36 months' },
];

export const STATUS_LABELS: Record<FeasibilityRequestStatus, string> = {
  draft: 'Draft',
  checking: 'Checking Coverage',
  complete: 'Complete',
  quote_generated: 'Quote Generated',
  expired: 'Expired',
};

export const STATUS_COLORS: Record<FeasibilityRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  checking: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  quote_generated: 'bg-purple-100 text-purple-700',
  expired: 'bg-red-100 text-red-700',
};
