import {
  MINI_COMPANY_INSTRUCTION,
  formalContractBlockedReason,
  quoteIncludesCpe,
  resolveBusinessQuoteKind,
  resolveCompanyCreditPulls,
  shouldPullCompanyCredit,
  shouldPullMiniCompany,
} from '@/lib/credit-risk/business-gate';

describe('shouldPullCompanyCredit', () => {
  it('does not pull CD32 on draft or unsigned quotes', () => {
    expect(
      shouldPullCompanyCredit({
        signedAt: null,
        termsAccepted: true,
        registrationNumber: '2020/123456/07',
      })
    ).toBe(false);
    expect(
      shouldPullCompanyCredit({
        signedAt: '2026-08-27T12:00:00Z',
        termsAccepted: false,
        registrationNumber: '2020/123456/07',
      })
    ).toBe(false);
  });

  it('pulls CD32 after signed_at and T&Cs with a company number', () => {
    expect(
      shouldPullCompanyCredit({
        signedAt: '2026-08-27T12:00:00Z',
        termsAccepted: true,
        registrationNumber: '2020/123456/07',
      })
    ).toBe(true);
  });
});

describe('resolveCompanyCreditPulls', () => {
  it('returns CD32 on signed + T&Cs and never Mini company', () => {
    const pulls = resolveCompanyCreditPulls({
      signedAt: '2026-08-27T12:00:00Z',
      termsAccepted: true,
      registrationNumber: '2020/123456/07',
      quoteKind: 'skip',
      directorDocsReady: false,
      directorIsPayer: false,
    });
    expect(pulls).toEqual(['CD32']);
    expect(pulls).not.toContain(MINI_COMPANY_INSTRUCTION);
    expect(shouldPullMiniCompany()).toBe(false);
  });

  it('adds CD31 after director docs on a credit quote, and CD23 if the director pays', () => {
    expect(
      resolveCompanyCreditPulls({
        signedAt: '2026-08-27T12:00:00Z',
        termsAccepted: true,
        registrationNumber: '2020/123456/07',
        quoteKind: 'credit',
        directorDocsReady: true,
        directorIsPayer: false,
      })
    ).toEqual(['CD32', 'CD31']);
    expect(
      resolveCompanyCreditPulls({
        signedAt: '2026-08-27T12:00:00Z',
        termsAccepted: true,
        registrationNumber: '2020/123456/07',
        quoteKind: 'credit',
        directorDocsReady: true,
        directorIsPayer: true,
      })
    ).toEqual(['CD32', 'CD31', 'CD23']);
  });

  it('does not pull CD31 on a prepaid SIM-only company', () => {
    expect(
      resolveCompanyCreditPulls({
        signedAt: '2026-08-27T12:00:00Z',
        termsAccepted: true,
        registrationNumber: '2020/123456/07',
        quoteKind: 'skip',
        directorDocsReady: true,
        directorIsPayer: true,
      })
    ).toEqual(['CD32']);
  });
});

describe('formalContractBlockedReason', () => {
  it('blocks a credit quote until a company result exists', () => {
    expect(
      formalContractBlockedReason({
        quoteKind: 'credit',
        review: null,
      })
    ).toMatch(/credit review/i);
    expect(
      formalContractBlockedReason({
        quoteKind: 'credit',
        review: { decision: 'UNCHECKED' },
      })
    ).toMatch(/company result/i);
  });

  it('allows a prepaid SIM-only quote without a review', () => {
    expect(
      formalContractBlockedReason({
        quoteKind: 'skip',
        review: null,
      })
    ).toBeNull();
  });

  it('allows PASS and MARGINAL; blocks HARD_FAIL and FAIL', () => {
    expect(
      formalContractBlockedReason({
        quoteKind: 'credit',
        review: { decision: 'PASS' },
      })
    ).toBeNull();
    expect(
      formalContractBlockedReason({
        quoteKind: 'credit',
        review: { decision: 'HARD_FAIL' },
      })
    ).toMatch(/HARD_FAIL/);
  });
});

describe('resolveBusinessQuoteKind and CPE', () => {
  it('treats on-account or CPE as credit and prepaid SIM-only as skip', () => {
    expect(resolveBusinessQuoteKind({ onAccount: true })).toBe('credit');
    expect(resolveBusinessQuoteKind({ includesCpe: true })).toBe('credit');
    expect(resolveBusinessQuoteKind({ contractTerm: 24 })).toBe('credit');
    expect(resolveBusinessQuoteKind({ prepaidSimOnly: true })).toBe('skip');
  });

  it('detects CPE from quote line items', () => {
    expect(
      quoteIncludesCpe([{ product_category: 'hardware', service_type: '5g', service_name: 'G5C' }])
    ).toBe(true);
    expect(
      quoteIncludesCpe([{ product_category: 'fibre_business', service_type: 'skyfibre', service_name: 'SME 50' }])
    ).toBe(false);
  });
});
