/**
 * TypeScript Type Definitions for Didit KYC Integration
 *
 * Didit API: https://api.didit.me/v1
 * Purpose: FICA-compliant KYC verification for South African businesses and consumers
 */

/**
 * KYC Flow Types
 * - sme_light: Basic verification for SME quotes <R500k
 * - consumer_light: Basic verification for consumer quotes
 * - full_kyc: Comprehensive verification for enterprise quotes >=R500k
 */
export type DiditFlowType = 'business_light_kyc' | 'consumer_light_kyc' | 'business_full_kyc';

/**
 * KYC Feature Flags
 * - id_verification: South African Smart ID and passport verification
 * - document_extraction: AI extraction from company registration (CK1), proof of address
 * - liveness: Passive liveness detection (1:1 face match, deepfake detection)
 * - aml: Anti-Money Laundering screening
 */
export type DiditFeature = 'id_verification' | 'document_extraction' | 'liveness' | 'aml';

/**
 * Session Status
 * - not_started: Session created but customer hasn't started verification
 * - in_progress: Customer actively completing verification steps
 * - completed: Verification finished (success or failure)
 * - abandoned: Customer closed session without completing
 */
export type DiditSessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

/**
 * Verification Result
 * - approved: Low-risk verification, contract can be auto-generated
 * - declined: High-risk verification, customer notified
 * - pending_review: Medium-risk verification, escalated to admin compliance queue
 */
export type DiditVerificationResult = 'approved' | 'declined' | 'pending_review';

/**
 * Document Authenticity Score
 * - valid: Document passed all authenticity checks
 * - suspicious: Document has minor flags, manual review recommended
 * - invalid: Document failed authenticity checks (fake, tampered)
 */
export type DocumentAuthenticity = 'valid' | 'suspicious' | 'invalid';

/**
 * Proof of Address Document Types (South African)
 */
export type ProofOfAddressType = 'utility_bill' | 'bank_statement' | 'municipal_account' | 'lease_agreement';

/**
 * Didit KYC Session Creation Request
 *
 * Sent to: POST https://api.didit.me/v1/sessions
 */
export interface DiditSessionRequest {
  type: 'kyc';
  jurisdiction: 'ZA'; // South Africa
  flow: DiditFlowType;
  features: DiditFeature[];
  metadata: {
    quote_id: string;
    user_type?: 'business' | 'consumer';
    quote_amount?: number;
  };
  redirect_url?: string; // Where to redirect customer after verification
  webhook_url?: string;  // Where Didit sends completion webhooks
}

/**
 * Didit KYC Session Creation Response
 *
 * Received from: POST https://api.didit.me/v1/sessions
 */
export interface DiditSessionResponse {
  sessionId: string;
  status: DiditSessionStatus;
  verificationUrl: string; // Customer-facing verification URL
  expiresAt: string;       // ISO 8601 timestamp
  createdAt: string;       // ISO 8601 timestamp
}

/**
 * Didit Session Status Response
 *
 * Received from: GET https://api.didit.me/v1/sessions/:sessionId
 */
export interface DiditSessionStatusResponse {
  sessionId: string;
  status: DiditSessionStatus;
  result?: {
    verification_status: DiditVerificationResult;
    risk_score: number; // 0-100 scale
    completed_at: string;
  };
  extractedData?: ExtractedKYCData;
}

/**
 * Extracted KYC Data from Didit Verification
 *
 * AI-extracted data from ID documents, company registration, proof of address
 */
export interface ExtractedKYCData {
  // Personal Identification
  id_number: string;
  full_name: string;
  date_of_birth: string;

  // Company Information (Business KYC only)
  company_reg?: string;
  company_name?: string;
  directors?: Array<{
    name: string;
    id_number: string;
    designation?: string;
  }>;

  // Proof of Address
  proof_of_address: {
    type: ProofOfAddressType;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    province: string;
    postal_code: string;
    verified: boolean;
    document_date?: string; // Must be <3 months old
  };

  // Liveness & Fraud Detection
  liveness_score: number; // 0.0 to 1.0 (>0.8 = high confidence real person)
  face_match_score?: number; // ID photo vs selfie match

  // Document Authenticity
  document_authenticity: DocumentAuthenticity;
  document_validation_details?: {
    id_document_valid: boolean;
    company_reg_valid?: boolean;
    proof_of_address_valid: boolean;
    warnings?: string[];
  };

  // AML Screening
  aml_flags: string[]; // Empty array = no flags
  sanctions_match: boolean;
  pep_match: boolean; // Politically Exposed Person

  // Metadata
  verification_timestamp: string;
  verification_method: string;
}

/**
 * Didit Webhook Payload
 *
 * Sent to: POST {process.env.NEXT_PUBLIC_APP_URL}/api/compliance/webhook/didit
 * Headers: { 'X-Didit-Signature': '<HMAC-SHA256-signature>' }
 */
export interface DiditWebhookPayload {
  event: 'verification.completed' | 'verification.failed' | 'session.abandoned' | 'session.expired';
  sessionId: string;
  timestamp: string; // ISO 8601

  // Present for 'verification.completed' events
  result?: {
    status: DiditVerificationResult;
    risk_score: number;
  };

  // Present for 'verification.completed' events with successful extraction
  data?: ExtractedKYCData;

  // Present for 'verification.failed' events
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Webhook Verification Result
 */
export interface WebhookVerificationResult {
  valid: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * Risk Tier Categories
 *
 * Based on 100-point risk scoring system:
 * - low: 80-100 points (auto-approve, generate contract)
 * - medium: 50-79 points (escalate to admin compliance queue)
 * - high: 0-49 points (decline, notify customer)
 */
export type RiskTier = 'low' | 'medium' | 'high';

/**
 * Risk Score Breakdown
 */
export interface RiskScoreBreakdown {
  liveness_score_points: number;    // Max 40 points
  document_validity_points: number; // Max 30 points
  aml_screening_points: number;     // Max 30 points
  total_score: number;              // Sum of above
  risk_tier: RiskTier;
  auto_approved: boolean;
  reasoning: string[];
}

/**
 * Session Manager Return Type
 */
export interface KYCSessionCreationResult {
  sessionId: string;
  verificationUrl: string;
  flowType: 'sme_light' | 'consumer_light' | 'full_kyc';
  expiresAt: string;
}
