/**
 * FICA/CIPC Compliance Requirements for Partner Onboarding
 *
 * Defines required documents based on South African business compliance regulations:
 * - FICA (Financial Intelligence Centre Act)
 * - CIPC (Companies and Intellectual Property Commission)
 * - SARS (South African Revenue Service)
 * - Banking verification
 *
 * Document requirements vary by business type:
 * - sole_proprietor: Individual compliance
 * - company: Full CIPC + corporate compliance
 * - partnership: Partnership compliance
 */

export type BusinessType = 'sole_proprietor' | 'company' | 'partnership';

export type DocumentCategory =
  | 'fica_identity'       // FICA: ID documents, passports
  | 'fica_address'        // FICA: Proof of residential address
  | 'cipc_registration'   // CIPC: CK1, CoR 14.3, Company Registration
  | 'cipc_profile'        // CIPC: Company Profile (recent)
  | 'cipc_directors'      // CIPC: CM1, List of Directors
  | 'cipc_founding'       // CIPC: MOI, Founding Statement
  | 'tax_clearance'       // SARS: Tax Clearance Certificate
  | 'vat_registration'    // SARS: VAT Registration Certificate
  | 'bank_confirmation'   // Banking: Bank confirmation letter
  | 'bank_statement'      // Banking: Cancelled cheque or statement
  | 'business_address'    // Business: Proof of business address
  | 'authorization'       // Business: Resolution, signatory authorization
  | 'other';              // Other supporting documents

export interface ComplianceDocument {
  category: DocumentCategory;
  title: string;
  description: string;
  examples: string[];
  required: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
  expiryRequired: boolean;
  notes?: string;
}

/**
 * FICA/CIPC Document Requirements by Business Type
 */
export const COMPLIANCE_REQUIREMENTS: Record<BusinessType, ComplianceDocument[]> = {
  /**
   * SOLE PROPRIETOR Requirements
   * Individual trading under own name or trading name
   */
  sole_proprietor: [
    // === FICA DOCUMENTS ===
    {
      category: 'fica_identity',
      title: 'Identity Document',
      description: 'South African ID, passport, or driver\'s license',
      examples: ['South African ID (green book)', 'Valid passport', 'Driver\'s license (card format)'],
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMB: 5,
      expiryRequired: true,
      notes: 'Must be clear and legible. All corners visible.'
    },
    {
      category: 'fica_address',
      title: 'Proof of Residential Address',
      description: 'Recent proof of residential address (not older than 3 months)',
      examples: ['Municipal rates bill', 'Utility bill (water, electricity)', 'Bank statement showing address', 'Lease agreement'],
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Must not be older than 3 months'
    },

    // === TAX COMPLIANCE ===
    {
      category: 'tax_clearance',
      title: 'Tax Clearance Certificate',
      description: 'SARS Tax Clearance Certificate or Tax Compliance Status',
      examples: ['SARS Tax Clearance Certificate', 'Tax Compliance Status (TCS) PIN'],
      required: false,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: true,
      notes: 'Recommended for business credibility'
    },

    // === BANKING ===
    {
      category: 'bank_confirmation',
      title: 'Bank Confirmation Letter',
      description: 'Letter from bank confirming account ownership',
      examples: ['Bank confirmation letter on letterhead', 'Proof of banking details'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Must be dated within last 3 months'
    },
    {
      category: 'bank_statement',
      title: 'Bank Statement or Cancelled Cheque',
      description: 'Recent bank statement or cancelled cheque for account verification',
      examples: ['Bank statement (last 3 months)', 'Cancelled cheque', 'Proof of banking details printout'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Ensure account number is visible'
    },

    // === BUSINESS ADDRESS ===
    {
      category: 'business_address',
      title: 'Proof of Business Address',
      description: 'Proof of business operating address',
      examples: ['Lease agreement', 'Utility bill in business name', 'Rates clearance certificate'],
      required: false,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Required if different from residential address'
    },
  ],

  /**
   * COMPANY (PTY LTD) Requirements
   * Registered company with CIPC
   */
  company: [
    // === FICA DOCUMENTS (for Directors/Authorized Signatories) ===
    {
      category: 'fica_identity',
      title: 'Identity Documents (All Directors)',
      description: 'ID copies of all directors and authorized signatories',
      examples: ['South African IDs of all directors', 'Passports for foreign directors'],
      required: true,
      acceptedFormats: ['PDF', 'ZIP'],
      maxSizeMB: 20,
      expiryRequired: true,
      notes: 'Upload all directors in single file or ZIP archive'
    },
    {
      category: 'fica_address',
      title: 'Proof of Address (All Directors)',
      description: 'Residential address proof for all directors',
      examples: ['Utility bills', 'Bank statements', 'Municipal accounts'],
      required: true,
      acceptedFormats: ['PDF', 'ZIP'],
      maxSizeMB: 20,
      expiryRequired: false,
      notes: 'Not older than 3 months for each director'
    },

    // === CIPC REGISTRATION DOCUMENTS ===
    {
      category: 'cipc_registration',
      title: 'Company Registration Certificate (CK1 / CoR 14.3)',
      description: 'Official CIPC company registration certificate',
      examples: ['CK1 (old format)', 'CoR 14.3 (new format)', 'Notice of Incorporation'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Original CIPC registration document'
    },
    {
      category: 'cipc_profile',
      title: 'CIPC Company Profile (Recent)',
      description: 'Company profile from CIPC website (not older than 3 months)',
      examples: ['CIPC company profile printout', 'Company status report from CIPC'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Download from CIPC website - must be recent (< 3 months)'
    },
    {
      category: 'cipc_directors',
      title: 'List of Directors (CM1)',
      description: 'Official list of company directors registered with CIPC',
      examples: ['CM1 form', 'CoR 21.2 (Director appointment)', 'CIPC directors list'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Must match current CIPC records'
    },
    {
      category: 'cipc_founding',
      title: 'Memorandum of Incorporation (MOI)',
      description: 'Company MOI or founding documents',
      examples: ['Memorandum of Incorporation', 'Articles of Association (old format)', 'Company constitution'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Current version as registered with CIPC'
    },

    // === TAX COMPLIANCE ===
    {
      category: 'tax_clearance',
      title: 'Tax Clearance Certificate',
      description: 'SARS Tax Clearance Certificate for the company',
      examples: ['Tax Clearance Certificate', 'Tax Compliance Status (TCS) with PIN'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: true,
      notes: 'Required for company contracts. Verify with SARS TCS PIN.'
    },
    {
      category: 'vat_registration',
      title: 'VAT Registration Certificate',
      description: 'VAT registration if company is VAT registered',
      examples: ['VAT Registration Certificate from SARS', 'VAT 103 form'],
      required: false,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Only if VAT registered (turnover > R1 million)'
    },

    // === BANKING ===
    {
      category: 'bank_confirmation',
      title: 'Bank Confirmation Letter',
      description: 'Bank letter confirming company account ownership',
      examples: ['Bank confirmation on letterhead', 'Account verification letter'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Must be on bank letterhead with stamp'
    },
    {
      category: 'bank_statement',
      title: 'Company Bank Statement',
      description: 'Recent company bank statement',
      examples: ['Company bank statement (last 3 months)', 'Cancelled company cheque'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Must show company name and account number'
    },

    // === BUSINESS ADDRESS ===
    {
      category: 'business_address',
      title: 'Proof of Business Address',
      description: 'Proof of company\'s physical business address',
      examples: ['Lease agreement', 'Utility bill in company name', 'Rates certificate', 'CK2 (Registered office)'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Must match registered CIPC address or provide CK2 for updates'
    },

    // === AUTHORIZATION ===
    {
      category: 'authorization',
      title: 'Resolution to Enter Agreement',
      description: 'Board resolution authorizing partnership with CircleTel',
      examples: ['Board resolution', 'Director authorization letter', 'CM29 (Special resolution)'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Must be signed by all directors or as per MOI requirements'
    },
  ],

  /**
   * PARTNERSHIP Requirements
   * Partnership agreement between partners
   */
  partnership: [
    // === FICA DOCUMENTS (for All Partners) ===
    {
      category: 'fica_identity',
      title: 'Identity Documents (All Partners)',
      description: 'ID copies of all partners',
      examples: ['South African IDs of all partners', 'Passports for foreign partners'],
      required: true,
      acceptedFormats: ['PDF', 'ZIP'],
      maxSizeMB: 20,
      expiryRequired: true,
      notes: 'Upload all partners in single file or ZIP archive'
    },
    {
      category: 'fica_address',
      title: 'Proof of Address (All Partners)',
      description: 'Residential address proof for all partners',
      examples: ['Utility bills', 'Bank statements', 'Municipal accounts'],
      required: true,
      acceptedFormats: ['PDF', 'ZIP'],
      maxSizeMB: 20,
      expiryRequired: false,
      notes: 'Not older than 3 months for each partner'
    },

    // === PARTNERSHIP AGREEMENT ===
    {
      category: 'cipc_founding',
      title: 'Partnership Agreement',
      description: 'Signed partnership agreement between all partners',
      examples: ['Partnership agreement', 'Partnership deed', 'Memorandum of partnership'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Must be signed by all partners'
    },

    // === TAX COMPLIANCE ===
    {
      category: 'tax_clearance',
      title: 'Tax Clearance Certificate',
      description: 'Tax clearance for the partnership',
      examples: ['Partnership Tax Clearance', 'Tax Compliance Status'],
      required: false,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: true,
      notes: 'Recommended for business credibility'
    },

    // === BANKING ===
    {
      category: 'bank_confirmation',
      title: 'Bank Confirmation Letter',
      description: 'Bank letter confirming partnership account',
      examples: ['Bank confirmation letter', 'Account verification'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Must show all partners as signatories'
    },
    {
      category: 'bank_statement',
      title: 'Partnership Bank Statement',
      description: 'Recent partnership bank statement',
      examples: ['Bank statement', 'Cancelled cheque'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Must show partnership name and account number'
    },

    // === BUSINESS ADDRESS ===
    {
      category: 'business_address',
      title: 'Proof of Business Address',
      description: 'Proof of partnership\'s business address',
      examples: ['Lease agreement', 'Utility bill', 'Rates certificate'],
      required: false,
      acceptedFormats: ['PDF'],
      maxSizeMB: 10,
      expiryRequired: false,
      notes: 'Required if operating from dedicated premises'
    },

    // === AUTHORIZATION ===
    {
      category: 'authorization',
      title: 'Partner Authorization',
      description: 'Authorization from all partners to enter agreement',
      examples: ['Signed authorization letter', 'Partner resolution', 'Consent from all partners'],
      required: true,
      acceptedFormats: ['PDF'],
      maxSizeMB: 5,
      expiryRequired: false,
      notes: 'Must be signed by all partners'
    },
  ],
};

/**
 * Get required documents for a specific business type
 */
export function getRequiredDocuments(businessType: BusinessType): ComplianceDocument[] {
  return COMPLIANCE_REQUIREMENTS[businessType].filter(doc => doc.required);
}

/**
 * Get optional documents for a specific business type
 */
export function getOptionalDocuments(businessType: BusinessType): ComplianceDocument[] {
  return COMPLIANCE_REQUIREMENTS[businessType].filter(doc => !doc.required);
}

/**
 * Get all documents for a specific business type
 */
export function getAllDocuments(businessType: BusinessType): ComplianceDocument[] {
  return COMPLIANCE_REQUIREMENTS[businessType];
}

/**
 * Get document by category for a specific business type
 */
export function getDocumentByCategory(
  businessType: BusinessType,
  category: DocumentCategory
): ComplianceDocument | undefined {
  return COMPLIANCE_REQUIREMENTS[businessType].find(doc => doc.category === category);
}

/**
 * Calculate compliance completion percentage
 */
export function calculateComplianceProgress(
  businessType: BusinessType,
  uploadedCategories: DocumentCategory[]
): number {
  const required = getRequiredDocuments(businessType);
  const uploadedRequired = required.filter(doc =>
    uploadedCategories.includes(doc.category)
  );

  if (required.length === 0) return 100;
  return Math.round((uploadedRequired.length / required.length) * 100);
}

/**
 * Get missing required documents
 */
export function getMissingRequiredDocuments(
  businessType: BusinessType,
  uploadedCategories: DocumentCategory[]
): ComplianceDocument[] {
  const required = getRequiredDocuments(businessType);
  return required.filter(doc => !uploadedCategories.includes(doc.category));
}

/**
 * Check if compliance is complete
 */
export function isComplianceComplete(
  businessType: BusinessType,
  uploadedCategories: DocumentCategory[]
): boolean {
  return getMissingRequiredDocuments(businessType, uploadedCategories).length === 0;
}
