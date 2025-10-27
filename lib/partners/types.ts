/**
 * Partner Types and Interfaces
 *
 * Type definitions for the Sales Partner system
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type PartnerStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
export type BusinessType = 'sole_proprietor' | 'company' | 'partnership'
export type KYCStatus = 'incomplete' | 'submitted' | 'verified' | 'rejected'

export type DocumentType =
  | 'id_document'
  | 'proof_of_address'
  | 'business_registration'
  | 'tax_certificate'
  | 'bank_statement'
  | 'other'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export type ActivityType = 'call' | 'email' | 'meeting' | 'quote_sent' | 'follow_up' | 'note'

// ============================================
// PARTNER INTERFACES
// ============================================

export interface Partner {
  id: string
  user_id: string

  // Business Information
  business_name: string
  registration_number?: string
  vat_number?: string
  business_type: BusinessType

  // Contact Information
  contact_person: string
  email: string
  phone: string
  alternative_phone?: string

  // Address
  street_address: string
  suburb?: string
  city: string
  province: string
  postal_code: string

  // Banking Details (encrypted in DB)
  bank_name?: string
  account_holder?: string
  account_number?: string
  account_type?: string
  branch_code?: string

  // Status
  status: PartnerStatus
  approval_notes?: string
  approved_by?: string
  approved_at?: string
  rejected_at?: string

  // KYC
  kyc_status: KYCStatus
  kyc_verified_at?: string

  // Performance Metrics
  total_leads: number
  converted_leads: number
  total_commission_earned: number
  pending_commission: number

  // Timestamps
  created_at: string
  updated_at: string
}

export interface PartnerKYCDocument {
  id: string
  partner_id: string

  // Document Details
  document_type: DocumentType
  document_name: string
  file_path: string
  file_size?: number
  mime_type?: string

  // Verification
  verification_status: VerificationStatus
  verified_by?: string
  verified_at?: string
  rejection_reason?: string

  // Timestamps
  uploaded_at: string
  expires_at?: string
}

export interface PartnerLeadActivity {
  id: string
  lead_id: string
  partner_id: string

  // Activity Details
  activity_type: ActivityType
  subject?: string
  description?: string
  outcome?: string

  // Next Action
  next_action?: string
  next_action_date?: string

  // Timestamp
  created_at: string
}

// ============================================
// FORM DATA INTERFACES
// ============================================

export interface PartnerRegistrationForm {
  // Business Information
  business_name: string
  registration_number?: string
  vat_number?: string
  business_type: BusinessType

  // Contact Information
  contact_person: string
  email: string
  phone: string
  alternative_phone?: string

  // Address
  street_address: string
  suburb?: string
  city: string
  province: string
  postal_code: string
}

export interface BankingDetailsForm {
  bank_name: string
  account_holder: string
  account_number: string
  account_type: 'savings' | 'cheque' | 'business'
  branch_code: string
}

export interface KYCUploadForm {
  document_type: DocumentType
  file: File
}

export interface LeadActivityForm {
  activity_type: ActivityType
  subject?: string
  description: string
  outcome?: string
  next_action?: string
  next_action_date?: Date
}

// ============================================
// API RESPONSE INTERFACES
// ============================================

export interface PartnerRegistrationResponse {
  success: boolean
  partner?: Partner
  message: string
  error?: string
}

export interface KYCUploadResponse {
  success: boolean
  document?: PartnerKYCDocument
  message: string
  error?: string
}

export interface PartnerLeadsResponse {
  leads: any[] // Will use CoverageLead type from existing types
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PartnerAnalytics {
  total_leads: number
  converted_leads: number
  conversion_rate: number
  total_commission: number
  pending_commission: number
  paid_commission: number
  active_leads: number
  this_month_leads: number
  this_month_conversions: number
}

export interface PartnerDashboardData {
  partner: Partner
  analytics: PartnerAnalytics
  recent_leads: any[]
  recent_activities: PartnerLeadActivity[]
  pending_documents: PartnerKYCDocument[]
}

// ============================================
// FILTER & QUERY INTERFACES
// ============================================

export interface PartnerLeadsFilter {
  status?: string
  page?: number
  limit?: number
  search?: string
  date_from?: string
  date_to?: string
}

export interface PartnerActivityFilter {
  lead_id?: string
  activity_type?: ActivityType
  date_from?: string
  date_to?: string
  limit?: number
}

// ============================================
// VALIDATION SCHEMAS (for use with Zod)
// ============================================

export const BUSINESS_TYPES: BusinessType[] = ['sole_proprietor', 'company', 'partnership']
export const DOCUMENT_TYPES: DocumentType[] = [
  'id_document',
  'proof_of_address',
  'business_registration',
  'tax_certificate',
  'bank_statement',
  'other',
]
export const ACTIVITY_TYPES: ActivityType[] = [
  'call',
  'email',
  'meeting',
  'quote_sent',
  'follow_up',
  'note',
]

// ============================================
// UTILITY TYPES
// ============================================

export type PartnerWithDocuments = Partner & {
  documents: PartnerKYCDocument[]
}

export type PartnerWithMetrics = Partner & {
  analytics: PartnerAnalytics
}

// Human-readable labels for enums
export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  pending: 'Pending Review',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  sole_proprietor: 'Sole Proprietor',
  company: 'Company',
  partnership: 'Partnership',
}

export const KYC_STATUS_LABELS: Record<KYCStatus, string> = {
  incomplete: 'Incomplete',
  submitted: 'Submitted',
  verified: 'Verified',
  rejected: 'Rejected',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id_document: 'ID Document',
  proof_of_address: 'Proof of Address',
  business_registration: 'Business Registration',
  tax_certificate: 'Tax Certificate',
  bank_statement: 'Bank Statement',
  other: 'Other',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Phone Call',
  email: 'Email',
  meeting: 'Meeting',
  quote_sent: 'Quote Sent',
  follow_up: 'Follow-up',
  note: 'Note',
}
