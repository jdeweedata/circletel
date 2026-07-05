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
  /** Extra kyc_document_type values that also satisfy this requirement. The enum
   *  carries both `id_document` and `director_id` for the owner/director ID, and
   *  uploads use either — so the slot must accept both. */
  aliases?: KycDocType[];
}

/** True when an uploaded document's type satisfies a requirement (incl. aliases). */
export function documentMatchesRequirement(
  documentType: string,
  requirement: DocRequirement,
): boolean {
  return (
    documentType === requirement.type ||
    (requirement.aliases?.includes(documentType as KycDocType) ?? false)
  );
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
    docs.push({ type: 'director_id', label: 'Owner ID document', required: true, aliases: ['id_document'] });
  } else {
    docs.push({ type: 'company_registration', label: 'CIPC registration certificate', required: true });
    docs.push({ type: 'director_id', label: 'Director / owner ID', required: true, aliases: ['id_document'] });
  }
  docs.push({ type: 'bank_statement', label: 'Bank confirmation letter or statement', required: true });
  docs.push({ type: 'proof_of_address', label: 'Proof of business address', required: true });
  docs.push({
    type: 'vat_certificate',
    label: 'VAT registration certificate',
    required: false,
  });
  return docs;
}

export type VettingStatus = 'not_started' | 'documents_pending' | 'under_review' | 'approved' | 'rejected' | 'expired';

interface DocStatusRow { document_type: string; verification_status: string }

/** Roll up per-document statuses into the account-level vetting status.
 *  Alias-aware: a requirement is satisfied by its `type` OR any of its `aliases`. */
export function computeVettingStatus(requirements: DocRequirement[], docs: DocStatusRow[]): VettingStatus {
  if (docs.length === 0) return 'documents_pending';
  const statusFor = (req: DocRequirement): string | undefined =>
    docs.find(d => documentMatchesRequirement(d.document_type, req))?.verification_status;
  if (requirements.some(req => statusFor(req) === 'rejected')) return 'rejected';
  const allApproved = requirements.every(req => statusFor(req) === 'approved');
  if (allApproved) return 'approved';
  return 'under_review';
}
