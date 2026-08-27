import {
  persistCompanyCreditPullOnQuote,
  quoteReviewInputFromCompanyPull,
  runSignedQuoteCompanyPull,
} from '@/lib/credit-risk/quote-company-pull';
import { inferPrepaidSimOnly, quoteKindFromQuote } from '@/lib/credit-risk/business-gate';

describe('quoteReviewInputFromCompanyPull', () => {
  it('writes the company decision instead of leaving UNCHECKED', () => {
    const input = quoteReviewInputFromCompanyPull({
      businessQuoteId: 'quote-1',
      purpose: 'CD32',
      existing: {
        business_quote_id: 'quote-1',
        decision: 'UNCHECKED',
        flags: {},
        financed_router_allowed: false,
        term_24_month_allowed: false,
        hardware_prepaid: true,
        alternatives: [],
        private_note: 'Customer paid the G5C.',
      },
      pull: {
        fileToken: 'FILE-32',
        pdfStoragePath: '.private/credit-risk/FILE-32.pdf',
        flags: { judgements: false, score: 640, no_score: false },
        decision: 'PASS',
      },
    });

    expect(input.decision).toBe('PASS');
    expect(input.transaction_id).toBe('FILE-32');
    expect(input.hardware_prepaid).toBe(true);
    expect(input.private_note).toBe('Customer paid the G5C.');
    expect(input.bureau).toBe('CIPC');
  });
});

describe('runSignedQuoteCompanyPull', () => {
  it('upserts the pull result onto the quote', async () => {
    const upsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { business_quote_id: 'quote-1', decision: 'PASS' },
          error: null,
        }),
      }),
    });
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'quote_credit_reviews') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            upsert,
          };
        }
        return {};
      }),
    };

    const review = await runSignedQuoteCompanyPull({
      supabase,
      quoteId: 'quote-1',
      registrationNumber: '2020/123456/07',
      accountReference: 'BQ-1',
      purpose: 'CD32',
      requestCompany: jest.fn().mockResolvedValue({
        fileToken: 'FILE-32',
        pdfStoragePath: null,
        flags: { score: 640, no_score: false },
        decision: 'PASS',
      }),
    });

    expect(review.decision).toBe('PASS');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_quote_id: 'quote-1',
        decision: 'PASS',
        transaction_id: 'FILE-32',
      }),
      { onConflict: 'business_quote_id' }
    );
  });
});

describe('persistCompanyCreditPullOnQuote', () => {
  it('keeps prepaid fields when the pull lands', async () => {
    const upsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { business_quote_id: 'quote-1', decision: 'HARD_FAIL', hardware_prepaid: true },
          error: null,
        }),
      }),
    });
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            business_quote_id: 'quote-1',
            decision: 'UNCHECKED',
            hardware_prepaid: true,
            private_note: 'Paid cash.',
          },
          error: null,
        }),
        upsert,
      }),
    };

    await persistCompanyCreditPullOnQuote(supabase, 'quote-1', {
      fileToken: 'FILE-32',
      pdfStoragePath: null,
      flags: { judgements: true },
      decision: 'HARD_FAIL',
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'HARD_FAIL',
        hardware_prepaid: true,
        private_note: 'Paid cash.',
      }),
      { onConflict: 'business_quote_id' }
    );
  });
});

describe('quoteKindFromQuote', () => {
  it('skips prepaid SIM-only even on a 24-month term', () => {
    expect(
      inferPrepaidSimOnly({
        customerType: 'prepaid',
        items: [{ product_category: 'wireless', service_name: 'FWA 500 SIM-only' }],
      })
    ).toBe(true);
    expect(
      quoteKindFromQuote({
        customerType: 'prepaid',
        contractTerm: 24,
        items: [{ product_category: 'wireless', service_name: 'FWA 500 SIM-only' }],
      })
    ).toBe('skip');
  });

  it('keeps 24-month fibre without CPE on the credit path', () => {
    expect(
      quoteKindFromQuote({
        customerType: 'sme',
        contractTerm: 24,
        items: [{ product_category: 'fibre_business', service_name: 'SME 50' }],
      })
    ).toBe('credit');
  });
});
