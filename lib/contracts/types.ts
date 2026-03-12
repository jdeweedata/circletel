/**
 * Contract Types
 * Task Group 6: Contract Generation & PDF with KYC Badge
 */

export interface ContractCreateRequest {
  quoteId: string;
  kycSessionId: string;
}

export interface ContractResponse {
  contractId: string;
  contractNumber: string;
  pdfUrl: string | null;
  status: ContractStatus;
  totalContractValue: number;
  startDate: string;
  endDate: string;
}

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  PARTIALLY_SIGNED = 'partially_signed',
  FULLY_SIGNED = 'fully_signed',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated'
}

export interface ContractPDFData {
  contract: {
    contractNumber: string;
    contractType: string;
    contractTermMonths: number;
    startDate: string;
    endDate: string;
    monthlyRecurring: number;
    onceOffFee: number;
    installationFee: number;
    totalContractValue: number;
  };
  quote: {
    quoteNumber: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    installationAddress: string;
  };
  kyc: {
    verifiedDate: string;
    riskTier: string;
    verificationType: string;
  };
}

export type ServiceType = 'fibre' | 'wireless' | 'hybrid' | 'managed_wireless';

export type ContractModel = 'fixed-term' | 'month-to-month';

export interface ContractTemplate {
  serviceType: ServiceType;
  contractModel?: ContractModel;
  termsAndConditions: string[];
  slaTerms: string[];
  cancellationPolicy: string;
  earlyTerminationFee: string;
  equipmentClause?: string;
}

/**
 * Manual contract input for managed services (without quote in database)
 */
export interface ManagedServiceContractInput {
  customer: {
    companyName: string;
    registrationNumber?: string;
    vatNumber?: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
  };
  service: {
    type: string;
    description: string;
    speedDown: number;
    speedUp: number;
    dataPolicy: string; // e.g., "Truly Uncapped (No FUP)"
    staticIp: boolean;
    router: string;
    monitoring: string;
  };
  pricing: {
    monthlyFee: number;       // Excl. VAT
    installationFee: number;  // Excl. VAT
    vatRate: number;          // e.g., 0.15
  };
  sla: {
    uptimeGuarantee: number;  // e.g., 99.5
    faultResponse: string;    // e.g., "4 hours"
    faultResolution: string;  // e.g., "3 business days"
    creditCap: number;        // Max % of monthly fee
  };
  contract: {
    term: string;             // e.g., "Month-to-month" or "24 months"
    noticePeriod: number;     // Days
    commencementDate: string; // ISO date
    contractNumber?: string;  // Auto-generate if not provided
  };
  equipment: {
    description: string;
    ownership: string;        // e.g., "CircleTel retains ownership"
    returnPeriod: string;     // e.g., "14 days after termination"
    replacementFee: number;
  };
}

export interface Contract {
  id: string;
  contract_number: string;
  quote_id: string;
  customer_id: string;
  kyc_session_id: string;
  contract_type: 'fibre' | 'wireless' | 'hybrid';
  contract_term_months: number;
  start_date: string;
  end_date: string;
  monthly_recurring: number;
  once_off_fee: number;
  installation_fee: number;
  total_contract_value: number;
  zoho_sign_request_id: string | null;
  customer_signature_date: string | null;
  circletel_signature_date: string | null;
  fully_signed_date: string | null;
  signed_pdf_url: string | null;
  status: ContractStatus;
  zoho_deal_id: string | null;
  last_synced_at: string | null;
  pdf_url: string | null;
  created_at: string;
}
