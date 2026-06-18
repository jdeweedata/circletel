import {
  ALLOWED_DOC_TYPES,
  validateDocumentUpload,
  MAX_DOC_BYTES,
} from '@/lib/onboarding/document-upload';

describe('validateDocumentUpload', () => {
  const ok = { documentType: 'company_registration', fileType: 'application/pdf', fileSize: 1000 };

  it('accepts a valid pdf of an allowed type', () => {
    expect(validateDocumentUpload(ok)).toEqual({ valid: true });
  });
  it('rejects an unknown document type', () => {
    expect(validateDocumentUpload({ ...ok, documentType: 'nope' }).valid).toBe(false);
  });
  it('rejects a disallowed file type', () => {
    expect(validateDocumentUpload({ ...ok, fileType: 'text/csv' }).valid).toBe(false);
  });
  it('rejects a file over the size limit', () => {
    expect(validateDocumentUpload({ ...ok, fileSize: MAX_DOC_BYTES + 1 }).valid).toBe(false);
  });
  it('exposes the allowed types list', () => {
    expect(ALLOWED_DOC_TYPES).toContain('vat_certificate');
    expect(ALLOWED_DOC_TYPES).toContain('proof_of_address');
  });
});
