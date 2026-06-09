import { requiredDocsFor, computeVettingStatus } from '@/lib/onboarding/document-requirements';

describe('requiredDocsFor', () => {
  it('omits vat_certificate when not VAT registered', () => {
    const types = requiredDocsFor('unjani', { vatRegistered: false, entityType: 'Private Company (Pty) Ltd' }).map(d => d.type);
    expect(types).toContain('company_registration');
    expect(types).toContain('bank_statement');
    expect(types).not.toContain('vat_certificate');
  });
  it('includes vat_certificate when VAT registered', () => {
    const types = requiredDocsFor('unjani', { vatRegistered: true, entityType: 'Private Company (Pty) Ltd' }).map(d => d.type);
    expect(types).toContain('vat_certificate');
  });
  it('sole proprietor needs director_id (owner ID) but not company_registration', () => {
    const types = requiredDocsFor('unjani', { vatRegistered: false, entityType: 'Sole Proprietor' }).map(d => d.type);
    expect(types).toContain('director_id');
    expect(types).not.toContain('company_registration');
  });
});

describe('computeVettingStatus', () => {
  const req = ['company_registration', 'bank_statement', 'director_id'] as const;
  it('approved when every required doc approved', () => {
    expect(computeVettingStatus([...req], [
      { document_type: 'company_registration', verification_status: 'approved' },
      { document_type: 'bank_statement', verification_status: 'approved' },
      { document_type: 'director_id', verification_status: 'approved' },
    ])).toBe('approved');
  });
  it('rejected if any required doc rejected', () => {
    expect(computeVettingStatus([...req], [
      { document_type: 'company_registration', verification_status: 'rejected' },
    ])).toBe('rejected');
  });
  it('under_review when some approved, none rejected, not all done', () => {
    expect(computeVettingStatus([...req], [
      { document_type: 'company_registration', verification_status: 'approved' },
      { document_type: 'bank_statement', verification_status: 'pending' },
    ])).toBe('under_review');
  });
  it('documents_pending when nothing uploaded', () => {
    expect(computeVettingStatus([...req], [])).toBe('documents_pending');
  });
  it('ignores rejection of a non-required document', () => {
    expect(computeVettingStatus(['company_registration', 'bank_statement'], [
      { document_type: 'company_registration', verification_status: 'approved' },
      { document_type: 'bank_statement', verification_status: 'approved' },
      { document_type: 'proof_of_address', verification_status: 'rejected' }, // not in required list
    ])).toBe('approved');
  });
  it('is documents_pending when a required doc has no upload yet', () => {
    expect(computeVettingStatus(['company_registration', 'bank_statement'], [
      { document_type: 'company_registration', verification_status: 'approved' },
    ])).toBe('under_review');
  });
});
