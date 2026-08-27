import {
  canProcessCreditDeal,
  resolveConsumerDealKind,
  shouldPullConsumerCredit,
  skuFromOrder,
  validateDualControlOverride,
} from '@/lib/credit-risk/consumer-gate';

describe('skuFromOrder', () => {
  it('reads a catalogue SKU from metadata or the package name', () => {
    expect(skuFromOrder({ metadata: { sku: 'CC-5G-M2M-FWA' } })).toBe('CC-5G-M2M-FWA');
    expect(skuFromOrder({ package_name: 'CircleConnect 5G 60 Mbps CC-5G-CON-060' })).toBe(
      'CC-5G-CON-060'
    );
  });
});

describe('resolveConsumerDealKind', () => {
  it('classifies catalogue Contract Router Deals as credit', () => {
    expect(resolveConsumerDealKind({ sku: 'CC-5G-CON-060', routerIncluded: true })).toBe(
      'credit'
    );
    expect(resolveConsumerDealKind({ sku: 'CC-5G-CON-035', routerIncluded: true })).toBe(
      'credit'
    );
  });

  it('classifies SIM-only / Cash CPE / BYO as skip', () => {
    expect(resolveConsumerDealKind({ sku: 'CC-5G-M2M-FWA', routerIncluded: false })).toBe(
      'skip'
    );
    expect(resolveConsumerDealKind({ sku: 'CC-5G-M2M-035', hardwarePath: 'cash_cpe' })).toBe(
      'skip'
    );
    expect(resolveConsumerDealKind({ sku: 'CC-5G-M2M-035', hardwarePath: 'byo' })).toBe(
      'skip'
    );
  });

  it('treats on-account or 24-month without catalogue hit as credit', () => {
    expect(
      resolveConsumerDealKind({
        routerIncluded: true,
        contractDuration: '24-month',
      })
    ).toBe('credit');
    expect(resolveConsumerDealKind({ onAccount: true })).toBe('credit');
  });
});

describe('shouldPullConsumerCredit', () => {
  it('does not pull CD11 on SIM-only / Cash CPE / BYO', () => {
    expect(
      shouldPullConsumerCredit({
        dealKind: 'skip',
        kycReady: true,
        consent: true,
      })
    ).toBe(false);
  });

  it('does not pull until account KYC and consent are in', () => {
    expect(
      shouldPullConsumerCredit({
        dealKind: 'credit',
        kycReady: false,
        consent: true,
      })
    ).toBe(false);
    expect(
      shouldPullConsumerCredit({
        dealKind: 'credit',
        kycReady: true,
        consent: false,
      })
    ).toBe(false);
  });

  it('pulls CD11 on a credit Deal after KYC + consent', () => {
    expect(
      shouldPullConsumerCredit({
        dealKind: 'credit',
        kycReady: true,
        consent: true,
      })
    ).toBe(true);
  });
});

describe('canProcessCreditDeal', () => {
  it('lets prepaid SIM-only process without a review', () => {
    expect(canProcessCreditDeal({ dealKind: 'skip', review: null })).toEqual({
      ok: true,
      unlockTerm: false,
    });
  });

  it('blocks process on a credit Deal with no review', () => {
    const result = canProcessCreditDeal({ dealKind: 'credit', review: null });
    expect(result.ok).toBe(false);
    expect(result.unlockTerm).toBe(false);
    expect(result.reason).toMatch(/review/i);
  });

  it('does not unlock 24-month or subsidised router on pull timeout', () => {
    const result = canProcessCreditDeal({
      dealKind: 'credit',
      review: null,
      pullTimedOut: true,
    });
    expect(result.ok).toBe(false);
    expect(result.unlockTerm).toBe(false);
    expect(result.fallback).toBe('sim_only_or_cash_cpe');
  });

  it('allows process after a PASS review on a credit Deal', () => {
    expect(
      canProcessCreditDeal({
        dealKind: 'credit',
        review: { decision: 'PASS' },
      }).ok
    ).toBe(true);
  });
});

describe('validateDualControlOverride', () => {
  const md = { role: 'md' as const, adminId: '11111111-1111-1111-1111-111111111111' };
  const cfo = { role: 'cfo' as const, adminId: '22222222-2222-2222-2222-222222222222' };

  it('rejects sales and a single sign-off', () => {
    expect(
      validateDualControlOverride({
        actorRole: 'editor',
        signoffs: [md, cfo],
        reason: 'Customer is current on debt review',
        requestedDecision: 'PASS',
        flags: { debt_review: true },
        hardwarePrepaid: true,
      }).ok
    ).toBe(false);
    expect(
      validateDualControlOverride({
        actorRole: 'super_admin',
        signoffs: [md],
        reason: 'Need this order',
        requestedDecision: 'PASS',
        flags: { debt_review: true },
        hardwarePrepaid: true,
      }).ok
    ).toBe(false);
  });

  it('rejects the same admin signing as both MD and CFO', () => {
    expect(
      validateDualControlOverride({
        actorRole: 'super_admin',
        signoffs: [md, { role: 'cfo', adminId: md.adminId }],
        reason: 'Customer is current on debt review',
        requestedDecision: 'PASS',
        flags: { debt_review: true },
        hardwarePrepaid: true,
      }).ok
    ).toBe(false);
  });

  it('accepts MD + CFO with a written reason; financed router still needs prepaid', () => {
    const accepted = validateDualControlOverride({
      actorRole: 'super_admin',
      signoffs: [md, cfo],
      reason: 'Clearance pending; hardware prepaid; SIM-only activate.',
      requestedDecision: 'PASS',
      flags: { debt_review: true },
      hardwarePrepaid: true,
    });
    expect(accepted.ok).toBe(true);

    const noPrepaid = validateDualControlOverride({
      actorRole: 'super_admin',
      signoffs: [md, cfo],
      reason: 'Clearance pending.',
      requestedDecision: 'PASS',
      flags: { debt_review: true },
      hardwarePrepaid: false,
    });
    expect(noPrepaid.ok).toBe(false);
    expect(noPrepaid.reason).toMatch(/prepaid/i);
  });
});
