// ZOHO CRM Integration Types
// Type definitions for ZOHO CRM sync system

// ============================================================================
// Database Types
// ============================================================================

export interface ZohoToken {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type: string;
  scope?: string;
  created_at: string;
  updated_at: string;
}

export type SyncStatus = 'pending' | 'success' | 'failed' | 'retrying';
export type CircleTelEntityType = 'quote' | 'contract' | 'invoice' | 'customer';
export type ZohoEntityType = 'Estimates' | 'Deals' | 'Invoices' | 'Contacts';

export interface ZohoSyncLog {
  id: string;
  entity_type: CircleTelEntityType;
  entity_id: string;
  zoho_entity_type?: ZohoEntityType;
  zoho_entity_id?: string;
  status: SyncStatus;
  attempt_number: number;
  error_message?: string;
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  created_at: string;
}

export interface ZohoEntityMapping {
  id: string;
  circletel_type: CircleTelEntityType;
  circletel_id: string;
  zoho_type: ZohoEntityType;
  zoho_id: string;
  last_synced_at: string;
  created_at: string;
}

// ============================================================================
// ZOHO CRM Custom Fields
// ============================================================================

export type KYCStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Declined';
export type RiskTier = 'Low' | 'Medium' | 'High';
export type RICAStatus = 'Pending' | 'Submitted' | 'Approved' | 'Rejected';

export interface ZohoCRMCustomFields {
  KYC_Status?: KYCStatus;
  KYC_Verified_Date?: string;
  Risk_Tier?: RiskTier;
  RICA_Status?: RICAStatus;
  Contract_Number?: string;
  Contract_Signed_Date?: string;
}

// ============================================================================
// ZOHO CRM API Request Types
// ============================================================================

export interface ZohoEstimateData extends ZohoCRMCustomFields {
  Subject: string;
  Account_Name?: { name: string; id?: string };
  Grand_Total: number;
  Quote_Stage?: string;
  Valid_Till?: string;
  Description?: string;
  Billing_Street?: string;
  Billing_City?: string;
  Billing_State?: string;
  Billing_Code?: string;
  Billing_Country?: string;
}

export interface ZohoDealData extends ZohoCRMCustomFields {
  Deal_Name: string;
  Account_Name?: { name: string; id?: string };
  Amount: number;
  Stage: string;
  Closing_Date?: string;
  Type?: string;
  Description?: string;
  Lead_Source?: string;
  Contact_Name?: { name: string; id?: string };
}

export interface ZohoContactData {
  First_Name: string;
  Last_Name: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Account_Name?: { name: string; id?: string };
  Title?: string;
  Department?: string;
  Mailing_Street?: string;
  Mailing_City?: string;
  Mailing_State?: string;
  Mailing_Code?: string;
  Mailing_Country?: string;
}

export interface ZohoInvoiceData {
  Subject: string;
  Account_Name: { name: string; id?: string };
  Invoice_Date: string;
  Due_Date: string;
  Status?: string;
  Grand_Total: number;
  Description?: string;
  Terms_and_Conditions?: string;
}

// ============================================================================
// ZOHO API Response Types
// ============================================================================

export interface ZohoCRMResponse<T = unknown> {
  data: T[];
  info?: {
    per_page: number;
    count: number;
    page: number;
    more_records: boolean;
  };
}

export interface ZohoRecordDetails {
  id: string;
  created_time?: string;
  modified_time?: string;
  created_by?: { id: string; name: string };
  modified_by?: { id: string; name: string };
}

export interface ZohoCreateResponse {
  data: Array<{
    code: string;
    details: ZohoRecordDetails;
    message: string;
    status: string;
  }>;
}

export interface ZohoUpdateResponse {
  data: Array<{
    code: string;
    details: {
      id: string;
      modified_time: string;
    };
    message: string;
    status: string;
  }>;
}

export interface ZohoErrorResponse {
  code: string;
  details: Record<string, unknown>;
  message: string;
  status: string;
}

// ============================================================================
// CircleTel Entity Types (for sync)
// ============================================================================

export interface QuoteDataForSync {
  id: string;
  quote_number: string;
  company_name: string;
  total_amount: number;
  kyc_status?: string;
  status?: string;
  valid_until?: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: string;
  created_at: string;
}

export interface ContractDataForSync {
  id: string;
  contract_number: string;
  customer_name: string;
  customer_email?: string;
  total_contract_value: number;
  kyc_status?: string;
  kyc_verified_date?: string;
  risk_tier?: string;
  rica_status?: string;
  signed_date?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  created_at: string;
}

// ============================================================================
// Sync Service Types
// ============================================================================

export interface SyncOptions {
  forceSync?: boolean; // Re-sync even if already synced
  skipValidation?: boolean; // Skip data validation
  maxRetries?: number; // Override default retry count
}

export interface SyncResult {
  success: boolean;
  zohoEntityId?: string;
  zohoEntityType?: ZohoEntityType;
  error?: string;
  attemptNumber?: number;
  syncLogId?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number; // Exponential backoff multiplier
  initialDelayMs: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface ZohoWebhookPayload {
  module: string;
  operation: 'insert' | 'update' | 'delete';
  record_id: string;
  record_data: Record<string, unknown>;
  user_id: string;
  org_id: string;
  timestamp: string;
}

export interface ZohoWebhookVerification {
  signature: string;
  timestamp: string;
  payload: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ZohoFieldMapping {
  circletelField: string;
  zohoField: string;
  transform?: (value: unknown) => unknown;
}

export interface EntitySyncConfig {
  circletelType: CircleTelEntityType;
  zohoType: ZohoEntityType;
  fieldMappings: ZohoFieldMapping[];
  requiredFields: string[];
}
