/**
 * Shared validation for admin manual document uploads. Mirrors the wizard's
 * upload limits (jpg/png/pdf, <=5MB) and the kyc_documents.document_type enum.
 */
export const ALLOWED_DOC_TYPES = [
  'company_registration',
  'vat_certificate',
  'tax_certificate',
  'bank_statement',
  'id_document',
  'director_id',
  'proof_of_address',
  'shareholder_agreement',
  'other',
] as const;

export type DocType = (typeof ALLOWED_DOC_TYPES)[number];

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
export const MAX_DOC_BYTES = 5 * 1024 * 1024;

/** Friendly labels for the admin picker (subset shown in the modal). */
export const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'company_registration', label: 'Company registration (CIPC)' },
  { value: 'vat_certificate', label: 'VAT certificate' },
  { value: 'tax_certificate', label: 'Tax certificate' },
  { value: 'bank_statement', label: 'Bank confirmation / statement' },
  { value: 'id_document', label: 'Owner / Director ID' },
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'other', label: 'Other' },
];

export function validateDocumentUpload(input: {
  documentType: string;
  fileType: string;
  fileSize: number;
}): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_DOC_TYPES.includes(input.documentType as DocType)) {
    return { valid: false, error: `Invalid document type: ${input.documentType}` };
  }
  if (!ALLOWED_FILE_TYPES.includes(input.fileType)) {
    return { valid: false, error: 'File must be a JPG, PNG, or PDF' };
  }
  if (input.fileSize > MAX_DOC_BYTES) {
    return { valid: false, error: 'File must be 5MB or smaller' };
  }
  return { valid: true };
}
