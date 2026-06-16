import { buildDocumentMetadataDraft } from '../page';

describe('buildDocumentMetadataDraft', () => {
  it('derives a reviewer-friendly metadata draft from the selected document', () => {
    const draft = buildDocumentMetadataDraft(
      'Bank confirmation letter or statement',
      {
        id: 'doc-1',
        document_type: 'bank_statement',
        file_path: 'kyc/customer/bank-confirmation.pdf',
        verification_status: 'pending',
        rejection_reason: null,
        verified_at: null,
      },
      'https://signed.example.com/bank-confirmation.pdf',
      true
    );

    expect(draft).toEqual({
      title: 'Bank confirmation letter or statement',
      description: 'Review bank_statement for KYC/KYB approval.',
      tags: ['bank_statement', 'pending', 'pdf'],
      access: 'KYC reviewers only',
      fileType: 'PDF',
    });
  });
});
