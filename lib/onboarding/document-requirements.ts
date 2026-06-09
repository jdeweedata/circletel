// kyc_document_type enum values: id_document, proof_of_address, bank_statement,
// company_registration, tax_certificate, vat_certificate, director_id, shareholder_agreement, other
export type KycDocType =
  | 'id_document' | 'proof_of_address' | 'bank_statement' | 'company_registration'
  | 'tax_certificate' | 'vat_certificate' | 'director_id' | 'shareholder_agreement' | 'other';

export type B2BSegment = 'unjani' | 'smb' | 'edu';

export interface DocRequirement {
  type: KycDocType;
  label: string;
  required: boolean;
}

export interface EntityContext {
  vatRegistered: boolean;
  entityType: string; // matches wizard step-2 entityType options
}

/** Required supporting documents for a B2B segment, given the entity context. */
export function requiredDocsFor(_segment: B2BSegment, ctx: EntityContext): DocRequirement[] {
  const isSoleProp = ctx.entityType === 'Sole Proprietor';
  const docs: DocRequirement[] = [];
  if (isSoleProp) {
    docs.push({ type: 'director_id', label: 'Owner ID document', required: true });
  } else {
    docs.push({ type: 'company_registration', label: 'CIPC registration certificate', required: true });
    docs.push({ type: 'director_id', label: 'Director / owner ID', required: true });
  }
  docs.push({ type: 'bank_statement', label: 'Bank confirmation letter or statement', required: true });
  docs.push({ type: 'proof_of_address', label: 'Proof of business address', required: true });
  if (ctx.vatRegistered) {
    docs.push({ type: 'vat_certificate', label: 'VAT registration certificate', required: true });
  }
  return docs;
}

export type VettingStatus = 'not_started' | 'documents_pending' | 'under_review' | 'approved' | 'rejected' | 'expired';

interface DocStatusRow { document_type: string; verification_status: string }

/** Roll up per-document statuses into the account-level vetting status. */
export function computeVettingStatus(requiredTypes: string[], docs: DocStatusRow[]): VettingStatus {
  if (docs.length === 0) return 'documents_pending';
  if (docs.some(d => d.verification_status === 'rejected')) return 'rejected';
  const statusByType = new Map(docs.map(d => [d.document_type, d.verification_status]));
  const allApproved = requiredTypes.every(t => statusByType.get(t) === 'approved');
  if (allApproved) return 'approved';
  return 'under_review';
}
