import {
  buildDocumentDrawerSummary,
  buildDocumentMetadataDraft,
  buildVettingSummaryItems,
} from '../workbench-utils';

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

describe('buildVettingSummaryItems', () => {
  it('formats compact reviewer status items for the workbench header', () => {
    const items = buildVettingSummaryItems({
      approved: 2,
      total: 5,
      needsDecision: 3,
      missing: 1,
      changesRequested: 1,
      lastReviewedAt: '2026-06-12T15:27:00',
    });

    expect(items).toEqual([
      {
        label: 'Approved',
        value: '2/5',
        helper: 'Required docs',
        tone: 'neutral',
      },
      {
        label: 'Needs decision',
        value: '3',
        helper: '1 changes requested',
        tone: 'warning',
      },
      {
        label: 'Missing',
        value: '1',
        helper: 'Required uploads',
        tone: 'danger',
      },
      {
        label: 'Last reviewed',
        value: '12 Jun 2026',
        helper: '15:27',
        tone: 'neutral',
      },
    ]);
  });
});

describe('buildDocumentDrawerSummary', () => {
  it('builds the document drawer title and subtitle from the selected document context', () => {
    const summary = buildDocumentDrawerSummary({
      requirementLabel: 'CIPC registration certificate',
      documentType: 'company_registration',
      fileType: 'Image',
    });

    expect(summary).toEqual({
      title: 'CIPC registration certificate',
      subtitle: 'Image · company_registration',
    });
  });
});
