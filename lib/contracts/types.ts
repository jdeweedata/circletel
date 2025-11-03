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

export interface ContractTemplate {
  serviceType: 'fibre' | 'wireless' | 'hybrid';
  termsAndConditions: string[];
  slaTerms: string[];
  cancellationPolicy: string;
  earlyTerminationFee: string;
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
